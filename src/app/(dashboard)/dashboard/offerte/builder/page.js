'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import QuoteBuilderView from '@/app/components/dashboard/quote-builder/QuoteBuilderView';

function BuilderContent() {
  const searchParams = useSearchParams();
  const leadId = searchParams.get('lead') || null;
  const quoteId = searchParams.get('quote') || null;
  const [lead, setLead] = useState(null);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(Boolean(leadId || quoteId));

  useEffect(() => {
    if (quoteId) {
      fetch(`/api/quotes/${quoteId}`)
        .then((res) => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then((data) => setQuote(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else if (leadId) {
      fetch(`/api/leads/${leadId}`)
        .then((res) => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then((data) => setLead(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [leadId, quoteId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Laden...</p>
        </div>
      </div>
    );
  }

  return <QuoteBuilderView lead={lead} quote={quote} />;
}

export default function QuoteBuilderPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="h-8 w-8 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
      </div>
    }>
      <BuilderContent />
    </Suspense>
  );
}
