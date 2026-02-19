'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Skeleton } from '@/app/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Search, FileText, Copy, Trash2 } from 'lucide-react';

const STATUS_LABELS = {
  concept: 'Concept',
  verzonden: 'Verzonden',
  akkoord: 'Akkoord',
  afgewezen: 'Afgewezen',
  verlopen: 'Verlopen',
};

const STATUS_COLORS = {
  concept: 'bg-slate-100 text-slate-700',
  verzonden: 'bg-orange-100 text-orange-800',
  akkoord: 'bg-green-100 text-green-800',
  afgewezen: 'bg-red-100 text-red-800',
  verlopen: 'bg-gray-100 text-gray-500',
};

function formatCurrency(value) {
  const num = Number(value) || 0;
  return `\u20AC${num.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function QuoteList({ leadId = null }) {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('alle');

  const loadQuotes = () => {
    const url = leadId ? `/api/quotes?lead=${leadId}` : '/api/quotes';
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setQuotes)
      .catch(() => toast.error('Kon offertes niet laden'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadQuotes();
  }, [leadId]);

  const filtered = useMemo(() => {
    let result = quotes;
    if (statusFilter !== 'alle') {
      result = result.filter((q) => q.status === statusFilter);
    }
    if (search.length >= 2) {
      const q = search.toLowerCase();
      result = result.filter(
        (quote) =>
          quote.customer_name?.toLowerCase().includes(q) ||
          quote.customer_plaatsnaam?.toLowerCase().includes(q) ||
          quote.label?.toLowerCase().includes(q) ||
          quote.quote_number?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [quotes, statusFilter, search]);

  const handleDuplicate = async (quoteId) => {
    try {
      const res = await fetch(`/api/quotes/${quoteId}`);
      if (!res.ok) throw new Error();
      const original = await res.json();

      // Strip identity fields
      delete original.id;
      delete original.created_at;
      delete original.updated_at;
      delete original.quote_number;
      delete original.quote_token;
      delete original.sent_at;
      delete original.response;
      delete original.response_at;
      original.status = 'concept';
      original.label = original.label ? `${original.label} (kopie)` : 'Kopie';

      const createRes = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(original),
      });
      if (!createRes.ok) throw new Error();
      toast.success('Offerte gedupliceerd');
      loadQuotes();
    } catch {
      toast.error('Kon offerte niet dupliceren');
    }
  };

  const handleDelete = async (quoteId) => {
    if (!confirm('Weet u zeker dat u deze offerte wilt verwijderen?')) return;
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Offerte verwijderd');
      setQuotes((prev) => prev.filter((q) => q.id !== quoteId));
    } catch {
      toast.error('Kon offerte niet verwijderen');
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Zoek op naam, plaats, label of nummer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Status filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle statussen</SelectItem>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              {quotes.length === 0
                ? 'Nog geen offertes. Maak een nieuwe offerte aan.'
                : 'Geen offertes gevonden met deze filters.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((quote) => (
            <Link key={quote.id} href={`/dashboard/offerte/${quote.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{quote.customer_name}</span>
                        {quote.label && (
                          <span className="text-xs text-muted-foreground">{quote.label}</span>
                        )}
                        <Badge className={STATUS_COLORS[quote.status] || 'bg-slate-100'}>
                          {STATUS_LABELS[quote.status] || quote.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        {quote.quote_number && <span>{quote.quote_number}</span>}
                        {quote.customer_plaatsnaam && <span>{quote.customer_plaatsnaam}</span>}
                        <span>
                          {new Date(quote.created_at).toLocaleDateString('nl-NL', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold whitespace-nowrap">
                        {formatCurrency(quote.total_incl)}
                      </span>
                      <div className="flex gap-1" onClick={(e) => e.preventDefault()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.preventDefault();
                            handleDuplicate(quote.id);
                          }}
                          title="Dupliceer"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        {quote.status === 'concept' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                            onClick={(e) => {
                              e.preventDefault();
                              handleDelete(quote.id);
                            }}
                            title="Verwijder"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
