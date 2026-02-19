'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import QuoteGenerator from '@/app/components/dashboard/QuoteGenerator';

function NieuweOfferteContent() {
  const searchParams = useSearchParams();
  const leadId = searchParams.get('lead') || null;

  return (
    <div>
      <div className="border-b px-6 py-4">
        <Link href="/dashboard/offerte">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2 mb-2">
            <ArrowLeft className="h-4 w-4" />
            Terug naar offertes
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Nieuwe offerte</h1>
      </div>
      <div className="p-6 max-w-4xl mx-auto">
        <QuoteGenerator leadId={leadId} />
      </div>
    </div>
  );
}

export default function NieuweOffertePage() {
  return (
    <Suspense fallback={
      <div className="p-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
      </div>
    }>
      <NieuweOfferteContent />
    </Suspense>
  );
}
