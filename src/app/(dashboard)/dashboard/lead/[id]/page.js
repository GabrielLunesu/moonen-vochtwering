import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import LeadDetailPanel from '@/app/components/dashboard/LeadDetailPanel';
import { Button } from '@/app/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('leads').select('name').eq('id', id).single();
  return {
    title: data ? `${data.name} | Moonen CRM` : 'Lead | Moonen CRM',
  };
}

export default async function LeadDetailPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: lead, error }, { data: events }, { data: emailLog }] = await Promise.all([
    supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single(),
    supabase
      .from('lead_events')
      .select('*')
      .eq('lead_id', id)
      .order('created_at', { ascending: true }),
    supabase
      .from('email_log')
      .select('*')
      .eq('lead_id', id)
      .order('created_at', { ascending: false }),
  ]);

  if (error || !lead) {
    notFound();
  }

  return (
    <div>
      <div className="border-b px-6 py-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2 mb-2">
            <ArrowLeft className="h-4 w-4" />
            Terug naar pipeline
          </Button>
        </Link>
      </div>
      <div className="p-6 max-w-4xl">
        <LeadDetailPanel
          lead={lead}
          initialEvents={events || []}
          initialEmailLog={emailLog || []}
        />
      </div>
    </div>
  );
}
