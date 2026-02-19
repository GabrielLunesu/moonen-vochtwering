import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  registerWatch,
  stopWatch,
  getSyncState,
  setSyncState,
} from '@/lib/google/calendar';

/**
 * POST /api/gcal/watch
 *
 * Register (or renew) a push notification channel.
 * Auth required — triggered from settings page or cron.
 */
export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Stop existing channel if any
    const existingChannelId = await getSyncState('channel_id');
    const existingResourceId = await getSyncState('channel_resource_id');
    if (existingChannelId && existingResourceId) {
      await stopWatch(existingChannelId, existingResourceId);
    }

    // Register new channel
    const result = await registerWatch();
    if (!result) {
      return NextResponse.json({ error: 'Google Calendar niet geconfigureerd' }, { status: 400 });
    }

    // Save channel info
    await setSyncState('channel_id', result.channelId);
    await setSyncState('channel_resource_id', result.resourceId);
    await setSyncState('channel_expiration', result.expiration);

    return NextResponse.json({
      success: true,
      channelId: result.channelId,
      expiration: result.expiration,
    });
  } catch (error) {
    console.error('[API_ERROR] /api/gcal/watch:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
