import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { notifyOpsAlert } from '@/lib/ops/alerts';

export async function GET(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const yearParam = request.nextUrl.searchParams.get('year');
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
    const startOfYear = `${year}-01-01`;
    const startOfNextYear = `${year + 1}-01-01`;

    const { data, error } = await supabase
      .from('revenue_entries')
      .select('*')
      .gte('revenue_date', startOfYear)
      .lt('revenue_date', startOfNextYear)
      .order('revenue_date', { ascending: false });

    if (error) {
      console.error('[DB_FAIL] GET /api/financieel/revenue:', error);
      // Table may not exist yet
      return NextResponse.json([]);
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('[API_ERROR] GET /api/financieel/revenue:', error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.customer_name) {
      return NextResponse.json({ error: 'Klantnaam is verplicht' }, { status: 400 });
    }
    if (body.actual_amount == null || isNaN(Number(body.actual_amount))) {
      return NextResponse.json({ error: 'Bedrag is verplicht' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('revenue_entries')
      .insert({
        lead_id: body.lead_id || null,
        customer_name: body.customer_name,
        description: body.description || null,
        quoted_amount: body.quoted_amount || 0,
        actual_amount: Number(body.actual_amount),
        revenue_date: body.revenue_date || new Date().toISOString().slice(0, 10),
        is_external: body.is_external || false,
      })
      .select()
      .single();

    if (error) {
      console.error('[DB_FAIL] POST /api/financieel/revenue:', error);
      await notifyOpsAlert({
        source: 'POST /api/financieel/revenue',
        message: 'Failed to create revenue entry',
        error,
      });
      return NextResponse.json({ error: 'Kon niet opslaan' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[API_ERROR] POST /api/financieel/revenue:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: 'ID is verplicht' }, { status: 400 });
    }

    const admin = createAdminClient();
    const updates = {};
    if (body.actual_amount != null) updates.actual_amount = Number(body.actual_amount);
    if (body.customer_name != null) updates.customer_name = body.customer_name;
    if (body.description != null) updates.description = body.description;
    if (body.revenue_date != null) updates.revenue_date = body.revenue_date;
    if (body.quoted_amount != null) updates.quoted_amount = Number(body.quoted_amount);

    const { data, error } = await admin
      .from('revenue_entries')
      .update(updates)
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      console.error('[DB_FAIL] PATCH /api/financieel/revenue:', error);
      return NextResponse.json({ error: 'Bijwerken mislukt' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[API_ERROR] PATCH /api/financieel/revenue:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: 'ID is verplicht' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from('revenue_entries')
      .delete()
      .eq('id', body.id);

    if (error) {
      console.error('[DB_FAIL] DELETE /api/financieel/revenue:', error);
      return NextResponse.json({ error: 'Verwijderen mislukt' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API_ERROR] DELETE /api/financieel/revenue:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
