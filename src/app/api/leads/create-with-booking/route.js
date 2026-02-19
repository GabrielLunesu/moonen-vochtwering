import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/resend';
import { confirmationEmail } from '@/lib/email/templates/confirmation';
import { generateToken } from '@/lib/utils/tokens';
import { notifyOpsAlert } from '@/lib/ops/alerts';
import { logLeadEvent } from '@/lib/utils/events';
import { syncLeadToGoogleCalendar } from '@/lib/google/calendar';

export async function POST(request) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, email, phone, straat, postcode, plaatsnaam, type_probleem, message, slot_id } =
      await request.json();

    if (!name || !phone || !slot_id) {
      return NextResponse.json(
        { error: 'Naam, telefoon en tijdslot zijn verplicht' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Book the slot atomically
    const { data: bookedSlot, error: bookError } = await admin.rpc('book_availability_slot', {
      p_slot_id: slot_id,
    });

    if (bookError) {
      return NextResponse.json({ error: bookError.message }, { status: 500 });
    }

    if (!bookedSlot?.length) {
      return NextResponse.json(
        { error: 'Dit moment is niet meer beschikbaar.', code: 'SLOT_FULL' },
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

    // Insert lead
    const { data: lead, error: insertError } = await admin
      .from('leads')
      .insert({
        name,
        email: email || null,
        phone,
        plaatsnaam: plaatsnaam || null,
        postcode: postcode || null,
        message: fullMessage || null,
        type_probleem: type_probleem || null,
        source: 'telefoon',
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
      await admin.rpc('release_availability_slot', { p_slot_id: slot_id });
      console.error('[DB_FAIL] /api/leads/create-with-booking:', insertError);
      await notifyOpsAlert({
        source: '/api/leads/create-with-booking',
        message: 'Failed to insert lead',
        error: insertError,
        context: { name, phone, slot_id },
      });
      return NextResponse.json({ error: 'Kon lead niet aanmaken' }, { status: 500 });
    }

    // Log events
    await logLeadEvent({
      leadId: lead.id,
      eventType: 'lead_created',
      actor: user.email || 'admin',
      metadata: { source: 'telefoon', type_probleem: type_probleem || null },
    });

    await logLeadEvent({
      leadId: lead.id,
      eventType: 'slot_booked',
      actor: user.email || 'admin',
      metadata: { slot_id, date: slotDate, time: slotTime },
    });

    await logLeadEvent({
      leadId: lead.id,
      eventType: 'status_change',
      oldValue: null,
      newValue: 'bevestigd',
      actor: user.email || 'admin',
    });

    // Sync to Google Calendar (best-effort)
    syncLeadToGoogleCalendar(lead, 'create');

    // Send confirmation email to customer (if email provided)
    if (email) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://moonenvochtwering.nl';

      const { data: templateSetting } = await admin
        .from('settings')
        .select('value')
        .eq('key', 'email_template_confirmation')
        .single();
      const overrides = templateSetting?.value || {};

      const emailContent = confirmationEmail({
        name,
        date: slotDate,
        time: slotTime,
        siteUrl,
        token: availability_token,
        overrides,
      });

      try {
        await sendEmail({
          to: email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });

        await admin.from('email_log').insert({
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
      } catch (emailError) {
        console.error('[EMAIL_FAIL] create-with-booking confirmation:', emailError);
        await notifyOpsAlert({
          source: '/api/leads/create-with-booking',
          message: 'Lead created but confirmation email failed',
          error: emailError,
          context: { lead_id: lead.id, to_email: email },
        });
      }
    }

    return NextResponse.json({ success: true, lead_id: lead.id });
  } catch (error) {
    console.error('[API_ERROR] /api/leads/create-with-booking:', error);
    await notifyOpsAlert({
      source: '/api/leads/create-with-booking',
      message: 'Quick lead creation failed',
      error,
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
