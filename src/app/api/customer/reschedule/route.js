import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/resend';
import { confirmationEmail } from '@/lib/email/templates/confirmation';
import { notifyOpsAlert } from '@/lib/ops/alerts';
import { logLeadEvent } from '@/lib/utils/events';
import { syncLeadToGoogleCalendar } from '@/lib/google/calendar';

export async function POST(request) {
  try {
    const { token, slot_id } = await request.json();

    if (!token || !slot_id) {
      return NextResponse.json({ error: 'Token en tijdslot zijn verplicht' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Find lead by token
    const { data: lead, error } = await supabase
      .from('leads')
      .select('*')
      .eq('availability_token', token)
      .single();

    if (error || !lead) {
      return NextResponse.json({ error: 'Ongeldige link' }, { status: 404 });
    }

    if (!lead.inspection_date || !lead.inspection_time) {
      return NextResponse.json({ error: 'Geen actieve afspraak gevonden' }, { status: 400 });
    }

    // Book new slot first (before releasing old one, to prevent race conditions)
    const { data: bookedSlot, error: bookError } = await supabase.rpc('book_availability_slot', {
      p_slot_id: slot_id,
    });

    if (bookError) {
      return NextResponse.json({ error: bookError.message }, { status: 500 });
    }

    if (!bookedSlot?.length) {
      return NextResponse.json(
        { error: 'Dit moment is helaas niet meer beschikbaar.', code: 'SLOT_FULL' },
        { status: 409 }
      );
    }

    const newDate = bookedSlot[0].slot_date;
    const newTime = bookedSlot[0].slot_time;
    const oldDate = lead.inspection_date;
    const oldTime = lead.inspection_time;

    // Release old slot
    if (lead.availability_slot_id) {
      await supabase.rpc('release_availability_slot', { p_slot_id: lead.availability_slot_id });

      await logLeadEvent({
        leadId: lead.id,
        eventType: 'slot_released',
        actor: 'customer',
        metadata: { slot_id: lead.availability_slot_id, date: oldDate, time: oldTime },
      });
    }

    // Update lead with new slot
    const leadUpdates = {
      inspection_date: newDate,
      inspection_time: newTime,
      availability_slot_id: slot_id,
    };

    if (Object.prototype.hasOwnProperty.call(lead, 'stage_changed_at')) {
      leadUpdates.stage_changed_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('leads')
      .update(leadUpdates)
      .eq('id', lead.id);

    if (updateError) {
      // Try to release the newly booked slot and re-book the old one
      await supabase.rpc('release_availability_slot', { p_slot_id: slot_id });
      if (lead.availability_slot_id) {
        await supabase.rpc('book_availability_slot', { p_slot_id: lead.availability_slot_id });
      }
      await notifyOpsAlert({
        source: '/api/customer/reschedule',
        message: 'Failed to update lead after reschedule',
        error: updateError,
        context: { lead_id: lead.id, new_slot_id: slot_id },
      });
      return NextResponse.json({ error: 'Kon afspraak niet wijzigen' }, { status: 500 });
    }

    await logLeadEvent({
      leadId: lead.id,
      eventType: 'slot_booked',
      actor: 'customer',
      metadata: { slot_id, date: newDate, time: newTime },
    });

    await logLeadEvent({
      leadId: lead.id,
      eventType: 'appointment_rescheduled',
      oldValue: `${oldDate} ${oldTime}`,
      newValue: `${newDate} ${newTime}`,
      actor: 'customer',
    });

    // Sync to Google Calendar (best-effort)
    syncLeadToGoogleCalendar(
      { ...lead, google_event_id: lead.google_event_id },
      lead.google_event_id ? 'update' : 'create',
      { date: newDate, time: newTime }
    );

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://moonenvochtwering.nl';

    // Load template overrides
    const { data: templateSetting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'email_template_confirmation')
      .single();
    const overrides = templateSetting?.value || {};

    // Send new confirmation email with manage link
    const emailContent = confirmationEmail({
      name: lead.name,
      date: newDate,
      time: newTime,
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
      metadata: { type: 'confirmation_reschedule', to_email: lead.email },
    });

    // Notify admin
    const oldFormatted = new Date(oldDate).toLocaleDateString('nl-NL');
    const newFormatted = new Date(newDate).toLocaleDateString('nl-NL');

    await sendEmail({
      to: 'info@moonenvochtwering.nl',
      subject: `Inspectie verzet: ${lead.name} - nieuwe datum ${newFormatted} ${newTime}`,
      html: `<p><strong>${lead.name}</strong> heeft de inspectie verzet.</p>
             <p>Oud: ${oldFormatted} om ${oldTime}</p>
             <p><strong>Nieuw: ${newFormatted} om ${newTime}</strong></p>
             <p>Telefoon: ${lead.phone}</p>`,
      text: `${lead.name} heeft de inspectie verzet.\nOud: ${oldFormatted} om ${oldTime}\nNieuw: ${newFormatted} om ${newTime}\nTel: ${lead.phone}`,
    });

    return NextResponse.json({ success: true, date: newDate, time: newTime });
  } catch (error) {
    console.error('[API_ERROR] /api/customer/reschedule:', error);
    await notifyOpsAlert({
      source: '/api/customer/reschedule',
      message: 'Customer reschedule flow failed',
      error,
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
