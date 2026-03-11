import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { notifyOpsAlert } from '@/lib/ops/alerts';
import { logLeadEvent } from '@/lib/utils/events';
import { syncLeadToGoogleCalendar } from '@/lib/google/calendar';

async function releaseLeadSlot(admin, lead, actor) {
  if (!lead?.availability_slot_id) return false;

  const { error } = await admin.rpc('release_availability_slot', {
    p_slot_id: lead.availability_slot_id,
  });

  if (error) {
    throw error;
  }

  await logLeadEvent({
    leadId: lead.id,
    eventType: 'slot_released',
    actor,
    metadata: {
      slot_id: lead.availability_slot_id,
      date: lead.inspection_date,
      time: lead.inspection_time,
    },
  });

  return true;
}

export async function GET(request, { params }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates = await request.json();
    const actor = user.email || 'user';

    const { data: existing, error: existingError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 404 });
    }

    if (updates.archive === true || updates.archived_at) {
      if (existing.archived_at) {
        return NextResponse.json(existing);
      }

      const actor = user.email || 'user';
      let slotReleased = false;

      try {
        slotReleased = await releaseLeadSlot(admin, existing, actor);
      } catch (releaseError) {
        await notifyOpsAlert({
          source: '/api/leads/[id]',
          message: 'Lead archive failed while releasing slot',
          error: releaseError,
          context: { lead_id: id, availability_slot_id: existing.availability_slot_id },
        });
        return NextResponse.json({ error: 'Kon afspraakmoment niet vrijgeven' }, { status: 500 });
      }

      const archivePayload = {
        archived_at: typeof updates.archived_at === 'string' ? updates.archived_at : new Date().toISOString(),
        followup_paused: true,
        inspection_date: null,
        inspection_time: null,
        availability_slot_id: null,
        route_position: null,
      };

      const { data, error } = await admin
        .from('leads')
        .update(archivePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (slotReleased) {
          await admin.rpc('book_availability_slot', { p_slot_id: existing.availability_slot_id });
        }
        await notifyOpsAlert({
          source: '/api/leads/[id]',
          message: 'Lead archive failed',
          error,
          context: { lead_id: id },
        });
        return NextResponse.json({ error: 'Kon lead niet archiveren' }, { status: 500 });
      }

      await logLeadEvent({
        leadId: id,
        eventType: 'lead_archived',
        actor,
        metadata: { archived_at: archivePayload.archived_at },
      });

      syncLeadToGoogleCalendar(existing, 'delete');

      return NextResponse.json(data);
    }

    const updatesPayload = { ...updates };
    delete updatesPayload.archive;
    const stageFieldSupported = Object.prototype.hasOwnProperty.call(existing, 'stage_changed_at');
    if (
      stageFieldSupported &&
      typeof updates.status === 'string' &&
      updates.status !== existing.status &&
      !updatesPayload.stage_changed_at
    ) {
      updatesPayload.stage_changed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('leads')
      .update(updatesPayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (typeof updates.status === 'string' && updates.status !== existing.status) {
      await logLeadEvent({
        leadId: id,
        eventType: 'status_change',
        oldValue: existing.status,
        newValue: updates.status,
        actor,
      });
    }

    if (typeof updates.followup_paused === 'boolean' && updates.followup_paused !== existing.followup_paused) {
      await logLeadEvent({
        leadId: id,
        eventType: 'followup_pause_changed',
        oldValue: String(existing.followup_paused),
        newValue: String(updates.followup_paused),
        actor,
      });
    }

    const changedKeys = Object.keys(updatesPayload).filter(
      (key) =>
        key !== 'status' &&
        key !== 'followup_paused' &&
        key !== 'stage_changed_at' &&
        key !== 'archive' &&
        key !== 'archived_at'
    );
    if (changedKeys.length > 0) {
      await logLeadEvent({
        leadId: id,
        eventType: 'manual_edit',
        actor,
        metadata: { changed_keys: changedKeys },
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    await notifyOpsAlert({
      source: '/api/leads/[id]',
      message: 'Lead patch failed',
      error,
      context: { lead_id: id },
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;

  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: existing, error: existingError } = await admin
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (existingError || !existing) {
      return NextResponse.json({ error: 'Lead niet gevonden' }, { status: 404 });
    }

    let slotReleased = false;
    if (existing.availability_slot_id) {
      const { error: releaseError } = await admin.rpc('release_availability_slot', {
        p_slot_id: existing.availability_slot_id,
      });

      if (releaseError) {
        await notifyOpsAlert({
          source: 'DELETE /api/leads/[id]',
          message: 'Lead delete failed while releasing slot',
          error: releaseError,
          context: { lead_id: id, availability_slot_id: existing.availability_slot_id },
        });
        return NextResponse.json({ error: 'Kon afspraakmoment niet vrijgeven' }, { status: 500 });
      }

      slotReleased = true;
    }

    const { error } = await admin
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) {
      if (slotReleased) {
        await admin.rpc('book_availability_slot', { p_slot_id: existing.availability_slot_id });
      }
      await notifyOpsAlert({
        source: 'DELETE /api/leads/[id]',
        message: 'Lead delete failed',
        error,
        context: { lead_id: id },
      });
      return NextResponse.json({ error: 'Kon lead niet verwijderen' }, { status: 500 });
    }

    syncLeadToGoogleCalendar(existing, 'delete');

    return NextResponse.json({ success: true, id, name: existing.name });
  } catch (error) {
    await notifyOpsAlert({
      source: 'DELETE /api/leads/[id]',
      message: 'Lead delete failed',
      error,
      context: { lead_id: id },
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
