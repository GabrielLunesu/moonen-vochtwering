import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/resend';
import { notifyOpsAlert } from '@/lib/ops/alerts';
import { logLeadEvent } from '@/lib/utils/events';
import { syncLeadToGoogleCalendar } from '@/lib/google/calendar';

export async function POST(request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is verplicht' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Find lead by token
    const { data: lead, error } = await supabase
      .from('leads')
      .select('*')
      .eq('availability_token', token)
      .single();

    if (error || !lead) {
      return NextResponse.json({ error: 'Ongeldige link' }, { status: 404 });
    }

    if (!lead.inspection_date || !lead.inspection_time) {
      return NextResponse.json({ error: 'Geen actieve afspraak gevonden' }, { status: 400 });
    }

    const cancelledDate = lead.inspection_date;
    const cancelledTime = lead.inspection_time;

    // Release slot
    if (lead.availability_slot_id) {
      await supabase.rpc('release_availability_slot', { p_slot_id: lead.availability_slot_id });

      await logLeadEvent({
        leadId: lead.id,
        eventType: 'slot_released',
        actor: 'customer',
        metadata: { slot_id: lead.availability_slot_id, date: cancelledDate, time: cancelledTime },
      });
    }

    // Update lead: clear appointment, set status back to uitgenodigd
    const leadUpdates = {
      inspection_date: null,
      inspection_time: null,
      availability_slot_id: null,
      status: 'uitgenodigd',
    };

    if (Object.prototype.hasOwnProperty.call(lead, 'stage_changed_at')) {
      leadUpdates.stage_changed_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('leads')
      .update(leadUpdates)
      .eq('id', lead.id);

    if (updateError) {
      await notifyOpsAlert({
        source: '/api/customer/cancel',
        message: 'Failed to update lead after cancellation',
        error: updateError,
        context: { lead_id: lead.id },
      });
      return NextResponse.json({ error: 'Kon afspraak niet annuleren' }, { status: 500 });
    }

    // Delete from Google Calendar (best-effort)
    syncLeadToGoogleCalendar(lead, 'delete');

    await logLeadEvent({
      leadId: lead.id,
      eventType: 'appointment_cancelled',
      oldValue: `${cancelledDate} ${cancelledTime}`,
      actor: 'customer',
    });

    await logLeadEvent({
      leadId: lead.id,
      eventType: 'status_change',
      oldValue: lead.status,
      newValue: 'uitgenodigd',
      actor: 'customer',
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://moonenvochtwering.nl';

    const formattedDate = new Date(cancelledDate).toLocaleDateString('nl-NL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    // Send cancellation confirmation to customer
    await sendEmail({
      to: lead.email,
      subject: 'Afspraak geannuleerd | Moonen Vochtwering',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: #355b23; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Moonen Vochtwering</h1>
          </div>
          <div style="padding: 32px 24px;">
            <p style="font-size: 16px; color: #333;">Beste ${lead.name},</p>
            <p style="font-size: 16px; color: #333;">Uw inspectie op <strong>${formattedDate}</strong> om <strong>${cancelledTime}</strong> is geannuleerd.</p>
            <p style="font-size: 16px; color: #333;">Wilt u toch een inspectie inplannen? Klik dan op de knop hieronder:</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${siteUrl}/bevestig?token=${token}"
                 style="background: #355b23; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: 600; display: inline-block;">
                Opnieuw inplannen
              </a>
            </div>
            <p style="font-size: 14px; color: #666;">Of bel ons op <a href="tel:+31618162515" style="color: #355b23;">06 18 16 25 15</a>.</p>
          </div>
          <div style="background: #f5f5f5; padding: 20px 24px; font-size: 13px; color: #666;">
            <p style="margin: 0;">Moonen Vochtwering | Grasbroekerweg 141, 6412BD Heerlen | 06 18 16 25 15</p>
          </div>
        </div>
      `,
      text: `Beste ${lead.name},\n\nUw inspectie op ${formattedDate} om ${cancelledTime} is geannuleerd.\n\nWilt u toch een inspectie inplannen? Ga naar:\n${siteUrl}/bevestig?token=${token}\n\nOf bel ons op 06 18 16 25 15.\n\nMet vriendelijke groet,\nMoonen Vochtwering`,
    });

    await logLeadEvent({
      leadId: lead.id,
      eventType: 'email_sent',
      actor: 'system',
      metadata: { type: 'cancellation', to_email: lead.email },
    });

    // Always notify admin
    await sendEmail({
      to: 'info@moonenvochtwering.nl',
      subject: `Inspectie geannuleerd: ${lead.name} - ${formattedDate} ${cancelledTime}`,
      html: `<p><strong>${lead.name}</strong> heeft de inspectie geannuleerd.</p>
             <p>Datum: ${formattedDate} om ${cancelledTime}</p>
             <p>Telefoon: ${lead.phone}</p>
             <p>E-mail: ${lead.email}</p>`,
      text: `${lead.name} heeft de inspectie geannuleerd.\nDatum: ${formattedDate} om ${cancelledTime}\nTel: ${lead.phone}\nEmail: ${lead.email}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API_ERROR] /api/customer/cancel:', error);
    await notifyOpsAlert({
      source: '/api/customer/cancel',
      message: 'Customer cancellation flow failed',
      error,
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
