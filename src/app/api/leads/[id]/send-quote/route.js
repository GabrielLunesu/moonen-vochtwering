import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/resend';
import { quoteEmail } from '@/lib/email/templates/quote';
import { notifyOpsAlert } from '@/lib/ops/alerts';
import { logLeadEvent } from '@/lib/utils/events';
import { generateToken } from '@/lib/utils/tokens';
import { QuoteDocument } from '@/lib/pdf/quote-template';
import { getLogoDataUri } from '@/lib/pdf/assets';

async function generateQuoteNumber({ supabase, lead }) {
  if (lead.quote_number) {
    return lead.quote_number;
  }

  const currentYear = new Date().getFullYear();

  const { data: rpcData, error: rpcError } = await supabase.rpc('next_quote_number');
  if (!rpcError && typeof rpcData === 'string' && rpcData) {
    return rpcData;
  }

  if (rpcError) {
    await notifyOpsAlert({
      source: '/api/leads/[id]/send-quote',
      message: 'next_quote_number RPC unavailable, using fallback sequence',
      error: rpcError,
      context: { lead_id: lead.id },
    });
  }

  const startOfYear = `${currentYear}-01-01T00:00:00.000Z`;
  const startOfNextYear = `${currentYear + 1}-01-01T00:00:00.000Z`;
  const { count } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .not('quote_number', 'is', null)
    .gte('created_at', startOfYear)
    .lt('created_at', startOfNextYear);

  return `MV-${currentYear}-${String((count || 0) + 1).padStart(4, '0')}`;
}

export async function POST(request, { params }) {
  const { id: leadId } = await params;
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: lead, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (error || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (!lead.quote_amount) {
      return NextResponse.json({ error: 'No quote amount set' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://moonenvochtwering.nl';
    const quoteToken = lead.quote_token || generateToken();
    const responseUrl = `${baseUrl}/reactie?token=${quoteToken}`;
    const quoteNumber = await generateQuoteNumber({ supabase, lead });
    const pdfUrl = `${baseUrl}/api/pdf/quote/${leadId}?token=${quoteToken}`;
    const logoDataUri = await getLogoDataUri();
    const leadForPdf = {
      ...lead,
      quote_number: quoteNumber,
      quote_token: quoteToken,
      quote_pdf_url: pdfUrl,
      quote_sent_at: new Date().toISOString(),
    };
    let pdfBuffer;
    try {
      pdfBuffer = await renderToBuffer(QuoteDocument({ lead: leadForPdf, logoDataUri }));
    } catch (renderError) {
      pdfBuffer = await renderToBuffer(
        QuoteDocument({
          lead: { ...leadForPdf, photos: [] },
          logoDataUri,
        })
      );
      await notifyOpsAlert({
        source: '/api/leads/[id]/send-quote',
        message: 'Quote PDF render failed with photos, sent fallback PDF without photos',
        error: renderError,
        context: { lead_id: leadId, quote_number: quoteNumber },
      });
    }

    // Load email template overrides
    const { data: templateSetting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'email_template_quote')
      .single();
    const overrides = templateSetting?.value || {};

    const emailContent = quoteEmail({
      name: lead.name,
      amount: lead.quote_amount,
      responseUrl,
      pdfUrl,
      quoteNumber,
      overrides,
    });

    const emailResult = await sendEmail({
      to: lead.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      attachments: [
        {
          filename: `offerte-${quoteNumber.toLowerCase()}.pdf`,
          content: pdfBuffer.toString('base64'),
        },
      ],
    });

    const sentAt = new Date().toISOString();
    const leadUpdates = {
      quote_sent_at: sentAt,
      last_email_at: sentAt,
      quote_pdf_url: pdfUrl,
      quote_token: quoteToken,
    };

    // Only update status/stage_changed_at if not already at offerte_verzonden or beyond
    if (lead.status !== 'offerte_verzonden') {
      leadUpdates.status = 'offerte_verzonden';
      if (Object.prototype.hasOwnProperty.call(lead, 'stage_changed_at')) {
        leadUpdates.stage_changed_at = sentAt;
      }
    }

    if (Object.prototype.hasOwnProperty.call(lead, 'quote_number')) {
      leadUpdates.quote_number = quoteNumber;
    }

    const { data: updated } = await supabase
      .from('leads')
      .update(leadUpdates)
      .eq('id', leadId)
      .select()
      .single();

    await supabase.from('email_log').insert({
      lead_id: leadId,
      type: 'quote',
      to_email: lead.email,
      subject: emailContent.subject,
      resend_id: emailResult?.id,
    });

    await logLeadEvent({
      leadId,
      eventType: 'email_sent',
      actor: user.email || 'user',
      metadata: {
        type: 'quote',
        to_email: lead.email,
        subject: emailContent.subject,
        amount: lead.quote_amount,
        quote_number: quoteNumber,
        pdf_url: pdfUrl,
      },
    });

    await logLeadEvent({
      leadId,
      eventType: 'quote_generated',
      actor: user.email || 'user',
      metadata: {
        quote_number: quoteNumber,
        amount: lead.quote_amount,
        pdf_url: pdfUrl,
      },
    });

    if (lead.status !== 'offerte_verzonden') {
      await logLeadEvent({
        leadId,
        eventType: 'status_change',
        oldValue: lead.status,
        newValue: 'offerte_verzonden',
        actor: user.email || 'user',
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    await notifyOpsAlert({
      source: '/api/leads/[id]/send-quote',
      message: 'Failed to send quote email',
      error,
      context: { lead_id: leadId },
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
