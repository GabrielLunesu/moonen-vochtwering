import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  fetchCalendarChanges,
  upsertSyncedEvents,
  getSyncState,
  setSyncState,
} from '@/lib/google/calendar';

/**
 * POST /api/gcal/sync
 *
 * Manual sync trigger (from dashboard). Auth required.
 * Query param: ?full=true to force a full sync (ignores sync token).
 */
export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const isFull = searchParams.get('full') === 'true';

    const syncToken = isFull ? null : await getSyncState('sync_token');
    const { events, nextSyncToken } = await fetchCalendarChanges(syncToken);

    if (nextSyncToken) {
      await setSyncState('sync_token', nextSyncToken);
    }

    if (events.length > 0) {
      await upsertSyncedEvents(events);
    }

    return NextResponse.json({
      success: true,
      synced: events.length,
      full: isFull || !syncToken,
    });
  } catch (error) {
    console.error('[API_ERROR] /api/gcal/sync:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
