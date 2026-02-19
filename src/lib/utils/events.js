import { createAdminClient } from '@/lib/supabase/admin';
import { notifyOpsAlert } from '@/lib/ops/alerts';

export async function logLeadEvent({
  leadId,
  eventType,
  oldValue = null,
  newValue = null,
  metadata = null,
  actor = 'system',
}) {
  if (!leadId || !eventType) return;

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('lead_events').insert({
      lead_id: leadId,
      event_type: eventType,
      old_value: oldValue,
      new_value: newValue,
      metadata,
      actor,
    });

    if (error) throw error;
  } catch (error) {
    console.error('Failed to write lead event:', error);
    await notifyOpsAlert({
      source: 'logLeadEvent',
      message: 'Failed to persist lead event',
      error,
      context: {
        lead_id: leadId,
        event_type: eventType,
        actor,
      },
    });
  }
}
