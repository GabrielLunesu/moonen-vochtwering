import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/resend';
import { followUpEmail } from '@/lib/email/templates/follow-up';
import { notifyOpsAlert } from '@/lib/ops/alerts';
import { logLeadEvent } from '@/lib/utils/events';

export async function POST(request, { params }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { data: lead, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !lead) {
      return NextResponse.json({ error: 'Lead niet gevonden' }, { status: 404 });
    }

    if (lead.status !== 'offerte_verzonden') {
      return NextResponse.json({ error: 'Lead staat niet in offerte_verzonden fase' }, { status: 400 });
    }

    if (!lead.email) {
      return NextResponse.json({ error: 'Lead heeft geen e-mailadres' }, { status: 400 });
    }

    const currentCount = lead.follow_up_count || 0;
    if (currentCount >= 3) {
      return NextResponse.json({ error: 'Maximaal aantal follow-ups (3) bereikt' }, { status: 400 });
    }

    // Load template overrides from settings
    const { data: templateSetting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'email_template_follow_up')
      .single();
    const followUpOverrides = templateSetting?.value || {};

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://moonenvochtwering.nl';
    const responseUrl = `${baseUrl}/reactie?token=${lead.quote_token}`;

    const emailContent = followUpEmail({
      name: lead.name,
      followUpCount: currentCount,
      responseUrl,
      overrides: followUpOverrides,
    });

    await sendEmail({
      to: lead.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    const admin = createAdminClient();

    // Update lead follow_up_count and last_email_at
    const { data: updated, error: updateError } = await admin
      .from('leads')
      .update({
        follow_up_count: currentCount + 1,
        last_email_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('[DB_FAIL] send-follow-up update:', updateError);
    }

    // Log email in email_log
    await admin.from('email_log').insert({
      lead_id: id,
      type: 'follow_up',
      to_email: lead.email,
      subject: emailContent.subject,
    });

    // Log event
    await logLeadEvent({
      leadId: id,
      eventType: 'email_sent',
      actor: user.email || 'admin',
      metadata: {
        type: 'follow_up',
        to_email: lead.email,
        subject: emailContent.subject,
        follow_up_count: currentCount + 1,
        manual: true,
      },
    });

    return NextResponse.json(updated || lead);
  } catch (error) {
    console.error('[API_ERROR] POST /api/leads/[id]/send-follow-up:', error);
    await notifyOpsAlert({
      source: 'POST /api/leads/[id]/send-follow-up',
      message: 'Manual follow-up send failed',
      error,
    });
    return NextResponse.json({ error: 'Kon follow-up niet verzenden' }, { status: 500 });
  }
}
