import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/resend';
import { notifyOpsAlert } from '@/lib/ops/alerts';
import { logLeadEvent } from '@/lib/utils/events';
import { getPostHogClient } from '@/lib/posthog-server';

export async function POST(request) {
  try {
    const { token, response, message } = await request.json();

    if (!token || !response) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    if (!['akkoord', 'vraag', 'nee'].includes(response)) {
      return NextResponse.json({ error: 'Invalid response' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: lead, error } = await supabase
      .from('leads')
      .select('*')
      .eq('quote_token', token)
      .single();

    if (error || !lead) {
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

    await supabase.from('leads').update(updates).eq('id', lead.id);

    await logLeadEvent({
      leadId: lead.id,
      eventType: 'customer_response',
      actor: 'customer',
      newValue: response,
      metadata: {
        message: message || null,
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
      },
    });
    await posthog.shutdown();

    // Notify admin
    const responseLabels = {
      akkoord: 'AKKOORD',
      vraag: 'VRAAG',
      nee: 'Afgewezen',
    };

    await sendEmail({
      to: 'info@moonenvochtwering.nl',
      subject: `Offerte reactie: ${lead.name} - ${responseLabels[response]}`,
      html: `
        <p><strong>${lead.name}</strong> uit ${lead.plaatsnaam} heeft gereageerd op de offerte:</p>
        <p style="font-size: 18px; font-weight: bold; color: ${response === 'akkoord' ? '#355b23' : response === 'nee' ? '#dc2626' : '#f97316'};">
          ${responseLabels[response]}
        </p>
        ${message ? `<p><strong>Bericht:</strong> ${message}</p>` : ''}
        <p>Telefoon: <a href="tel:${lead.phone}">${lead.phone}</a></p>
      `,
      text: `${lead.name} uit ${lead.plaatsnaam}: ${responseLabels[response]}${message ? `\nBericht: ${message}` : ''}\nTel: ${lead.phone}`,
    });

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
