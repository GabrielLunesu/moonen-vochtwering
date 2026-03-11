import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/resend';
import { suggestTimeEmail } from '@/lib/email/templates/suggest-time';
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
        const { date, time } = await request.json();

        if (!date || !time) {
            return NextResponse.json({ error: 'date en time zijn verplicht' }, { status: 400 });
        }

        const admin = createAdminClient();

        const { data: lead, error: leadError } = await admin
            .from('leads')
            .select('*')
            .eq('id', id)
            .single();

        if (leadError || !lead) {
            return NextResponse.json({ error: 'Lead niet gevonden' }, { status: 404 });
        }

        if (!lead.email) {
            return NextResponse.json({ error: 'Lead heeft geen e-mailadres' }, { status: 400 });
        }

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://moonenvochtwering.nl';

        // We can allow users to customize this via settings later, for now we just use the default
        const emailContent = suggestTimeEmail({
            name: lead.name,
            date,
            time,
            siteUrl,
            token: lead.availability_token,
        });

        await sendEmail({
            to: lead.email,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
        });

        await admin.from('email_log').insert({
            lead_id: lead.id,
            type: 'suggest_time',
            to_email: lead.email,
            subject: emailContent.subject,
        });

        await logLeadEvent({
            leadId: lead.id,
            eventType: 'email_sent',
            actor: user.email || 'admin',
            metadata: { type: 'suggest_time', to_email: lead.email, date, time },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[API_ERROR] /api/leads/[id]/suggest-time:', error);
        await notifyOpsAlert({
            source: '/api/leads/[id]/suggest-time',
            message: 'Failed to send suggest time email',
            error,
        });
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
