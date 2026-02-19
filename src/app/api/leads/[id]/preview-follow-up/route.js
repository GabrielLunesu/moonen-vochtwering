import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { followUpEmail } from '@/lib/email/templates/follow-up';

export async function GET(request, { params }) {
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
      followUpCount: lead.follow_up_count || 0,
      responseUrl,
      overrides: followUpOverrides,
    });

    return NextResponse.json({
      subject: emailContent.subject,
      html: emailContent.html,
      to: lead.email,
      followUpCount: lead.follow_up_count || 0,
      maxFollowUps: 3,
    });
  } catch (error) {
    console.error('[API_ERROR] GET /api/leads/[id]/preview-follow-up:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
