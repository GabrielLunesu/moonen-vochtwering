import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logLeadEvent } from '@/lib/utils/events';
import { notifyOpsAlert } from '@/lib/ops/alerts';

export async function GET(request, { params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: quote, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !quote) {
    return NextResponse.json({ error: 'Offerte niet gevonden' }, { status: 404 });
  }

  return NextResponse.json(quote);
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
    delete body.quote_token;

    const admin = createAdminClient();
    const { data: quote, error } = await admin
      .from('quotes')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[DB_FAIL] PATCH /api/quotes/[id]:', error);
      await notifyOpsAlert({
        source: 'PATCH /api/quotes/[id]',
        message: 'Failed to update quote',
        error,
        context: { quote_id: id },
      });
      return NextResponse.json({ error: 'Kon offerte niet bijwerken' }, { status: 500 });
    }

    if (!quote) {
      return NextResponse.json({ error: 'Offerte niet gevonden' }, { status: 404 });
    }

    return NextResponse.json(quote);
  } catch (error) {
    console.error('[API_ERROR] PATCH /api/quotes/[id]:', error);
    await notifyOpsAlert({
      source: 'PATCH /api/quotes/[id]',
      message: 'Quote update failed',
      error,
      context: { quote_id: id },
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

    // Get the quote first to check for lead_id
    const { data: existing } = await supabase
      .from('quotes')
      .select('lead_id, label')
      .eq('id', id)
      .single();

    const admin = createAdminClient();
    const { error } = await admin
      .from('quotes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[DB_FAIL] DELETE /api/quotes/[id]:', error);
      return NextResponse.json({ error: 'Kon offerte niet verwijderen' }, { status: 500 });
    }

    if (existing?.lead_id) {
      await logLeadEvent({
        leadId: existing.lead_id,
        eventType: 'quote_deleted',
        actor: user.email || 'admin',
        metadata: { quote_id: id, label: existing.label || null },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API_ERROR] DELETE /api/quotes/[id]:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
