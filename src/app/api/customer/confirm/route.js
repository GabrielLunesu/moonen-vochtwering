import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/resend';
import { confirmationEmail } from '@/lib/email/templates/confirmation';
import { notifyOpsAlert } from '@/lib/ops/alerts';
import { logLeadEvent } from '@/lib/utils/events';

export async function POST(request) {
  try {
    const { token, slot_id, date, time, plaatsnaam, postcode, straat } = await request.json();

    if (!token || (!slot_id && (!date || !time))) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Find lead by token
    const { data: lead, error } = await supabase
      .from('leads')
      .select('*')
      .eq('availability_token', token)
      .single();

    if (error || !lead) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
    }

    if (lead.inspection_date && lead.inspection_time) {
      return NextResponse.json(
        { error: 'Deze inspectie is al bevestigd.' },
        { status: 409 }
      );
    }

    let selectedDate = date;
    let selectedTime = time;

    if (slot_id) {
      const { data: bookedSlot, error: bookError } = await supabase.rpc('book_availability_slot', {
        p_slot_id: slot_id,
      });

      if (bookError) {
        return NextResponse.json({ error: bookError.message }, { status: 500 });
      }

      if (!bookedSlot?.length) {
        return NextResponse.json(
          {
            error: 'Dit moment is helaas niet meer beschikbaar.',
            code: 'SLOT_FULL',
          },
          { status: 409 }
        );
      }

      selectedDate = bookedSlot[0].slot_date;
      selectedTime = bookedSlot[0].slot_time;
    }

    const leadUpdates = {
      status: 'bevestigd',
      inspection_date: selectedDate,
      inspection_time: selectedTime,
    };

    if (Object.prototype.hasOwnProperty.call(lead, 'stage_changed_at')) {
      leadUpdates.stage_changed_at = new Date().toISOString();
    }

    if (slot_id) {
      leadUpdates.availability_slot_id = slot_id;
    }

    // Save address fields from the /bevestig form
    if (plaatsnaam) {
      leadUpdates.plaatsnaam = plaatsnaam;
    }
    if (postcode) {
      leadUpdates.postcode = postcode;
    }
    if (straat) {
      // Prepend street to existing message, or set as message
      const existingMessage = lead.message || '';
      const addressLine = `Adres: ${straat}, ${postcode || ''} ${plaatsnaam || ''}`.trim();
      leadUpdates.message = existingMessage
        ? `${addressLine}\n\n${existingMessage}`
        : addressLine;
    }

    const { error: leadUpdateError } = await supabase
      .from('leads')
      .update(leadUpdates)
      .eq('id', lead.id);

    if (leadUpdateError) {
      if (slot_id) {
        await supabase.rpc('release_availability_slot', { p_slot_id: slot_id });
      }
      await notifyOpsAlert({
        source: '/api/customer/confirm',
        message: 'Failed to persist confirmed slot on lead',
        error: leadUpdateError,
        context: { lead_id: lead.id, slot_id: slot_id || null },
      });
      return NextResponse.json({ error: leadUpdateError.message }, { status: 500 });
    }

    await logLeadEvent({
      leadId: lead.id,
      eventType: 'slot_booked',
      actor: 'customer',
      metadata: {
        slot_id: slot_id || null,
        date: selectedDate,
        time: selectedTime,
      },
    });

    if (lead.status !== 'bevestigd') {
      await logLeadEvent({
        leadId: lead.id,
        eventType: 'status_change',
        oldValue: lead.status,
        newValue: 'bevestigd',
        actor: 'customer',
      });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://moonenvochtwering.nl';

    // Load email template overrides
    const { data: templateSetting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'email_template_confirmation')
      .single();
    const overrides = templateSetting?.value || {};

    // Send confirmation email to customer (with manage link)
    const emailContent = confirmationEmail({
      name: lead.name,
      date: selectedDate,
      time: selectedTime,
      siteUrl,
      token,
      overrides,
    });

    await sendEmail({
      to: lead.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    // Log email
    await supabase.from('email_log').insert({
      lead_id: lead.id,
      type: 'confirmation',
      to_email: lead.email,
      subject: emailContent.subject,
    });

    await logLeadEvent({
      leadId: lead.id,
      eventType: 'email_sent',
      actor: 'system',
      metadata: {
        type: 'confirmation',
        to_email: lead.email,
        subject: emailContent.subject,
      },
    });

    // Notify admin
    const displayPlaats = plaatsnaam || lead.plaatsnaam || 'onbekend';
    await sendEmail({
      to: 'info@moonenvochtwering.nl',
      subject: `Inspectie bevestigd: ${lead.name} - ${new Date(selectedDate).toLocaleDateString('nl-NL')} ${selectedTime}`,
      html: `<p><strong>${lead.name}</strong> uit ${displayPlaats} heeft een inspectie bevestigd op <strong>${new Date(selectedDate).toLocaleDateString('nl-NL')}</strong> om <strong>${selectedTime}</strong>.</p>
             <p>Telefoon: ${lead.phone}</p>
             ${straat ? `<p>Adres: ${straat}, ${postcode || ''} ${displayPlaats}</p>` : ''}`,
      text: `${lead.name} uit ${displayPlaats} heeft een inspectie bevestigd op ${new Date(selectedDate).toLocaleDateString('nl-NL')} om ${selectedTime}. Tel: ${lead.phone}${straat ? `\nAdres: ${straat}, ${postcode || ''} ${displayPlaats}` : ''}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API_ERROR] /api/customer/confirm:', error);
    await notifyOpsAlert({
      source: '/api/customer/confirm',
      message: 'Customer confirmation flow failed',
      error,
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
