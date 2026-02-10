'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import InspectionForm from '@/app/components/dashboard/InspectionForm';
import { Skeleton } from '@/app/components/ui/skeleton';
import { Button } from '@/app/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function InspectiePage() {
  const { id } = useParams();
  const router = useRouter();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/leads/${id}`)
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setLead)
      .catch(() => toast.error('Kon lead niet laden'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Lead niet gevonden</p>
      </div>
    );
  }

  const hasExistingInspection = Boolean(lead.inspection_data_v2);
  const formMode = hasExistingInspection ? 'edit' : 'create';
  const backUrl = hasExistingInspection ? `/dashboard/lead/${lead.id}` : '/dashboard';

  return (
    <div>
      <div className="border-b px-6 py-4">
        <Link href={backUrl}>
          <Button variant="ghost" size="sm" className="gap-2 -ml-2 mb-2">
            <ArrowLeft className="h-4 w-4" />
            Terug
          </Button>
        </Link>
        <h1 className="text-xl font-bold">
          {hasExistingInspection ? 'Inspectie bewerken' : 'Inspectie'}
        </h1>
      </div>
      <div className="p-6 max-w-4xl mx-auto">
        <InspectionForm
          lead={lead}
          mode={formMode}
          onSave={() => router.push(backUrl)}
        />
      </div>
    </div>
  );
}
