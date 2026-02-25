import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/resend';
import { adminNotificationEmail } from '@/lib/email/templates/admin-notification';
import { planInspectionEmail } from '@/lib/email/templates/plan-inspection';
import { contactReceivedEmail } from '@/lib/email/templates/contact-received';
import { generateToken } from '@/lib/utils/tokens';
import { notifyOpsAlert } from '@/lib/ops/alerts';
import { logLeadEvent } from '@/lib/utils/events';
import { getPostHogClient } from '@/lib/posthog-server';

export async function POST(request) {
  try {
    const { name, email, phone, message, type_probleem, mode, straat, postcode, plaatsnaam } = await request.json();

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
        straat: straat || null,
        plaatsnaam: plaatsnaam || null,
        postcode: postcode || null,
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

    // Track new website lead in PostHog (server-side)
    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: lead.id,
      event: 'website_lead_received',
      properties: {
        lead_id: lead.id,
        source: 'website',
        mode: mode || 'booking',
        type_probleem: lead.type_probleem || null,
      },
    });
    await posthog.shutdown();

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://moonenvochtwering.nl';

    // Send admin notification email
    const adminEmail = adminNotificationEmail({ lead });
    const adminEmailPromise = sendEmail({
      to: 'info@moonenvochtwering.nl',
      subject: adminEmail.subject,
      html: adminEmail.html,
      text: adminEmail.text,
    });

    let customerEmailPromise;
    let customerEmailType;

    if (mode === 'contact_only') {
      // Contact-only: send simple acknowledgment (no booking link)
      const receivedEmail = contactReceivedEmail({ name });
      customerEmailPromise = sendEmail({
        to: email,
        subject: receivedEmail.subject,
        html: receivedEmail.html,
        text: receivedEmail.text,
      });
      customerEmailType = 'contact_received';
    } else {
      // Default: send planning CTA email with booking link
      const { data: templateSetting } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'email_template_plan_inspection')
        .single();
      const overrides = templateSetting?.value || {};

      const planEmail = planInspectionEmail({
        name,
        siteUrl,
        token: availability_token,
        overrides,
      });
      customerEmailPromise = sendEmail({
        to: email,
        subject: planEmail.subject,
        html: planEmail.html,
        text: planEmail.text,
      });
      customerEmailType = 'plan_inspection';
    }

    const emailResults = await Promise.allSettled([adminEmailPromise, customerEmailPromise]);
    const [adminResult, customerResult] = emailResults;

    // If the customer email was sent, update status and log
    if (customerResult.status === 'fulfilled') {
      // Only move to uitgenodigd when sending booking link (not contact-only)
      if (mode !== 'contact_only') {
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
        }
      }

      await logLeadEvent({
        leadId: lead.id,
        eventType: 'email_sent',
        actor: 'system',
        metadata: {
          type: customerEmailType,
          to_email: email,
        },
      });

      // Log to email_log
      await supabase.from('email_log').insert({
        lead_id: lead.id,
        type: customerEmailType,
        to_email: email,
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
          customer_email_sent: customerResult.status === 'fulfilled',
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
