import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/resend';
import { notifyOpsAlert } from '@/lib/ops/alerts';
import { logLeadEvent } from '@/lib/utils/events';
import { getPostHogClient } from '@/lib/posthog-server';

const TERMS_URL = 'https://www.moonenvochtwering.nl/algemene-voorwaarden.pdf';
const RESPONSE_LABELS = {
  akkoord: 'AKKOORD',
  vraag: 'VRAAG',
  nee: 'Afgewezen',
};

export async function POST(request) {
  try {
    const { token, response, message, termsAccepted } = await request.json();

    if (!token || !response) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    if (!['akkoord', 'vraag', 'nee'].includes(response)) {
      return NextResponse.json({ error: 'Invalid response' }, { status: 400 });
    }

    if (response === 'akkoord' && termsAccepted !== true) {
      return NextResponse.json(
        { error: 'Algemene voorwaarden moeten worden geaccepteerd' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('id, lead_id, status, quote_number, quote_token, total_incl')
      .eq('quote_token', token)
      .maybeSingle();

    if (quoteError) {
      console.error('[DB_FAIL] Quote lookup by token:', quoteError);
      return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }

    let lead = null;
    let leadError = null;

    if (quote?.lead_id) {
      const result = await supabase
        .from('leads')
        .select('*')
        .eq('id', quote.lead_id)
        .single();
      lead = result.data;
      leadError = result.error;
    } else {
      const result = await supabase
        .from('leads')
        .select('*')
        .eq('quote_token', token)
        .maybeSingle();
      lead = result.data;
      leadError = result.error;
    }

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
    }

    // Update lead
    const updates = {
      quote_response: response,
      quote_response_at: new Date().toISOString(),
    };

    if (response === 'akkoord') {
      updates.status = 'akkoord';
      if (Object.prototype.hasOwnProperty.call(lead, 'stage_changed_at')) {
        updates.stage_changed_at = new Date().toISOString();
      }
    }

    const { error: updateLeadError } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', lead.id);

    if (updateLeadError) {
      console.error('[DB_FAIL] Quote response lead update:', updateLeadError);
      return NextResponse.json({ error: 'Kon reactie niet opslaan' }, { status: 500 });
    }

    // Also update linked quote status to match
    if (response === 'akkoord' || response === 'nee') {
      const quoteStatus = response === 'akkoord' ? 'akkoord' : 'afgewezen';
      const quoteUpdate = supabase
        .from('quotes')
        .update({ status: quoteStatus, response, response_at: new Date().toISOString() });

      const { error: updateQuoteError } = quote
        ? await quoteUpdate.eq('id', quote.id)
        : await quoteUpdate.eq('lead_id', lead.id).eq('status', 'verzonden');

      if (updateQuoteError) {
        console.error('[DB_FAIL] Quote response quote update:', updateQuoteError);
        await notifyOpsAlert({
          source: '/api/customer/quote-response',
          message: 'Lead response saved but linked quote update failed',
          error: updateQuoteError,
          context: { lead_id: lead.id, quote_id: quote?.id || null, response },
        });
      }
    }

    await logLeadEvent({
      leadId: lead.id,
      eventType: 'customer_response',
      actor: 'customer',
      newValue: response,
      metadata: {
        message: message || null,
        termsAccepted: response === 'akkoord' ? true : null,
        termsUrl: response === 'akkoord' ? TERMS_URL : null,
      },
    });

    if (response === 'akkoord' && lead.status !== 'akkoord') {
      await logLeadEvent({
        leadId: lead.id,
        eventType: 'status_change',
        actor: 'customer',
        oldValue: lead.status,
        newValue: 'akkoord',
      });
    }

    // Track quote response in PostHog (server-side)
    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: lead.id,
      event: 'quote_response_received',
      properties: {
        lead_id: lead.id,
        response,
        quote_amount: lead.quote_amount || null,
        quote_number: lead.quote_number || null,
        plaatsnaam: lead.plaatsnaam || null,
        terms_accepted: response === 'akkoord' ? true : null,
      },
    });
    await posthog.shutdown();

    // Notify admin
    try {
      await sendEmail({
        to: 'info@moonenvochtwering.nl',
        subject: `Offerte reactie: ${lead.name} - ${RESPONSE_LABELS[response]}`,
        html: `
          <p><strong>${lead.name}</strong> uit ${lead.plaatsnaam} heeft gereageerd op de offerte:</p>
          <p style="font-size: 18px; font-weight: bold; color: ${response === 'akkoord' ? '#355b23' : response === 'nee' ? '#dc2626' : '#f97316'};">
            ${RESPONSE_LABELS[response]}
          </p>
          ${message ? `<p><strong>Bericht:</strong> ${message}</p>` : ''}
          ${response === 'akkoord' ? '<p><strong>Algemene voorwaarden:</strong> geaccepteerd door de klant.</p>' : ''}
          <p>Telefoon: <a href="tel:${lead.phone}">${lead.phone}</a></p>
        `,
        text: `${lead.name} uit ${lead.plaatsnaam}: ${RESPONSE_LABELS[response]}${message ? `\nBericht: ${message}` : ''}${response === 'akkoord' ? '\nAlgemene voorwaarden: geaccepteerd door de klant.' : ''}\nTel: ${lead.phone}`,
      });
    } catch (emailError) {
      await notifyOpsAlert({
        source: '/api/customer/quote-response',
        message: 'Customer response saved but admin notification failed',
        error: emailError,
        context: { lead_id: lead.id, quote_id: quote?.id || null, response },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Quote response error:', error);
    await notifyOpsAlert({
      source: '/api/customer/quote-response',
      message: 'Customer quote response failed',
      error,
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
