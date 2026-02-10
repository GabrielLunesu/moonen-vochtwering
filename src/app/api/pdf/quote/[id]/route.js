import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { QuoteDocument } from '@/lib/pdf/quote-template';
import { getLogoDataUri } from '@/lib/pdf/assets';
import { getQuoteFontFamily } from '@/lib/pdf/fonts';
import { notifyOpsAlert } from '@/lib/ops/alerts';

export async function GET(request, { params }) {
  const { id } = await params;
  const quoteToken = request.nextUrl.searchParams.get('token');

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && !quoteToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let query = supabase.from('leads').select('*').eq('id', id);
    if (!user) {
      query = query.eq('quote_token', quoteToken);
    }

    const { data: lead, error } = await query.single();

    if (error || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const logoDataUri = await getLogoDataUri();
    const fontFamily = await getQuoteFontFamily();
    let buffer;
    try {
      buffer = await renderToBuffer(QuoteDocument({ lead, logoDataUri, fontFamily }));
    } catch (renderError) {
      // If remote images fail to load, retry without embedded photos instead of failing the whole PDF.
      const fallbackLead = { ...lead, photos: [] };
      buffer = await renderToBuffer(QuoteDocument({ lead: fallbackLead, logoDataUri, fontFamily }));
      await notifyOpsAlert({
        source: '/api/pdf/quote/[id]',
        message: 'Quote PDF rendered without photos after image render failure',
        error: renderError,
        context: { lead_id: id },
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
      context: { lead_id: id, has_token: Boolean(quoteToken) },
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
