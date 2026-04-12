'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { Skeleton } from '@/app/components/ui/skeleton';
import { Plus } from 'lucide-react';
import InvoiceList from '@/app/components/dashboard/InvoiceList';

function FacturenPageContent() {
  return (
    <div>
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Facturen</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Overzicht van alle facturen
            </p>
          </div>
          <Link href="/dashboard/facturen/nieuw">
            <Button size="sm" className="gap-2" style={{ backgroundColor: '#355b23' }}>
              <Plus className="h-4 w-4" />
              Nieuwe factuur
            </Button>
          </Link>
        </div>
      </div>
      <div className="p-6">
        <InvoiceList />
      </div>
    </div>
  );
}

export default function FacturenPage() {
  return (
    <Suspense fallback={
      <div className="p-6 space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
    }>
      <FacturenPageContent />
    </Suspense>
  );
}
