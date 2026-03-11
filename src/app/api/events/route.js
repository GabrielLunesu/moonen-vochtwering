import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { syncEventToGoogleCalendar, upsertSyncedEvents } from '@/lib/google/calendar';

/**
 * GET /api/events?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Returns all events (generic events and synced events).
 * Generic events are distinguished by source='crm'.
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
            console.error('[DB_FAIL] /api/events:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data || []);
    } catch (error) {
        console.error('[API_ERROR] /api/events:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/events
 * Create a new generic event in the CRM and sync it to Google Calendar.
 */
export async function POST(request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { summary, description, location, start_time, end_time, is_all_day } = body;

        // Validate
        if (!summary || !start_time || !end_time) {
            return NextResponse.json({ error: 'Summary, start_time, and end_time are required' }, { status: 400 });
        }

        // Prepare generic event format
        const crmEvent = {
            summary,
            description: description || null,
            location: location || null,
            start_time,
            end_time,
            is_all_day: !!is_all_day,
            status: 'confirmed',
            source: 'crm',
        };

        // Push to Google Calendar first to get the Google Event ID
        const googleEventId = await syncEventToGoogleCalendar(crmEvent, 'create');

        if (googleEventId) {
            crmEvent.google_event_id = googleEventId;
        } else {
            // Fallback: create local-only if Google isn't configured, using a generated uuid
            crmEvent.google_event_id = `local-${crypto.randomUUID()}`;
        }

        const adminClient = createAdminClient();
        const { data: newEvent, error } = await adminClient
            .from('google_calendar_events')
            .insert({
                google_event_id: crmEvent.google_event_id,
                summary: crmEvent.summary,
                description: crmEvent.description,
                location: crmEvent.location,
                start_time: crmEvent.start_time,
                end_time: crmEvent.end_time,
                is_all_day: crmEvent.is_all_day,
                status: crmEvent.status,
                source: crmEvent.source
            })
            .select()
            .single();

        if (error) {
            console.error('[DB_FAIL] POST /api/events insert:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(newEvent);
    } catch (err) {
        console.error('[API_ERROR] POST /api/events:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
