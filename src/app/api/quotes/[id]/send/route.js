import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/resend';
import { quoteEmail } from '@/lib/email/templates/quote';
import { notifyOpsAlert } from '@/lib/ops/alerts';
import { logLeadEvent } from '@/lib/utils/events';
import { QuoteDocument } from '@/lib/pdf/quote-template';
import { getLogoDataUri } from '@/lib/pdf/assets';
import { getQuoteFontFamily } from '@/lib/pdf/fonts';
import { getPostHogClient } from '@/lib/posthog-server';

async function generateQuoteNumber(supabase, existingNumber) {
  if (existingNumber) return existingNumber;

  const currentYear = new Date().getFullYear();

  const { data: rpcData, error: rpcError } = await supabase.rpc('next_quote_number');
  if (!rpcError && typeof rpcData === 'string' && rpcData) {
    return rpcData;
  }

  if (rpcError) {
    await notifyOpsAlert({
      source: '/api/quotes/[id]/send',
      message: 'next_quote_number RPC unavailable, using fallback sequence',
      error: rpcError,
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
  const { id: quoteId } = await params;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: quote, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single();

    if (error || !quote) {
      return NextResponse.json({ error: 'Offerte niet gevonden' }, { status: 404 });
    }

    if (!quote.customer_email) {
      return NextResponse.json({ error: 'Geen e-mailadres opgegeven' }, { status: 400 });
    }

    if (!quote.line_items || quote.line_items.length === 0) {
      return NextResponse.json({ error: 'Geen offerteregels' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://moonenvochtwering.nl';
    const quoteToken = quote.quote_token;
    const responseUrl = `${baseUrl}/reactie?token=${quoteToken}`;
    const quoteNumber = await generateQuoteNumber(supabase, quote.quote_number);

    // Build a lead-like object for the PDF template (reuse existing QuoteDocument)
    const leadForPdf = {
      id: quote.lead_id || quoteId,
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
      quote_number: quoteNumber,
      quote_token: quoteToken,
      quote_sent_at: new Date().toISOString(),
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

    const logoDataUri = await getLogoDataUri();
    const fontFamily = await getQuoteFontFamily();

    let pdfBuffer;
    try {
      pdfBuffer = await renderToBuffer(QuoteDocument({ lead: leadForPdf, logoDataUri, fontFamily }));
    } catch (renderError) {
      pdfBuffer = await renderToBuffer(
        QuoteDocument({
          lead: { ...leadForPdf, photos: [] },
          logoDataUri,
          fontFamily,
        })
      );
      await notifyOpsAlert({
        source: '/api/quotes/[id]/send',
        message: 'Quote PDF render failed with photos, sent fallback without photos',
        error: renderError,
        context: { quote_id: quoteId, quote_number: quoteNumber },
      });
    }

    // Load email template overrides
    const { data: templateSetting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'email_template_quote')
      .single();
    const overrides = templateSetting?.value || {};

    const pdfUrl = `${baseUrl}/api/pdf/quote/${quote.lead_id || quoteId}?token=${quoteToken}`;

    const emailContent = quoteEmail({
      name: quote.customer_name,
      amount: quote.total_incl,
      responseUrl,
      pdfUrl,
      quoteNumber,
      overrides,
    });

    const emailResult = await sendEmail({
      to: quote.customer_email,
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

    // Update quote status
    const sentAt = new Date().toISOString();
    const { data: updatedQuote } = await admin
      .from('quotes')
      .update({
        status: 'verzonden',
        sent_at: sentAt,
        quote_number: quoteNumber,
      })
      .eq('id', quoteId)
      .select()
      .single();

    // Update linked lead if exists
    if (quote.lead_id) {
      const { data: lead } = await supabase
        .from('leads')
        .select('status, quote_token')
        .eq('id', quote.lead_id)
        .single();

      if (lead) {
        const leadUpdates = {
          quote_sent_at: sentAt,
          last_email_at: sentAt,
          quote_amount: quote.total_incl,
          quote_token: quoteToken,
          quote_number: quoteNumber,
        };

        if (lead.status !== 'offerte_verzonden' && lead.status !== 'akkoord') {
          leadUpdates.status = 'offerte_verzonden';
          leadUpdates.stage_changed_at = sentAt;
        }

        await supabase
          .from('leads')
          .update(leadUpdates)
          .eq('id', quote.lead_id);

        if (lead.status !== 'offerte_verzonden' && lead.status !== 'akkoord') {
          await logLeadEvent({
            leadId: quote.lead_id,
            eventType: 'status_change',
            oldValue: lead.status,
            newValue: 'offerte_verzonden',
            actor: user.email || 'user',
          });
        }
      }

      // Log email event
      await admin.from('email_log').insert({
        lead_id: quote.lead_id,
        type: 'quote',
        to_email: quote.customer_email,
        subject: emailContent.subject,
        resend_id: emailResult?.id,
      });

      await logLeadEvent({
        leadId: quote.lead_id,
        eventType: 'email_sent',
        actor: user.email || 'user',
        metadata: {
          type: 'quote',
          to_email: quote.customer_email,
          subject: emailContent.subject,
          amount: quote.total_incl,
          quote_number: quoteNumber,
          quote_id: quoteId,
        },
      });
    }

    // Track quote sent in PostHog (server-side)
    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: user.email || 'gabriel',
      event: 'quote_sent',
      properties: {
        quote_id: quoteId,
        lead_id: quote.lead_id || null,
        quote_number: quoteNumber,
        amount: quote.total_incl,
        customer_plaatsnaam: quote.customer_plaatsnaam || null,
      },
    });
    await posthog.shutdown();

    return NextResponse.json(updatedQuote);
  } catch (error) {
    console.error('[API_ERROR] POST /api/quotes/[id]/send:', error);
    await notifyOpsAlert({
      source: '/api/quotes/[id]/send',
      message: 'Failed to send quote email',
      error,
      context: { quote_id: quoteId },
    });
    return NextResponse.json({ error: 'Verzenden mislukt' }, { status: 500 });
  }
}
