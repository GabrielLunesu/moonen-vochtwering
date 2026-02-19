import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is verplicht' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: lead, error } = await supabase
      .from('leads')
      .select('name, plaatsnaam, inspection_date, inspection_time, status, availability_slot_id')
      .eq('availability_token', token)
      .single();

    if (error || !lead) {
      return NextResponse.json({ error: 'Ongeldige link' }, { status: 404 });
    }

    return NextResponse.json({
      name: lead.name,
      plaatsnaam: lead.plaatsnaam,
      inspection_date: lead.inspection_date,
      inspection_time: lead.inspection_time,
      status: lead.status,
    });
  } catch (error) {
    console.error('[API_ERROR] /api/customer/appointment:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
