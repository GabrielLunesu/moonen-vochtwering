import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase.from('settings').select('*');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Convert to key-value object
  const settings = {};
  data.forEach(row => {
    settings[row.key] = row.value;
  });

  return NextResponse.json(settings);
}

export async function PATCH(request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const updates = await request.json();

  for (const [key, value] of Object.entries(updates)) {
    await supabase
      .from('settings')
      .upsert({ key, value, updated_at: new Date().toISOString() });
  }

  return NextResponse.json({ success: true });
}
