import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { notifyOpsAlert } from '@/lib/ops/alerts';
import { logLeadEvent } from '@/lib/utils/events';

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

    const updatesPayload = { ...updates };
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
      (key) => key !== 'status' && key !== 'followup_paused' && key !== 'stage_changed_at'
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
