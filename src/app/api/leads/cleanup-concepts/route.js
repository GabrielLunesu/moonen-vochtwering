import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();

  // Find all leads named "Concept"
  const { data: conceptLeads, error: findError } = await admin
    .from('leads')
    .select('id, name, email, status, created_at')
    .eq('name', 'Concept');

  if (findError) {
    return NextResponse.json({ error: findError.message }, { status: 500 });
  }

  if (!conceptLeads?.length) {
    return NextResponse.json({ message: 'No concept leads found', deleted: 0 });
  }

  const leadIds = conceptLeads.map((l) => l.id);

  // Delete associated quotes first
  const { data: deletedQuotes, error: quotesError } = await admin
    .from('quotes')
    .delete()
    .in('lead_id', leadIds)
    .select('id');

  if (quotesError) {
    console.error('[DB_FAIL] Cleanup quotes:', quotesError);
  }

  // Delete associated events
  const { error: eventsError } = await admin
    .from('lead_events')
    .delete()
    .in('lead_id', leadIds);

  if (eventsError) {
    console.error('[DB_FAIL] Cleanup events:', eventsError);
  }

  // Delete associated email logs
  const { error: emailError } = await admin
    .from('email_log')
    .delete()
    .in('lead_id', leadIds);

  if (emailError) {
    console.error('[DB_FAIL] Cleanup email_log:', emailError);
  }

  // Delete the concept leads
  const { error: deleteError } = await admin
    .from('leads')
    .delete()
    .in('id', leadIds);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({
    message: `Deleted ${conceptLeads.length} concept leads`,
    deleted: conceptLeads.length,
    quotes_deleted: deletedQuotes?.length || 0,
    leads: conceptLeads,
  });
}
