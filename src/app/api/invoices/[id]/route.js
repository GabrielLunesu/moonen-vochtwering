import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logLeadEvent } from '@/lib/utils/events';
import { notifyOpsAlert } from '@/lib/ops/alerts';
import { normalizeDiscountType } from '@/lib/utils/quote-discounts';

export async function GET(request, { params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !invoice) {
    return NextResponse.json({ error: 'Factuur niet gevonden' }, { status: 404 });
  }

  return NextResponse.json(invoice);
}

export async function PATCH(request, { params }) {
  const { id } = await params;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Remove fields that shouldn't be updated directly
    delete body.id;
    delete body.created_at;

    // Protect invoice_number for sent invoices
    if (Object.prototype.hasOwnProperty.call(body, 'invoice_number')) {
      const { data: existing } = await supabase
        .from('invoices')
        .select('status')
        .eq('id', id)
        .single();

      if (existing && existing.status !== 'concept') {
        delete body.invoice_number;
      }
    }

    if (Object.prototype.hasOwnProperty.call(body, 'discount_type')) {
      const discountType = normalizeDiscountType(body.discount_type);
      if (body.discount_type && !discountType) {
        return NextResponse.json({ error: 'Ongeldig kortingstype' }, { status: 400 });
      }
      body.discount_type = discountType;
    }

    const admin = createAdminClient();
    const { data: invoice, error } = await admin
      .from('invoices')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[DB_FAIL] PATCH /api/invoices/[id]:', error);
      await notifyOpsAlert({
        source: 'PATCH /api/invoices/[id]',
        message: 'Failed to update invoice',
        error,
        context: { invoice_id: id },
      });
      return NextResponse.json({ error: 'Kon factuur niet bijwerken' }, { status: 500 });
    }

    if (!invoice) {
      return NextResponse.json({ error: 'Factuur niet gevonden' }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('[API_ERROR] PATCH /api/invoices/[id]:', error);
    await notifyOpsAlert({
      source: 'PATCH /api/invoices/[id]',
      message: 'Invoice update failed',
      error,
      context: { invoice_id: id },
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the invoice first to check for lead_id
    const { data: existing } = await supabase
      .from('invoices')
      .select('lead_id, invoice_number')
      .eq('id', id)
      .single();

    const admin = createAdminClient();
    const { error } = await admin
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[DB_FAIL] DELETE /api/invoices/[id]:', error);
      return NextResponse.json({ error: 'Kon factuur niet verwijderen' }, { status: 500 });
    }

    if (existing?.lead_id) {
      await logLeadEvent({
        leadId: existing.lead_id,
        eventType: 'invoice_deleted',
        actor: user.email || 'admin',
        metadata: { invoice_id: id, invoice_number: existing.invoice_number || null },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API_ERROR] DELETE /api/invoices/[id]:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
