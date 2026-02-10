import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function normalizeLimit(rawLimit, fallback = 100) {
  const parsed = Number(rawLimit);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, 500);
}

function isValidTime(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value || '');
}

export async function GET(request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const fromDate = searchParams.get('from_date');
  const toDate = searchParams.get('to_date');
  const openOnly = searchParams.get('open_only') === 'true';
  const limit = normalizeLimit(searchParams.get('limit'));

  let query = supabase
    .from('availability_slots')
    .select('*')
    .order('slot_date', { ascending: true })
    .order('slot_time', { ascending: true })
    .limit(limit);

  if (fromDate) query = query.gte('slot_date', fromDate);
  if (toDate) query = query.lte('slot_date', toDate);
  if (openOnly) query = query.eq('is_open', true);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const slots = (data || []).filter((slot) => !openOnly || slot.booked_count < slot.max_visits);

  return NextResponse.json(slots);
}

export async function POST(request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const incomingSlots = Array.isArray(body?.slots) ? body.slots : [body];

  if (!incomingSlots.length) {
    return NextResponse.json({ error: 'No slots provided' }, { status: 400 });
  }

  const payload = [];

  for (const slot of incomingSlots) {
    if (!slot?.slot_date || !slot?.slot_time || !isValidTime(slot.slot_time)) {
      return NextResponse.json(
        { error: 'Each slot needs slot_date (YYYY-MM-DD) and slot_time (HH:MM)' },
        { status: 400 }
      );
    }

    payload.push({
      slot_date: slot.slot_date,
      slot_time: slot.slot_time,
      max_visits: Number.isFinite(Number(slot.max_visits)) ? Number(slot.max_visits) : 1,
      booked_count: Number.isFinite(Number(slot.booked_count)) ? Number(slot.booked_count) : 0,
      is_open: typeof slot.is_open === 'boolean' ? slot.is_open : true,
      notes: slot.notes || null,
    });
  }

  const { data, error } = await supabase
    .from('availability_slots')
    .upsert(payload, { onConflict: 'slot_date,slot_time' })
    .select('*');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
