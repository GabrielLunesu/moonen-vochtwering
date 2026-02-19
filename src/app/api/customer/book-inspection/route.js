import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/resend';
import { confirmationEmail } from '@/lib/email/templates/confirmation';
import { adminNotificationEmail } from '@/lib/email/templates/admin-notification';
import { generateToken } from '@/lib/utils/tokens';
import { notifyOpsAlert } from '@/lib/ops/alerts';
import { logLeadEvent } from '@/lib/utils/events';
import { syncLeadToGoogleCalendar } from '@/lib/google/calendar';

export async function POST(request) {
  try {
    const { name, email, phone, type_probleem, message, straat, postcode, plaatsnaam, slot_id } =
      await request.json();

    if (!name || !email || !phone || !slot_id) {
      return NextResponse.json(
        { error: 'Naam, e-mail, telefoonnummer en tijdslot zijn verplicht' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Book the slot atomically
    const { data: bookedSlot, error: bookError } = await supabase.rpc('book_availability_slot', {
      p_slot_id: slot_id,
    });

    if (bookError) {
      console.error('[DB_FAIL] /api/customer/book-inspection slot booking:', bookError);
      return NextResponse.json({ error: bookError.message }, { status: 500 });
    }

    if (!bookedSlot?.length) {
      return NextResponse.json(
        { error: 'Dit moment is helaas niet meer beschikbaar.', code: 'SLOT_FULL' },
        { status: 409 }
      );
    }

    const slotDate = bookedSlot[0].slot_date;
    const slotTime = bookedSlot[0].slot_time;

    // Generate tokens
    const availability_token = generateToken();
    const quote_token = generateToken();

    // Build address into message
    let fullMessage = message || '';
    if (straat) {
      const addressLine = `Adres: ${straat}, ${postcode || ''} ${plaatsnaam || ''}`.trim();
      fullMessage = fullMessage ? `${addressLine}\n\n${fullMessage}` : addressLine;
    }

    // Create lead directly with bevestigd status
    const { data: lead, error: insertError } = await supabase
      .from('leads')
      .insert({
        name,
        email,
        phone,
        plaatsnaam: plaatsnaam || null,
        postcode: postcode || null,
        message: fullMessage || null,
        type_probleem: type_probleem || null,
        source: 'website',
        status: 'bevestigd',
        inspection_date: slotDate,
        inspection_time: slotTime,
        availability_slot_id: slot_id,
        availability_token,
        quote_token,
        stage_changed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      // Release booked slot on failure
      await supabase.rpc('release_availability_slot', { p_slot_id: slot_id });
      console.error('[DB_FAIL] /api/customer/book-inspection insert:', insertError);
      await notifyOpsAlert({
        source: '/api/customer/book-inspection',
        message: 'Failed to insert lead after slot booking',
        error: insertError,
        context: { name, phone, slot_id },
      });
      return NextResponse.json({ error: 'Kon aanvraag niet opslaan' }, { status: 500 });
    }

    // Log events
    await logLeadEvent({
      leadId: lead.id,
      eventType: 'lead_received',
      actor: 'customer',
      metadata: { source: 'website', type_probleem: type_probleem || null, direct_booking: true },
    });

    await logLeadEvent({
      leadId: lead.id,
      eventType: 'slot_booked',
      actor: 'customer',
      metadata: { slot_id, date: slotDate, time: slotTime },
    });

    await logLeadEvent({
      leadId: lead.id,
      eventType: 'status_change',
      oldValue: null,
      newValue: 'bevestigd',
      actor: 'customer',
    });

    // Sync to Google Calendar (best-effort)
    syncLeadToGoogleCalendar(lead, 'create');

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://moonenvochtwering.nl';

    // Load email template overrides
    const { data: templateSetting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'email_template_confirmation')
      .single();
    const overrides = templateSetting?.value || {};

    // Send confirmation email to customer
    const emailContent = confirmationEmail({
      name,
      date: slotDate,
      time: slotTime,
      siteUrl,
      token: availability_token,
      overrides,
    });

    const customerEmailPromise = sendEmail({
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    // Send admin notification
    const adminEmail = adminNotificationEmail({ lead });
    const adminEmailPromise = sendEmail({
      to: 'info@moonenvochtwering.nl',
      subject: `Inspectie ingepland: ${name} - ${new Date(slotDate).toLocaleDateString('nl-NL')} ${slotTime}`,
      html: `${adminEmail.html}
        <hr style="margin: 16px 0; border: none; border-top: 1px solid #eee;" />
        <p style="color: #355b23; font-weight: 600;">Inspectie ingepland op ${new Date(slotDate).toLocaleDateString('nl-NL')} om ${slotTime}</p>
        ${straat ? `<p>Adres: ${straat}, ${postcode || ''} ${plaatsnaam || ''}</p>` : ''}`,
      text: `${adminEmail.text}\n\nInspectie ingepland: ${new Date(slotDate).toLocaleDateString('nl-NL')} om ${slotTime}${straat ? `\nAdres: ${straat}, ${postcode || ''} ${plaatsnaam || ''}` : ''}`,
    });

    const emailResults = await Promise.allSettled([customerEmailPromise, adminEmailPromise]);

    // Log customer email
    if (emailResults[0].status === 'fulfilled') {
      await supabase.from('email_log').insert({
        lead_id: lead.id,
        type: 'confirmation',
        to_email: email,
        subject: emailContent.subject,
      });

      await logLeadEvent({
        leadId: lead.id,
        eventType: 'email_sent',
        actor: 'system',
        metadata: { type: 'confirmation', to_email: email },
      });
    }

    // Notify ops if any emails failed
    const failedEmails = emailResults.filter(r => r.status === 'rejected');
    if (failedEmails.length > 0) {
      await notifyOpsAlert({
        source: '/api/customer/book-inspection',
        message: 'Lead created and slot booked but email(s) failed',
        error: failedEmails.map(r => r.reason?.message || String(r.reason)).join(' | '),
        context: { lead_id: lead.id, to_email: email, failed_count: failedEmails.length },
      });
    }

    return NextResponse.json({ success: true, lead_id: lead.id });
  } catch (error) {
    console.error('[API_ERROR] /api/customer/book-inspection:', error);
    await notifyOpsAlert({
      source: '/api/customer/book-inspection',
      message: 'Public booking flow failed',
      error,
    });
    return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 });
  }
}
