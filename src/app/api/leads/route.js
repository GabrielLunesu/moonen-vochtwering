import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateToken } from '@/lib/utils/tokens';
import { notifyOpsAlert } from '@/lib/ops/alerts';
import { logLeadEvent } from '@/lib/utils/events';
import { getPostHogClient } from '@/lib/posthog-server';

export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, email, phone, straat, postcode, plaatsnaam, type_probleem, message } =
      await request.json();

    if (!name || !phone) {
      return NextResponse.json({ error: 'Naam en telefoon zijn verplicht' }, { status: 400 });
    }

    const availability_token = generateToken();
    const quote_token = generateToken();

    let fullMessage = message || '';
    if (straat) {
      const addressLine = `Adres: ${straat}, ${postcode || ''} ${plaatsnaam || ''}`.trim();
      fullMessage = fullMessage ? `${addressLine}\n\n${fullMessage}` : addressLine;
    }

    const admin = createAdminClient();
    const { data: lead, error: insertError } = await admin
      .from('leads')
      .insert({
        name,
        email: email || null,
        phone,
        plaatsnaam: plaatsnaam || null,
        postcode: postcode || null,
        message: fullMessage || null,
        type_probleem: type_probleem || null,
        source: 'telefoon',
        status: 'nieuw',
        availability_token,
        quote_token,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[DB_FAIL] POST /api/leads:', insertError);
      await notifyOpsAlert({
        source: 'POST /api/leads',
        message: 'Manual lead creation failed',
        error: insertError,
        context: { name, phone },
      });
      return NextResponse.json({ error: 'Kon lead niet aanmaken' }, { status: 500 });
    }

    await logLeadEvent({
      leadId: lead.id,
      eventType: 'lead_created',
      actor: user.email || 'admin',
      metadata: { source: 'telefoon', type_probleem: type_probleem || null },
    });

    // Track manual lead creation in PostHog (server-side)
    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: user.email || 'gabriel',
      event: 'lead_created',
      properties: {
        lead_id: lead.id,
        source: 'telefoon',
        type_probleem: type_probleem || null,
        plaatsnaam: plaatsnaam || null,
      },
    });
    await posthog.shutdown();

    return NextResponse.json(lead);
  } catch (error) {
    console.error('[API_ERROR] POST /api/leads:', error);
    await notifyOpsAlert({
      source: 'POST /api/leads',
      message: 'Manual lead creation failed',
      error,
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
