import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateToken } from '@/lib/utils/tokens';
import { logLeadEvent } from '@/lib/utils/events';
import { notifyOpsAlert } from '@/lib/ops/alerts';

export async function GET(request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const leadId = request.nextUrl.searchParams.get('lead');

  let query = supabase
    .from('quotes')
    .select('*')
    .order('created_at', { ascending: false });

  if (leadId) {
    query = query.eq('lead_id', leadId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[DB_FAIL] GET /api/quotes:', error);
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

    if (!body.customer_name) {
      return NextResponse.json({ error: 'Klantnaam is verplicht' }, { status: 400 });
    }

    const admin = createAdminClient();

    // If no lead_id, auto-create a lead
    let leadId = body.lead_id || null;
    if (!leadId && body.customer_name) {
      const { data: newLead, error: leadError } = await admin
        .from('leads')
        .insert({
          name: body.customer_name,
          email: body.customer_email || 'onbekend@moonenvochtwering.nl',
          phone: body.customer_phone || '',
          plaatsnaam: body.customer_plaatsnaam || '',
          postcode: body.customer_postcode || null,
          source: 'offerte',
          status: 'nieuw',
          availability_token: generateToken(),
          quote_token: generateToken(),
        })
        .select()
        .single();

      if (leadError) {
        console.error('[DB_FAIL] Auto-create lead for quote:', leadError);
        await notifyOpsAlert({
          source: 'POST /api/quotes',
          message: 'Failed to auto-create lead for quote',
          error: leadError,
          context: { customer_name: body.customer_name },
        });
        return NextResponse.json({ error: 'Kon lead niet automatisch aanmaken' }, { status: 500 });
      }

      leadId = newLead.id;

      await logLeadEvent({
        leadId,
        eventType: 'lead_created',
        actor: user.email || 'admin',
        metadata: { source: 'offerte', auto_created: true },
      });
    }

    const quoteToken = generateToken();

    const { data: quote, error: insertError } = await admin
      .from('quotes')
      .insert({
        lead_id: leadId,
        customer_name: body.customer_name,
        customer_email: body.customer_email || null,
        customer_phone: body.customer_phone || null,
        customer_straat: body.customer_straat || null,
        customer_postcode: body.customer_postcode || null,
        customer_plaatsnaam: body.customer_plaatsnaam || null,
        diagnose: body.diagnose || [],
        diagnose_details: body.diagnose_details || null,
        oplossingen: body.oplossingen || [],
        kelder_sub_areas: body.kelder_sub_areas || null,
        oppervlakte_m2: body.oppervlakte_m2 || null,
        injectie_depth: body.injectie_depth || null,
        notes: body.notes || null,
        photos: body.photos || [],
        line_items: body.line_items || [],
        subtotal_incl: body.subtotal_incl || 0,
        discount_type: body.discount_type || null,
        discount_value: body.discount_value || null,
        discount_amount: body.discount_amount || 0,
        btw_percentage: body.btw_percentage ?? 21,
        btw_amount: body.btw_amount || 0,
        total_incl: body.total_incl || 0,
        garantie_jaren: body.garantie_jaren ?? 5,
        doorlooptijd: body.doorlooptijd || '3 werkdagen',
        betaling: body.betaling || 'Op de eerste werkdag bij aanvang, restant binnen 2 weken na oplevering',
        geldigheid_dagen: body.geldigheid_dagen ?? 30,
        offerte_inleiding: body.offerte_inleiding || null,
        label: body.label || null,
        status: 'concept',
        quote_token: quoteToken,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[DB_FAIL] POST /api/quotes:', insertError);
      await notifyOpsAlert({
        source: 'POST /api/quotes',
        message: 'Failed to create quote',
        error: insertError,
        context: { lead_id: leadId, customer_name: body.customer_name },
      });
      return NextResponse.json({ error: 'Kon offerte niet aanmaken' }, { status: 500 });
    }

    if (leadId) {
      await logLeadEvent({
        leadId,
        eventType: 'quote_created',
        actor: user.email || 'admin',
        metadata: { quote_id: quote.id, label: body.label || null },
      });

      // Auto-advance lead to 'bezocht' if still in an early stage
      const { data: currentLead } = await admin
        .from('leads')
        .select('status')
        .eq('id', leadId)
        .single();

      if (currentLead && ['nieuw', 'uitgenodigd', 'bevestigd'].includes(currentLead.status)) {
        const { error: advanceError } = await admin
          .from('leads')
          .update({ status: 'bezocht', stage_changed_at: new Date().toISOString() })
          .eq('id', leadId);

        if (advanceError) {
          console.error('[DB_FAIL] Auto-advance lead after quote creation:', advanceError);
        } else {
          await logLeadEvent({
            leadId,
            eventType: 'status_change',
            oldValue: currentLead.status,
            newValue: 'bezocht',
            actor: 'system',
            metadata: { reason: 'quote_created', quote_id: quote.id },
          });
        }
      }
    }

    return NextResponse.json(quote);
  } catch (error) {
    console.error('[API_ERROR] POST /api/quotes:', error);
    await notifyOpsAlert({
      source: 'POST /api/quotes',
      message: 'Quote creation failed',
      error,
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
