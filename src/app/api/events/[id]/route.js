import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { syncEventToGoogleCalendar } from '@/lib/google/calendar';

/**
 * PATCH /api/events/[id]
 */
export async function PATCH(request, context) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    try {
        const body = await request.json();

        // Get existing event
        const adminClient = createAdminClient();
        const { data: existing, error: fetchError } = await adminClient
            .from('google_calendar_events')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !existing) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        // Build update payload
        const updates = {};
        if (body.summary !== undefined) updates.summary = body.summary;
        if (body.description !== undefined) updates.description = body.description;
        if (body.location !== undefined) updates.location = body.location;
        if (body.start_time !== undefined) updates.start_time = body.start_time;
        if (body.end_time !== undefined) updates.end_time = body.end_time;
        if (body.is_all_day !== undefined) updates.is_all_day = body.is_all_day;

        // Apply updates locally
        const { data: updatedEvent, error: updateError } = await adminClient
            .from('google_calendar_events')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            console.error('[DB_FAIL] PATCH /api/events/[id]:', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        // Sync to Google Calendar
        if (updatedEvent.google_event_id && !updatedEvent.google_event_id.startsWith('local-')) {
            await syncEventToGoogleCalendar(updatedEvent, 'update');
        }

        return NextResponse.json(updatedEvent);
    } catch (err) {
        console.error('[API_ERROR] PATCH /api/events/[id]:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/**
 * DELETE /api/events/[id]
 */
export async function DELETE(request, context) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    try {
        const adminClient = createAdminClient();
        const { data: existing, error: fetchError } = await adminClient
            .from('google_calendar_events')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !existing) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        // If it's a real google event, try to delete it from Google Calendar
        if (existing.google_event_id && !existing.google_event_id.startsWith('local-')) {
            await syncEventToGoogleCalendar(existing, 'delete');
        } else {
            // Just delete local
            await adminClient
                .from('google_calendar_events')
                .delete()
                .eq('id', id);
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('[API_ERROR] DELETE /api/events/[id]:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
