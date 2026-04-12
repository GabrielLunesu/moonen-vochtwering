import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { createClient } from '@/lib/supabase/server';
import { InvoiceDocument } from '@/lib/pdf/invoice-template';
import { getLogoDataUri } from '@/lib/pdf/assets';
import { getQuoteFontFamily } from '@/lib/pdf/fonts';
import { notifyOpsAlert } from '@/lib/ops/alerts';

export async function POST(request) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await request.json();
    const invoice = payload?.invoice;

    if (!invoice || typeof invoice !== 'object') {
      return NextResponse.json({ error: 'invoice is required' }, { status: 400 });
    }

    const logoDataUri = await getLogoDataUri();
    const fontFamily = await getQuoteFontFamily();

    const buffer = await renderToBuffer(
      InvoiceDocument({ invoice, logoDataUri, fontFamily })
    );

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[API_ERROR] POST /api/pdf/invoice/preview:', error);
    await notifyOpsAlert({
      source: '/api/pdf/invoice/preview',
      message: 'Failed to render invoice preview PDF',
      error,
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
