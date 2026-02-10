import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const leadId = formData.get('lead_id');

  if (!file || !leadId) {
    return NextResponse.json({ error: 'Missing file or lead_id' }, { status: 400 });
  }

  const ext = file.name.split('.').pop();
  const filename = `${leadId}/${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage
    .from('inspection-photos')
    .upload(filename, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage
    .from('inspection-photos')
    .getPublicUrl(filename);

  return NextResponse.json({ url: publicUrl });
}
