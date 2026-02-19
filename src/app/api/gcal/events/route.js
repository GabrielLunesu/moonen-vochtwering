import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/gcal/events?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Returns synced Google Calendar events for a date range.
 * Auth required.
 */
export async function GET(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  if (!from || !to) {
    return NextResponse.json({ error: 'from en to parameters zijn verplicht' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('google_calendar_events')
      .select('*')
      .neq('status', 'cancelled')
      .gte('start_time', `${from}T00:00:00`)
      .lte('start_time', `${to}T23:59:59`)
      .order('start_time', { ascending: true });

    if (error) {
      console.error('[DB_FAIL] /api/gcal/events:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('[API_ERROR] /api/gcal/events:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
