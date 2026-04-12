import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/resend';
import { invoiceEmail } from '@/lib/email/templates/invoice';
import { notifyOpsAlert } from '@/lib/ops/alerts';
import { logLeadEvent } from '@/lib/utils/events';
import { InvoiceDocument } from '@/lib/pdf/invoice-template';
import { getLogoDataUri } from '@/lib/pdf/assets';
import { getQuoteFontFamily } from '@/lib/pdf/fonts';

async function generateInvoiceNumber(supabase, existingNumber) {
  if (existingNumber) return existingNumber;

  const currentYear = new Date().getFullYear();

  // Try RPC first
  const { data: rpcData, error: rpcError } = await supabase.rpc('next_invoice_number');
  if (!rpcError && typeof rpcData === 'string' && rpcData) {
    return rpcData;
  }

  if (rpcError) {
    await notifyOpsAlert({
      source: '/api/invoices/[id]/send',
      message: 'next_invoice_number RPC unavailable, using fallback sequence',
      error: rpcError,
    });
  }

  // Fallback: count invoices with a number in the current year
  const startOfYear = `${currentYear}-01-01T00:00:00.000Z`;
  const startOfNextYear = `${currentYear + 1}-01-01T00:00:00.000Z`;
  const { count } = await supabase
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .not('invoice_number', 'is', null)
    .gte('created_at', startOfYear)
    .lt('created_at', startOfNextYear);

  return `MV-F-${currentYear}-${String((count || 0) + 1).padStart(4, '0')}`;
}

export async function POST(request, { params }) {
  const { id: invoiceId } = await params;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (error || !invoice) {
      return NextResponse.json({ error: 'Factuur niet gevonden' }, { status: 404 });
    }

    if (!invoice.customer_email) {
      return NextResponse.json({ error: 'Geen e-mailadres opgegeven' }, { status: 400 });
    }

    if (!invoice.line_items || invoice.line_items.length === 0) {
      return NextResponse.json({ error: 'Geen factuurregels' }, { status: 400 });
    }

    const invoiceNumber = await generateInvoiceNumber(admin, invoice.invoice_number);

    const logoDataUri = await getLogoDataUri();
    const fontFamily = await getQuoteFontFamily();

    let pdfBuffer;
    try {
      pdfBuffer = await renderToBuffer(
        InvoiceDocument({ invoice: { ...invoice, invoice_number: invoiceNumber }, logoDataUri, fontFamily })
      );
    } catch (renderError) {
      console.error('[API_ERROR] Invoice PDF render failed:', renderError);
      await notifyOpsAlert({
        source: '/api/invoices/[id]/send',
        message: 'Invoice PDF render failed',
        error: renderError,
        context: { invoice_id: invoiceId, invoice_number: invoiceNumber },
      });
      return NextResponse.json({ error: 'PDF generatie mislukt' }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://moonenvochtwering.nl';
    const pdfUrl = `${baseUrl}/api/pdf/invoice/${invoiceId}`;
    const dueDateFormatted = invoice.due_date
      ? new Date(invoice.due_date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
      : '14 dagen na factuurdatum';

    const emailContent = invoiceEmail({
      name: invoice.customer_name,
      amount: Number(invoice.total_incl || 0).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      invoiceNumber,
      pdfUrl,
      dueDate: dueDateFormatted,
    });

    const emailResult = await sendEmail({
      to: invoice.customer_email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      attachments: [
        {
          filename: `factuur-${invoiceNumber.toLowerCase()}.pdf`,
          content: pdfBuffer.toString('base64'),
        },
      ],
    });

    // Update invoice status
    const sentAt = new Date().toISOString();
    const { data: updatedInvoice } = await admin
      .from('invoices')
      .update({
        status: 'verzonden',
        sent_at: sentAt,
        invoice_number: invoiceNumber,
      })
      .eq('id', invoiceId)
      .select()
      .single();

    // Log email and event if linked to a lead
    if (invoice.lead_id) {
      await admin.from('email_log').insert({
        lead_id: invoice.lead_id,
        type: 'invoice',
        to_email: invoice.customer_email,
        subject: emailContent.subject,
        resend_id: emailResult?.id,
      });

      await logLeadEvent({
        leadId: invoice.lead_id,
        eventType: 'email_sent',
        actor: user.email || 'user',
        metadata: {
          type: 'invoice',
          to_email: invoice.customer_email,
          subject: emailContent.subject,
          amount: invoice.total_incl,
          invoice_number: invoiceNumber,
          invoice_id: invoiceId,
        },
      });
    }

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error('[API_ERROR] POST /api/invoices/[id]/send:', error);
    await notifyOpsAlert({
      source: '/api/invoices/[id]/send',
      message: 'Failed to send invoice email',
      error,
      context: { invoice_id: invoiceId },
    });
    return NextResponse.json({ error: 'Verzenden mislukt' }, { status: 500 });
  }
}
