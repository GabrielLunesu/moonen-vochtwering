import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/resend';
import { availabilityEmail } from '@/lib/email/templates/availability';
import { notifyOpsAlert } from '@/lib/ops/alerts';
import { logLeadEvent } from '@/lib/utils/events';

export async function POST(request, { params }) {
  const { id: leadId } = await params;
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: lead, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (error || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().slice(0, 5);

    const { data: slots, error: slotError } = await supabase
      .from('availability_slots')
      .select('id,slot_date,slot_time,max_visits,booked_count')
      .eq('is_open', true)
      .gte('slot_date', today)
      .order('slot_date', { ascending: true })
      .order('slot_time', { ascending: true })
      .limit(100);

    if (slotError) {
      return NextResponse.json({ error: slotError.message }, { status: 500 });
    }

    const availableSlots = (slots || [])
      .filter((slot) => slot.booked_count < slot.max_visits)
      .filter((slot) => {
        if (slot.slot_date > today) return true;
        if (slot.slot_date < today) return false;
        return slot.slot_time > nowTime;
      })
      .slice(0, 4);

    if (!availableSlots.length) {
      return NextResponse.json(
        {
          error: 'No availability',
          code: 'NO_AVAILABILITY',
          message: 'Er zijn geen open momenten om te versturen.',
        },
        { status: 409 }
      );
    }

    // Load email template overrides
    const { data: templateSetting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'email_template_availability')
      .single();
    const overrides = templateSetting?.value || {};

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://moonenvochtwering.nl';
    const confirmUrl = `${baseUrl}/bevestig?token=${lead.availability_token}`;

    const emailContent = availabilityEmail({
      name: lead.name,
      confirmUrl,
      slots: availableSlots,
      overrides,
    });

    await sendEmail({
      to: lead.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    // Update status only if current stage is earlier than uitgenodigd (index 1)
    const STAGE_ORDER = ['nieuw', 'uitgenodigd', 'bevestigd', 'bezocht', 'offerte_verzonden', 'akkoord', 'verloren'];
    const currentIndex = STAGE_ORDER.indexOf(lead.status);
    const targetIndex = STAGE_ORDER.indexOf('uitgenodigd');
    const shouldAdvance = currentIndex >= 0 && currentIndex < targetIndex;

    const leadUpdates = {
      last_email_at: new Date().toISOString(),
    };

    if (shouldAdvance) {
      leadUpdates.status = 'uitgenodigd';
      if (Object.prototype.hasOwnProperty.call(lead, 'stage_changed_at')) {
        leadUpdates.stage_changed_at = new Date().toISOString();
      }
    }

    const { data: updated } = await supabase
      .from('leads')
      .update(leadUpdates)
      .eq('id', leadId)
      .select()
      .single();

    await supabase.from('email_log').insert({
      lead_id: leadId,
      type: 'availability',
      to_email: lead.email,
      subject: emailContent.subject,
    });

    await logLeadEvent({
      leadId,
      eventType: 'email_sent',
      actor: user.email || 'user',
      metadata: {
        type: 'availability',
        to_email: lead.email,
        subject: emailContent.subject,
        slots: availableSlots,
      },
    });

    if (shouldAdvance) {
      await logLeadEvent({
        leadId,
        eventType: 'status_change',
        oldValue: lead.status,
        newValue: 'uitgenodigd',
        actor: user.email || 'user',
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    await notifyOpsAlert({
      source: '/api/leads/[id]/send-availability',
      message: 'Failed to send availability email',
      error,
      context: { lead_id: leadId },
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
