import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { notifyOpsAlert } from '@/lib/ops/alerts';

export async function GET(request, { params }) {
  const { id } = await params;

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('lead_events')
      .select('*')
      .eq('lead_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    await notifyOpsAlert({
      source: '/api/leads/[id]/events',
      message: 'Failed to fetch lead events',
      error,
      context: { lead_id: id },
    });

    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
