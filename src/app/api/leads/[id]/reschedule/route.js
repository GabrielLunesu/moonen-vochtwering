import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/resend';
import { confirmationEmail } from '@/lib/email/templates/confirmation';
import { notifyOpsAlert } from '@/lib/ops/alerts';
import { logLeadEvent } from '@/lib/utils/events';
import { syncLeadToGoogleCalendar } from '@/lib/google/calendar';

export async function POST(request, { params }) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { new_slot_id } = await request.json();

    if (!new_slot_id) {
      return NextResponse.json({ error: 'new_slot_id is verplicht' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Fetch lead
    const { data: lead, error: leadError } = await admin
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead niet gevonden' }, { status: 404 });
    }

    const oldDate = lead.inspection_date;
    const oldTime = lead.inspection_time;

    // Book new slot first
    const { data: bookedSlot, error: bookError } = await admin.rpc('book_availability_slot', {
      p_slot_id: new_slot_id,
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

    const newDate = bookedSlot[0].slot_date;
    const newTime = bookedSlot[0].slot_time;

    // Release old slot
    if (lead.availability_slot_id) {
      await admin.rpc('release_availability_slot', { p_slot_id: lead.availability_slot_id });

      await logLeadEvent({
        leadId: lead.id,
        eventType: 'slot_released',
        actor: user.email || 'admin',
        metadata: { slot_id: lead.availability_slot_id, date: oldDate, time: oldTime },
      });
    }

    // Update lead
    const leadUpdates = {
      inspection_date: newDate,
      inspection_time: newTime,
      availability_slot_id: new_slot_id,
    };

    if (Object.prototype.hasOwnProperty.call(lead, 'stage_changed_at')) {
      leadUpdates.stage_changed_at = new Date().toISOString();
    }

    const { error: updateError } = await admin
      .from('leads')
      .update(leadUpdates)
      .eq('id', lead.id);

    if (updateError) {
      // Rollback: release new slot, re-book old
      await admin.rpc('release_availability_slot', { p_slot_id: new_slot_id });
      if (lead.availability_slot_id) {
        await admin.rpc('book_availability_slot', { p_slot_id: lead.availability_slot_id });
      }
      await notifyOpsAlert({
        source: '/api/leads/[id]/reschedule',
        message: 'Failed to update lead after admin reschedule',
        error: updateError,
        context: { lead_id: lead.id, new_slot_id },
      });
      return NextResponse.json({ error: 'Kon lead niet bijwerken' }, { status: 500 });
    }

    await logLeadEvent({
      leadId: lead.id,
      eventType: 'slot_booked',
      actor: user.email || 'admin',
      metadata: { slot_id: new_slot_id, date: newDate, time: newTime },
    });

    await logLeadEvent({
      leadId: lead.id,
      eventType: 'appointment_rescheduled',
      oldValue: oldDate && oldTime ? `${oldDate} ${oldTime}` : null,
      newValue: `${newDate} ${newTime}`,
      actor: user.email || 'admin',
    });

    // Sync to Google Calendar (best-effort)
    syncLeadToGoogleCalendar(
      { ...lead, google_event_id: lead.google_event_id },
      lead.google_event_id ? 'update' : 'create',
      { date: newDate, time: newTime }
    );

    // Send confirmation email to customer
    if (lead.email) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://moonenvochtwering.nl';

      const { data: templateSetting } = await admin
        .from('settings')
        .select('value')
        .eq('key', 'email_template_confirmation')
        .single();
      const overrides = templateSetting?.value || {};

      const emailContent = confirmationEmail({
        name: lead.name,
        date: newDate,
        time: newTime,
        siteUrl,
        token: lead.availability_token,
        overrides,
      });

      await sendEmail({
        to: lead.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });

      await admin.from('email_log').insert({
        lead_id: lead.id,
        type: 'confirmation',
        to_email: lead.email,
        subject: emailContent.subject,
      });

      await logLeadEvent({
        leadId: lead.id,
        eventType: 'email_sent',
        actor: 'system',
        metadata: { type: 'confirmation_reschedule_admin', to_email: lead.email },
      });
    }

    return NextResponse.json({
      success: true,
      date: newDate,
      time: newTime,
    });
  } catch (error) {
    console.error('[API_ERROR] /api/leads/[id]/reschedule:', error);
    await notifyOpsAlert({
      source: '/api/leads/[id]/reschedule',
      message: 'Admin reschedule flow failed',
      error,
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
