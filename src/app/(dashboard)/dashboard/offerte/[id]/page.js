'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/app/components/ui/button';
import { Skeleton } from '@/app/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import QuoteGenerator from '@/app/components/dashboard/QuoteGenerator';

export default function EditOffertePage() {
  const { id } = useParams();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/quotes/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setQuote)
      .catch(() => toast.error('Kon offerte niet laden'))
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

  if (!quote) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Offerte niet gevonden</p>
      </div>
    );
  }

  return (
    <div>
      <div className="border-b px-6 py-4">
        <Link href="/dashboard/offerte">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2 mb-2">
            <ArrowLeft className="h-4 w-4" />
            Terug naar offertes
          </Button>
        </Link>
        <h1 className="text-xl font-bold">
          Offerte bewerken
          {quote.label && <span className="text-muted-foreground font-normal ml-2">— {quote.label}</span>}
        </h1>
      </div>
      <div className="p-6 max-w-4xl mx-auto">
        <QuoteGenerator quote={quote} />
      </div>
    </div>
  );
}
