import { NextResponse } from 'next/server';
import {
  fetchCalendarChanges,
  upsertSyncedEvents,
  getSyncState,
  setSyncState,
} from '@/lib/google/calendar';
import { notifyOpsAlert } from '@/lib/ops/alerts';

/**
 * POST /api/gcal/webhook
 *
 * Receives push notifications from Google Calendar.
 * Google sends a POST with headers (no meaningful body).
 * We verify the token header, then do an incremental sync.
 */
export async function POST(request) {
  try {
    // Verify webhook token
    const webhookSecret = process.env.GCAL_WEBHOOK_SECRET;
    if (webhookSecret) {
      const channelToken = request.headers.get('x-goog-channel-token');
      if (channelToken !== webhookSecret) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
      }
    }

    // Google sends a "sync" notification when the channel is first created
    const resourceState = request.headers.get('x-goog-resource-state');
    if (resourceState === 'sync') {
      return NextResponse.json({ ok: true, message: 'Channel confirmed' });
    }

    // Incremental sync
    const syncToken = await getSyncState('sync_token');
    const { events, nextSyncToken } = await fetchCalendarChanges(syncToken);

    if (nextSyncToken) {
      await setSyncState('sync_token', nextSyncToken);
    }

    if (events.length > 0) {
      await upsertSyncedEvents(events);
    }

    return NextResponse.json({
      ok: true,
      synced: events.length,
    });
  } catch (error) {
    console.error('[GCAL_WEBHOOK] Error processing notification:', error);
    await notifyOpsAlert({
      source: '/api/gcal/webhook',
      message: 'Google Calendar webhook processing failed',
      error,
    });
    // Always return 200 to Google to prevent retries
    return NextResponse.json({ ok: false, error: 'Processing failed' }, { status: 200 });
  }
}
