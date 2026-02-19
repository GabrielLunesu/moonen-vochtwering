import { NextResponse } from 'next/server';
import {
  registerWatch,
  stopWatch,
  fetchCalendarChanges,
  upsertSyncedEvents,
  getSyncState,
  setSyncState,
} from '@/lib/google/calendar';
import { notifyOpsAlert } from '@/lib/ops/alerts';

/**
 * GET /api/cron/gcal-renew
 *
 * Daily cron job that:
 * 1. Renews the Google Calendar push notification channel
 * 2. Does a safety incremental sync (catch anything webhooks missed)
 *
 * Protected by CRON_SECRET.
 */
export async function GET(request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Skip if not configured
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
    return NextResponse.json({ ok: true, message: 'Google Calendar not configured, skipping' });
  }

  const results = { watchRenewed: false, syncedEvents: 0, errors: [] };

  // 1. Renew watch channel
  try {
    const existingChannelId = await getSyncState('channel_id');
    const existingResourceId = await getSyncState('channel_resource_id');

    if (existingChannelId && existingResourceId) {
      await stopWatch(existingChannelId, existingResourceId);
    }

    const watch = await registerWatch();
    if (watch) {
      await setSyncState('channel_id', watch.channelId);
      await setSyncState('channel_resource_id', watch.resourceId);
      await setSyncState('channel_expiration', watch.expiration);
      results.watchRenewed = true;
    }
  } catch (err) {
    console.error('[CRON_ERROR] gcal-renew watch renewal failed:', err);
    results.errors.push(`Watch renewal: ${err.message}`);
    await notifyOpsAlert({
      source: '/api/cron/gcal-renew',
      message: 'Google Calendar watch renewal failed',
      error: err,
    });
  }

  // 2. Safety sync
  try {
    const syncToken = await getSyncState('sync_token');
    const { events, nextSyncToken } = await fetchCalendarChanges(syncToken);

    if (nextSyncToken) {
      await setSyncState('sync_token', nextSyncToken);
    }

    if (events.length > 0) {
      await upsertSyncedEvents(events);
    }

    results.syncedEvents = events.length;
  } catch (err) {
    console.error('[CRON_ERROR] gcal-renew safety sync failed:', err);
    results.errors.push(`Safety sync: ${err.message}`);
    await notifyOpsAlert({
      source: '/api/cron/gcal-renew',
      message: 'Google Calendar safety sync failed',
      error: err,
    });
  }

  return NextResponse.json(results);
}
