import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { InvoiceDocument } from '@/lib/pdf/invoice-template';
import { getLogoDataUri } from '@/lib/pdf/assets';
import { getQuoteFontFamily } from '@/lib/pdf/fonts';
import { notifyOpsAlert } from '@/lib/ops/alerts';

export async function GET(request, { params }) {
  const { id } = await params;

  try {
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

    const logoDataUri = await getLogoDataUri();
    const fontFamily = await getQuoteFontFamily();

    const buffer = await renderToBuffer(
      InvoiceDocument({ invoice, logoDataUri, fontFamily })
    );

    const safeName = (invoice.customer_name || 'factuur').replace(/\s+/g, '-').toLowerCase();
    const fileName = invoice.invoice_number
      ? `factuur-${invoice.invoice_number.toLowerCase()}-${safeName}.pdf`
      : `factuur-${safeName}.pdf`;

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('[API_ERROR] GET /api/pdf/invoice/[id]:', error);
    await notifyOpsAlert({
      source: '/api/pdf/invoice/[id]',
      message: 'Failed to render invoice PDF',
      error,
      context: { id },
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
