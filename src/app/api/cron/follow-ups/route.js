import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/resend';
import { followUpEmail } from '@/lib/email/templates/follow-up';
import { notifyOpsAlert } from '@/lib/ops/alerts';
import { logLeadEvent } from '@/lib/utils/events';

function toDayNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Automatic follow-ups disabled — use manual send from lead detail panel instead
    return NextResponse.json({
      message: 'Automatic follow-ups disabled. Use manual send from CRM.',
      count: 0,
    });

    const supabase = createAdminClient();

    // Get follow-up schedule
    const { data: settingsRow } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'follow_up_days')
      .single();

    const configuredDays = Array.isArray(settingsRow?.value) ? settingsRow.value : [2, 5, 10];
    const followUpDays = [
      toDayNumber(configuredDays[0], 2),
      toDayNumber(configuredDays[1], 5),
      toDayNumber(configuredDays[2], 10),
    ];
    const maxFollowUps = followUpDays.length;

    // Find leads with sent quotes that haven't responded
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .eq('status', 'offerte_verzonden')
      .not('quote_sent_at', 'is', null)
      .is('quote_response', null)
      .eq('followup_paused', false)
      .lt('follow_up_count', maxFollowUps);

    if (leadsError) {
      throw leadsError;
    }

    if (!leads?.length) {
      return NextResponse.json({ message: 'No follow-ups needed', count: 0 });
    }

    // Load email template overrides
    const { data: templateSetting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'email_template_follow_up')
      .single();
    const followUpOverrides = templateSetting?.value || {};

    let sent = 0;
    const failed = [];

    for (const lead of leads) {
      const daysSinceQuote = Math.floor(
        (Date.now() - new Date(lead.quote_sent_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      const nextFollowUpDay = followUpDays[lead.follow_up_count];
      if (daysSinceQuote < nextFollowUpDay) continue;

      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://moonenvochtwering.nl';
      const responseUrl = `${baseUrl}/reactie?token=${lead.quote_token}`;

      const emailContent = followUpEmail({
        name: lead.name,
        followUpCount: lead.follow_up_count,
        responseUrl,
        overrides: followUpOverrides,
      });

      try {
        await sendEmail({
          to: lead.email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });

        await supabase
          .from('leads')
          .update({
            follow_up_count: lead.follow_up_count + 1,
            last_email_at: new Date().toISOString(),
          })
          .eq('id', lead.id);

        await supabase.from('email_log').insert({
          lead_id: lead.id,
          type: 'follow_up',
          to_email: lead.email,
          subject: emailContent.subject,
        });

        await logLeadEvent({
          leadId: lead.id,
          eventType: 'email_sent',
          actor: 'system',
          metadata: {
            type: 'follow_up',
            to_email: lead.email,
            subject: emailContent.subject,
            follow_up_count: lead.follow_up_count + 1,
          },
        });

        sent++;
      } catch (err) {
        console.error(`Follow-up failed for ${lead.email}:`, err);
        failed.push({
          lead_id: lead.id,
          email: lead.email,
          error: err?.message || String(err),
        });
      }
    }

    if (failed.length > 0) {
      await notifyOpsAlert({
        source: '/api/cron/follow-ups',
        message: 'One or more follow-up emails failed',
        error: `${failed.length} failures`,
        context: { sent, failed },
      });
    }

    return NextResponse.json({
      message: `Sent ${sent} follow-ups`,
      count: sent,
      failed: failed.length,
    });
  } catch (error) {
    await notifyOpsAlert({
      source: '/api/cron/follow-ups',
      message: 'Cron follow-up run failed',
      error,
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
