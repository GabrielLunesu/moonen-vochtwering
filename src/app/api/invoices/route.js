import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logLeadEvent } from '@/lib/utils/events';
import { notifyOpsAlert } from '@/lib/ops/alerts';
import { normalizeDiscountType } from '@/lib/utils/quote-discounts';

export async function GET(request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const leadId = request.nextUrl.searchParams.get('lead');

  let query = supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false });

  if (leadId) {
    query = query.eq('lead_id', leadId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[DB_FAIL] GET /api/invoices:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const discountType = normalizeDiscountType(body.discount_type);

    if (!body.customer_name) {
      return NextResponse.json({ error: 'Klantnaam is verplicht' }, { status: 400 });
    }

    if (body.discount_type && !discountType) {
      return NextResponse.json({ error: 'Ongeldig kortingstype' }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: invoice, error: insertError } = await admin
      .from('invoices')
      .insert({
        lead_id: body.lead_id || null,
        quote_id: body.quote_id || null,
        customer_name: body.customer_name,
        customer_email: body.customer_email || null,
        customer_phone: body.customer_phone || null,
        customer_straat: body.customer_straat || null,
        customer_postcode: body.customer_postcode || null,
        customer_plaatsnaam: body.customer_plaatsnaam || null,
        line_items: body.line_items || [],
        subtotal_incl: body.subtotal_incl || 0,
        discount_type: discountType,
        discount_value: body.discount_value || null,
        discount_amount: body.discount_amount || 0,
        btw_percentage: body.btw_percentage ?? 21,
        btw_amount: body.btw_amount || 0,
        total_incl: body.total_incl || 0,
        betaling: body.betaling || 'Binnen 14 dagen na factuurdatum',
        notes: body.notes || null,
        due_date: body.due_date || null,
        issue_date: body.issue_date || null,
        status: 'concept',
      })
      .select()
      .single();

    if (insertError) {
      console.error('[DB_FAIL] POST /api/invoices:', insertError);
      await notifyOpsAlert({
        source: 'POST /api/invoices',
        message: 'Failed to create invoice',
        error: insertError,
        context: { lead_id: body.lead_id, customer_name: body.customer_name },
      });
      return NextResponse.json({ error: 'Kon factuur niet aanmaken' }, { status: 500 });
    }

    if (body.lead_id) {
      await logLeadEvent({
        leadId: body.lead_id,
        eventType: 'invoice_created',
        actor: user.email || 'admin',
        metadata: { invoice_id: invoice.id, quote_id: body.quote_id || null },
      });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('[API_ERROR] POST /api/invoices:', error);
    await notifyOpsAlert({
      source: 'POST /api/invoices',
      message: 'Invoice creation failed',
      error,
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
