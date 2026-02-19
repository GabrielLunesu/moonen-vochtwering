'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { Skeleton } from '@/app/components/ui/skeleton';
import { Plus, Settings } from 'lucide-react';
import QuoteList from '@/app/components/dashboard/QuoteList';

function OffertePageContent() {
  const searchParams = useSearchParams();
  const leadId = searchParams.get('lead') || null;

  return (
    <div>
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Offertes</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Overzicht van alle offertes
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/offerte/instellingen">
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="h-4 w-4" />
                Prijslijst
              </Button>
            </Link>
            <Link href={leadId ? `/dashboard/offerte/nieuw?lead=${leadId}` : '/dashboard/offerte/nieuw'}>
              <Button size="sm" className="gap-2" style={{ backgroundColor: '#355b23' }}>
                <Plus className="h-4 w-4" />
                Nieuwe offerte
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <div className="p-6">
        <QuoteList leadId={leadId} />
      </div>
    </div>
  );
}

export default function OffertePage() {
  return (
    <Suspense fallback={
      <div className="p-6 space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
    }>
      <OffertePageContent />
    </Suspense>
  );
}
