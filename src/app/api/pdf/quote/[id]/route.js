import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { renderToBuffer } from '@react-pdf/renderer';
import { QuoteDocument } from '@/lib/pdf/quote-template';
import { getLogoDataUri } from '@/lib/pdf/assets';
import { getQuoteFontFamily } from '@/lib/pdf/fonts';
import { notifyOpsAlert } from '@/lib/ops/alerts';

/**
 * Build a lead-like object from a quote record for the PDF template.
 */
function buildLeadFromQuote(quote) {
  return {
    id: quote.lead_id || quote.id,
    name: quote.customer_name,
    email: quote.customer_email,
    phone: quote.customer_phone,
    straat: quote.customer_straat,
    postcode: quote.customer_postcode,
    plaatsnaam: quote.customer_plaatsnaam,
    oppervlakte_m2: quote.oppervlakte_m2,
    inspection_notes: quote.notes,
    quote_amount: quote.total_incl,
    photos: quote.photos || [],
    quote_number: quote.quote_number,
    quote_token: quote.quote_token,
    quote_sent_at: quote.sent_at,
    inspection_data_v2: {
      diagnose: quote.diagnose,
      diagnose_details: quote.diagnose_details,
      oplossingen: quote.oplossingen,
      kelder_sub_areas: quote.kelder_sub_areas,
      oppervlakte_m2: quote.oppervlakte_m2,
      line_items: quote.line_items,
      subtotal: quote.subtotal_incl,
      discount_type: quote.discount_type,
      discount_value: quote.discount_value,
      discount_amount: quote.discount_amount,
      btw_percentage: quote.btw_percentage,
      btw_amount: quote.btw_amount,
      total_incl_btw: quote.total_incl,
      garantie_jaren: quote.garantie_jaren,
      doorlooptijd: quote.doorlooptijd,
      betaling: quote.betaling,
      geldigheid_dagen: quote.geldigheid_dagen,
      offerte_inleiding: quote.offerte_inleiding,
      injectie_depth: quote.injectie_depth,
      notes: quote.notes,
    },
  };
}

export async function GET(request, { params }) {
  const { id } = await params;
  const quoteToken = request.nextUrl.searchParams.get('token');

  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && !quoteToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let lead = null;

    // Try to find a quote by token first (preferred — quote has all data)
    if (quoteToken) {
      const { data: quote } = await admin
        .from('quotes')
        .select('*')
        .eq('quote_token', quoteToken)
        .single();

      if (quote) {
        lead = buildLeadFromQuote(quote);
      }
    }

    // If no quote found by token, try by ID (authenticated users or legacy leads)
    if (!lead) {
      let query = supabase.from('leads').select('*').eq('id', id);
      if (!user) {
        query = query.eq('quote_token', quoteToken);
      }
      const { data: leadData, error: leadError } = await query.single();

      if (leadError || !leadData) {
        // Last resort: try quotes table by ID (for quotes without a lead)
        if (user) {
          const { data: quoteById } = await supabase
            .from('quotes')
            .select('*')
            .eq('id', id)
            .single();

          if (quoteById) {
            lead = buildLeadFromQuote(quoteById);
          }
        }

        if (!lead) {
          return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 });
        }
      } else {
        lead = leadData;
      }
    }

    const logoDataUri = await getLogoDataUri();
    const fontFamily = await getQuoteFontFamily();
    let buffer;
    try {
      buffer = await renderToBuffer(QuoteDocument({ lead, logoDataUri, fontFamily }));
    } catch (renderError) {
      const fallbackLead = { ...lead, photos: [] };
      buffer = await renderToBuffer(QuoteDocument({ lead: fallbackLead, logoDataUri, fontFamily }));
      await notifyOpsAlert({
        source: '/api/pdf/quote/[id]',
        message: 'Quote PDF rendered without photos after image render failure',
        error: renderError,
        context: { id },
      });
    }
    const safeName = (lead.name || 'offerte').replace(/\s+/g, '-').toLowerCase();
    const fileName = lead.quote_number
      ? `offerte-${lead.quote_number.toLowerCase()}-${safeName}.pdf`
      : `offerte-${safeName}.pdf`;

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${fileName}"`,
      },
    });
  } catch (error) {
    await notifyOpsAlert({
      source: '/api/pdf/quote/[id]',
      message: 'Failed to render quote PDF',
      error,
      context: { id, has_token: Boolean(quoteToken) },
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
