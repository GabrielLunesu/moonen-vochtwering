import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/resend';
import { adminNotificationEmail } from '@/lib/email/templates/admin-notification';
import { generateToken } from '@/lib/utils/tokens';
import { notifyOpsAlert } from '@/lib/ops/alerts';
import { logLeadEvent } from '@/lib/utils/events';

export async function POST(request) {
  try {
    const { name, email, phone, plaatsnaam, message, type_probleem } = await request.json();

    // Validate required fields
    if (!name || !email || !message || !phone || !plaatsnaam) {
      return NextResponse.json(
        { error: 'Naam, e-mail, telefoonnummer, plaatsnaam en bericht zijn verplicht' },
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
        plaatsnaam,
        message,
        type_probleem: type_probleem || null,
        availability_token,
        quote_token,
        source: 'website',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Supabase insert error:', dbError);
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

    // Send admin notification email
    const adminEmail = adminNotificationEmail({ lead });
    const adminEmailPromise = sendEmail({
      to: 'info@moonenvochtwering.nl',
      subject: adminEmail.subject,
      html: adminEmail.html,
      text: adminEmail.text,
    });

    // Send auto-reply to customer
    const customerEmailPromise = sendEmail({
      to: email,
      subject: 'Bedankt voor uw bericht - Moonen Vochtwering',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #355b23; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Moonen Vochtwering</h1>
          </div>
          <div style="padding: 32px 24px;">
            <p style="font-size: 16px; color: #333;">Beste ${name},</p>
            <p style="font-size: 16px; color: #333;">
              Bedankt voor uw bericht. We hebben uw aanvraag ontvangen en zullen zo spoedig mogelijk contact met u opnemen.
            </p>
            <div style="background: #f5f5f5; padding: 16px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0;"><strong>Samenvatting aanvraag:</strong></p>
              <p style="margin: 4px 0;">Naam: ${name}</p>
              <p style="margin: 4px 0;">E-mail: ${email}</p>
              <p style="margin: 4px 0;">Telefoon: ${phone}</p>
              <p style="margin: 4px 0;">Plaatsnaam: ${plaatsnaam}</p>
            </div>
          </div>
          <div style="background: #f5f5f5; padding: 20px 24px; font-size: 13px; color: #666;">
            <p style="margin: 0;">Moonen Vochtwering | Grasbroekerweg 141, 6412BD Heerlen | <a href="tel:+31618162515" style="color: #355b23;">06 18 16 25 15</a></p>
          </div>
        </div>
      `,
      text: `Beste ${name},

Bedankt voor uw bericht. We hebben uw aanvraag ontvangen en zullen zo spoedig mogelijk contact met u opnemen.

Samenvatting aanvraag:
Naam: ${name}
E-mail: ${email}
Telefoon: ${phone}
Plaatsnaam: ${plaatsnaam}

Met vriendelijke groet,
Moonen Vochtwering
Grasbroekerweg 141, 6412BD Heerlen
Tel: 06 18 16 25 15`,
    });

    const emailResults = await Promise.allSettled([adminEmailPromise, customerEmailPromise]);
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
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing contact form:', error);
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
