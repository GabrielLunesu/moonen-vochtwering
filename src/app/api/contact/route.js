import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/resend';
import { adminNotificationEmail } from '@/lib/email/templates/admin-notification';
import { planInspectionEmail } from '@/lib/email/templates/plan-inspection';
import { generateToken } from '@/lib/utils/tokens';
import { notifyOpsAlert } from '@/lib/ops/alerts';
import { logLeadEvent } from '@/lib/utils/events';

export async function POST(request) {
  try {
    const { name, email, phone, message, type_probleem } = await request.json();

    // Validate required fields
    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Naam, e-mail en telefoonnummer zijn verplicht' },
        { status: 400 }
      );
    }

    // Generate tokens for customer action links
    const availability_token = generateToken();
    const quote_token = generateToken();

    // Insert lead into Supabase
    const supabase = createAdminClient();
    const { data: lead, error: dbError } = await supabase
      .from('leads')
      .insert({
        name,
        email,
        phone,
        plaatsnaam: null,
        message: message || null,
        type_probleem: type_probleem || null,
        availability_token,
        quote_token,
        source: 'website',
      })
      .select()
      .single();

    if (dbError) {
      console.error('[DB_FAIL] /api/contact insert:', dbError);
      throw new Error('Database error');
    }

    await logLeadEvent({
      leadId: lead.id,
      eventType: 'lead_received',
      actor: 'customer',
      metadata: {
        source: 'website',
        type_probleem: lead.type_probleem || null,
      },
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://moonenvochtwering.nl';

    // Send admin notification email
    const adminEmail = adminNotificationEmail({ lead });
    const adminEmailPromise = sendEmail({
      to: 'info@moonenvochtwering.nl',
      subject: adminEmail.subject,
      html: adminEmail.html,
      text: adminEmail.text,
    });

    // Load email template overrides for plan-inspection
    const { data: templateSetting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'email_template_plan_inspection')
      .single();
    const overrides = templateSetting?.value || {};

    // Send planning CTA email to customer (replaces generic auto-reply)
    const planEmail = planInspectionEmail({
      name,
      siteUrl,
      token: availability_token,
      overrides,
    });
    const customerEmailPromise = sendEmail({
      to: email,
      subject: planEmail.subject,
      html: planEmail.html,
      text: planEmail.text,
    });

    const emailResults = await Promise.allSettled([adminEmailPromise, customerEmailPromise]);
    const [adminResult, customerResult] = emailResults;

    // If the planning email was sent successfully, update status to uitgenodigd
    if (customerResult.status === 'fulfilled') {
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          status: 'uitgenodigd',
          ...(Object.prototype.hasOwnProperty.call(lead, 'stage_changed_at')
            ? { stage_changed_at: new Date().toISOString() }
            : {}),
        })
        .eq('id', lead.id);

      if (!updateError) {
        await logLeadEvent({
          leadId: lead.id,
          eventType: 'status_change',
          oldValue: 'nieuw',
          newValue: 'uitgenodigd',
          actor: 'system',
        });

        await logLeadEvent({
          leadId: lead.id,
          eventType: 'email_sent',
          actor: 'system',
          metadata: {
            type: 'plan_inspection',
            to_email: email,
            subject: planEmail.subject,
          },
        });
      }

      // Log to email_log
      await supabase.from('email_log').insert({
        lead_id: lead.id,
        type: 'plan_inspection',
        to_email: email,
        subject: planEmail.subject,
      });
    }

    // Check for failures and notify ops
    const failedEmails = emailResults.filter((result) => result.status === 'rejected');
    if (failedEmails.length > 0) {
      await notifyOpsAlert({
        source: '/api/contact',
        message: 'Lead saved but one or more emails failed',
        error: failedEmails.map((result) => result.reason?.message || String(result.reason)).join(' | '),
        context: {
          lead_id: lead.id,
          lead_email: lead.email,
          failed_count: failedEmails.length,
          planning_email_sent: customerResult.status === 'fulfilled',
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API_ERROR] /api/contact:', error);
    await notifyOpsAlert({
      source: '/api/contact',
      message: 'Contact form request failed',
      error,
    });
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het versturen van uw bericht' },
      { status: 500 }
    );
  }
}
