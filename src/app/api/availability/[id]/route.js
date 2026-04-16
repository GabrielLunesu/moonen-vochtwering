import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildSlotVisibilityPayload } from '@/lib/utils/availability-areas';

export async function PATCH(request, { params }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const updates = await request.json();
  const visibilityKeys = ['visibility_scope', 'center_place_name', 'radius_km', 'center_lat', 'center_lng'];

  const { data: existingSlot, error: existingError } = await supabase
    .from('availability_slots')
    .select('*')
    .eq('id', id)
    .single();

  if (existingError || !existingSlot) {
    return NextResponse.json({ error: 'Moment niet gevonden' }, { status: 404 });
  }

  const allowed = [
    'slot_date',
    'slot_time',
    'max_visits',
    'booked_count',
    'is_open',
    'notes',
    ...visibilityKeys,
  ];
  const payload = {};

  for (const key of allowed) {
    if (key in updates) payload[key] = updates[key];
  }

  if (visibilityKeys.some((key) => key in updates)) {
    try {
      Object.assign(
        payload,
        await buildSlotVisibilityPayload({
          visibility_scope: updates.visibility_scope ?? existingSlot.visibility_scope,
          center_place_name: updates.center_place_name ?? existingSlot.center_place_name,
          center_lat: updates.center_lat ?? existingSlot.center_lat,
          center_lng: updates.center_lng ?? existingSlot.center_lng,
          radius_km: updates.radius_km ?? existingSlot.radius_km,
        })
      );
    } catch (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  const { data, error } = await supabase
    .from('availability_slots')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request, { params }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const { error } = await supabase.from('availability_slots').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
