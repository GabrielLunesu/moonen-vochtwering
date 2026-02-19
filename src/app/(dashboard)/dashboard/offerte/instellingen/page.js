'use client';

import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import PricelistEditor from '@/app/components/dashboard/PricelistEditor';

export default function OfferteInstellingenPage() {
  return (
    <div>
      <div className="border-b px-6 py-4">
        <Link href="/dashboard/offerte">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2 mb-2">
            <ArrowLeft className="h-4 w-4" />
            Terug naar offertes
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Prijslijst instellingen</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pas hier de standaardprijzen aan. Wijzigingen gelden voor nieuwe offertes.
        </p>
      </div>
      <div className="p-6 max-w-4xl mx-auto">
        <PricelistEditor />
      </div>
    </div>
  );
}
