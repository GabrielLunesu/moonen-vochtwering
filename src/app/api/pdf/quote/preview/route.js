import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { createClient } from '@/lib/supabase/server';
import { QuoteDocument } from '@/lib/pdf/quote-template';
import { getLogoDataUri } from '@/lib/pdf/assets';
import { getQuoteFontFamily } from '@/lib/pdf/fonts';
import { notifyOpsAlert } from '@/lib/ops/alerts';

export async function POST(request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await request.json();
    const draftLead = payload?.draftLead;

    if (!draftLead || typeof draftLead !== 'object') {
      return NextResponse.json({ error: 'draftLead is required' }, { status: 400 });
    }

    const logoDataUri = await getLogoDataUri();
    const fontFamily = await getQuoteFontFamily();

    let buffer;
    try {
      buffer = await renderToBuffer(QuoteDocument({ lead: draftLead, logoDataUri, fontFamily }));
    } catch (renderError) {
      buffer = await renderToBuffer(
        QuoteDocument({
          lead: { ...draftLead, photos: [] },
          logoDataUri,
          fontFamily,
        })
      );
      await notifyOpsAlert({
        source: '/api/pdf/quote/preview',
        message: 'Draft quote PDF rendered without photos after image render failure',
        error: renderError,
        context: { lead_id: draftLead?.id || null },
      });
    }

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    await notifyOpsAlert({
      source: '/api/pdf/quote/preview',
      message: 'Failed to render draft quote PDF',
      error,
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
