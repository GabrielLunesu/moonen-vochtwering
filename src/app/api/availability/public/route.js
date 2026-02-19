import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function normalizeLimit(rawLimit, fallback = 20) {
  const parsed = Number(rawLimit);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, 100);
}

function isFutureSlot(slot, today, nowTime) {
  if (slot.slot_date > today) return true;
  if (slot.slot_date < today) return false;
  return slot.slot_time > nowTime;
}

export async function GET(request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const limit = normalizeLimit(searchParams.get('limit'));

  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toTimeString().slice(0, 5);

  const { data, error } = await supabase
    .from('availability_slots')
    .select('id,slot_date,slot_time,max_visits,booked_count,notes')
    .eq('is_open', true)
    .gte('slot_date', today)
    .order('slot_date', { ascending: true })
    .order('slot_time', { ascending: true })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const slots = (data || [])
    .filter((slot) => slot.booked_count < slot.max_visits)
    .filter((slot) => isFutureSlot(slot, today, nowTime))
    .slice(0, limit)
    .map((slot) => ({
      ...slot,
      remaining: Math.max(0, slot.max_visits - slot.booked_count),
    }));

  return NextResponse.json(slots);
}
