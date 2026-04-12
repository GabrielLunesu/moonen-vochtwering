import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { notifyOpsAlert } from '@/lib/ops/alerts';

const VALID_TYPES = new Set(['job', 'business']);

function getTableName(type) {
  if (type === 'job') return 'job_costs';
  if (type === 'business') return 'business_costs';
  return null;
}

export async function GET(request) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const type = request.nextUrl.searchParams.get('type');
    const quoteId = request.nextUrl.searchParams.get('quote_id');
    const yearParam = request.nextUrl.searchParams.get('year');
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

    const startOfYear = `${year}-01-01T00:00:00.000Z`;
    const startOfNextYear = `${year + 1}-01-01T00:00:00.000Z`;

    // If a specific type is requested, query only that table
    if (type) {
      const table = getTableName(type);
      if (!table) {
        return NextResponse.json({ error: 'Ongeldig type: gebruik "job" of "business"' }, { status: 400 });
      }

      let query = supabase
        .from(table)
        .select('*')
        .gte('date', startOfYear)
        .lt('date', startOfNextYear)
        .order('date', { ascending: false });

      if (quoteId && type === 'job') {
        query = query.eq('quote_id', quoteId);
      }

      const { data, error } = await query;

      if (error) {
        console.error(`[DB_FAIL] GET /api/financieel/costs (${table}):`, error);
        // Table may not exist yet — return empty array
        return NextResponse.json([]);
      }

      return NextResponse.json(data);
    }

    // No type specified: return both
    const [jobResult, bizResult] = await Promise.all([
      supabase
        .from('job_costs')
        .select('*')
        .gte('date', startOfYear)
        .lt('date', startOfNextYear)
        .order('date', { ascending: false }),
      supabase
        .from('business_costs')
        .select('*')
        .gte('date', startOfYear)
        .lt('date', startOfNextYear)
        .order('date', { ascending: false }),
    ]);

    // Gracefully handle missing tables (migration not yet run)
    if (jobResult.error) {
      console.error('[DB_FAIL] GET /api/financieel/costs (job_costs):', jobResult.error);
    }
    if (bizResult.error) {
      console.error('[DB_FAIL] GET /api/financieel/costs (business_costs):', bizResult.error);
    }

    return NextResponse.json({
      job_costs: jobResult.data || [],
      business_costs: bizResult.data || [],
    });
  } catch (error) {
    console.error('[API_ERROR] GET /api/financieel/costs:', error);
    await notifyOpsAlert({
      source: 'GET /api/financieel/costs',
      message: 'Failed to fetch costs',
      error,
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
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

    if (!body.type || !VALID_TYPES.has(body.type)) {
      return NextResponse.json({ error: 'Ongeldig type: gebruik "job" of "business"' }, { status: 400 });
    }

    if (!body.amount || typeof body.amount !== 'number') {
      return NextResponse.json({ error: 'Bedrag is verplicht' }, { status: 400 });
    }

    if (!body.category) {
      return NextResponse.json({ error: 'Categorie is verplicht' }, { status: 400 });
    }

    const table = getTableName(body.type);
    const admin = createAdminClient();

    const insertData = {
      category: body.category,
      description: body.description || null,
      amount: body.amount,
      date: body.date || new Date().toISOString().slice(0, 10),
    };

    // job_costs can be linked to a quote/lead
    if (body.type === 'job') {
      insertData.quote_id = body.quote_id || null;
      insertData.lead_id = body.lead_id || null;
    }

    if (body.recurring !== undefined) {
      insertData.recurring = body.recurring;
    }

    const { data, error } = await admin
      .from(table)
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error(`[DB_FAIL] POST /api/financieel/costs (${table}):`, error);
      await notifyOpsAlert({
        source: 'POST /api/financieel/costs',
        message: `Failed to create ${body.type} cost`,
        error,
        context: { type: body.type, category: body.category, amount: body.amount },
      });
      return NextResponse.json({ error: 'Kon kosten niet opslaan' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[API_ERROR] POST /api/financieel/costs:', error);
    await notifyOpsAlert({
      source: 'POST /api/financieel/costs',
      message: 'Cost creation failed',
      error,
    });
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

    if (!body.type || !VALID_TYPES.has(body.type)) {
      return NextResponse.json({ error: 'Ongeldig type: gebruik "job" of "business"' }, { status: 400 });
    }

    if (!body.id) {
      return NextResponse.json({ error: 'ID is verplicht' }, { status: 400 });
    }

    const table = getTableName(body.type);
    const admin = createAdminClient();

    const { error } = await admin
      .from(table)
      .delete()
      .eq('id', body.id);

    if (error) {
      console.error(`[DB_FAIL] DELETE /api/financieel/costs (${table}):`, error);
      return NextResponse.json({ error: 'Kon kosten niet verwijderen' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API_ERROR] DELETE /api/financieel/costs:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
