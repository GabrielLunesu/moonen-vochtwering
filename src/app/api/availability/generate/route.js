import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const DEFAULT_HOURS = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00'];

const DAY_TO_INDEX = {
  zondag: 0,
  maandag: 1,
  dinsdag: 2,
  woensdag: 3,
  donderdag: 4,
  vrijdag: 5,
  zaterdag: 6,
};

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

export async function POST(request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const weeks = Number.isFinite(Number(body.weeks)) ? Number(body.weeks) : 4;
  const maxVisits = Number.isFinite(Number(body.max_visits)) ? Number(body.max_visits) : 1;
  const hours = Array.isArray(body.hours) && body.hours.length ? body.hours : DEFAULT_HOURS;

  const { data: settingsRows, error: settingsError } = await supabase
    .from('settings')
    .select('key,value')
    .in('key', ['default_inspection_days', 'inspection_days']);

  if (settingsError) {
    return NextResponse.json({ error: settingsError.message }, { status: 500 });
  }

  const settings = Object.fromEntries((settingsRows || []).map((row) => [row.key, row.value]));
  const configuredDays = settings.default_inspection_days || settings.inspection_days || ['woensdag', 'donderdag'];
  const dayIndexes = configuredDays
    .map((day) => DAY_TO_INDEX[String(day).toLowerCase()])
    .filter((value) => Number.isInteger(value));

  if (!dayIndexes.length) {
    return NextResponse.json({ error: 'No valid inspection days configured' }, { status: 400 });
  }

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const daysToGenerate = Math.max(1, weeks) * 7;
  const candidateSlots = [];

  for (let offset = 1; offset <= daysToGenerate; offset++) {
    const date = new Date(start);
    date.setDate(start.getDate() + offset);

    if (!dayIndexes.includes(date.getDay())) continue;

    const slotDate = formatDate(date);
    for (const slotTime of hours) {
      candidateSlots.push({ slot_date: slotDate, slot_time: slotTime });
    }
  }

  if (!candidateSlots.length) {
    return NextResponse.json({ inserted: 0, message: 'No slots generated' });
  }

  const firstDate = candidateSlots[0].slot_date;
  const lastDate = candidateSlots[candidateSlots.length - 1].slot_date;

  const { data: existingRows, error: existingError } = await supabase
    .from('availability_slots')
    .select('slot_date,slot_time')
    .gte('slot_date', firstDate)
    .lte('slot_date', lastDate);

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const existing = new Set((existingRows || []).map((row) => `${row.slot_date}|${row.slot_time}`));

  const inserts = candidateSlots
    .filter((slot) => !existing.has(`${slot.slot_date}|${slot.slot_time}`))
    .map((slot) => ({
      ...slot,
      max_visits: maxVisits,
      booked_count: 0,
      is_open: true,
    }));

  if (!inserts.length) {
    return NextResponse.json({ inserted: 0, message: 'All slots already exist' });
  }

  const { error: insertError } = await supabase.from('availability_slots').insert(inserts);

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ inserted: inserts.length });
}
