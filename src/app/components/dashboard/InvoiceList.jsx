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
import { Search, FileText, Trash2, Send, CheckCircle } from 'lucide-react';

const STATUS_LABELS = {
  concept: 'Concept',
  verzonden: 'Verzonden',
  betaald: 'Betaald',
  deels_betaald: 'Deels betaald',
  vervallen: 'Vervallen',
};

const STATUS_COLORS = {
  concept: 'bg-slate-100 text-slate-700',
  verzonden: 'bg-blue-100 text-blue-800',
  betaald: 'bg-green-100 text-green-800',
  deels_betaald: 'bg-orange-100 text-orange-800',
  vervallen: 'bg-red-100 text-red-800',
};

function formatCurrency(value) {
  const num = Number(value) || 0;
  return `\u20AC${num.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function isOverdue(invoice) {
  if (!invoice.due_date || invoice.status === 'betaald') return false;
  return new Date(invoice.due_date) < new Date();
}

export default function InvoiceList({ leadId = null }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('alle');

  const loadInvoices = () => {
    const url = leadId ? `/api/invoices?lead=${leadId}` : '/api/invoices';
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setInvoices)
      .catch(() => toast.error('Kon facturen niet laden'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInvoices();
  }, [leadId]);

  const filtered = useMemo(() => {
    let result = invoices;
    if (statusFilter !== 'alle') {
      result = result.filter((inv) => inv.status === statusFilter);
    }
    if (search.length >= 2) {
      const q = search.toLowerCase();
      result = result.filter(
        (inv) =>
          inv.customer_name?.toLowerCase().includes(q) ||
          inv.customer_plaatsnaam?.toLowerCase().includes(q) ||
          inv.invoice_number?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [invoices, statusFilter, search]);

  const handleSend = async (invoiceId, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/send`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Verzenden mislukt');
      }
      toast.success('Factuur verzonden');
      loadInvoices();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleMarkPaid = async (invoiceId, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'betaald',
          paid_at: new Date().toISOString(),
          paid_amount: invoices.find((i) => i.id === invoiceId)?.total_incl || 0,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('Factuur gemarkeerd als betaald');
      loadInvoices();
    } catch {
      toast.error('Kon status niet bijwerken');
    }
  };

  const handleDelete = async (invoiceId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Weet u zeker dat u deze factuur wilt verwijderen?')) return;
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Factuur verwijderd');
      setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceId));
    } catch {
      toast.error('Kon factuur niet verwijderen');
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
            placeholder="Zoek op naam, plaats of factuurnummer..."
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
              {invoices.length === 0
                ? 'Nog geen facturen. Maak een nieuwe factuur aan.'
                : 'Geen facturen gevonden met deze filters.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((invoice) => (
            <Link key={invoice.id} href={`/dashboard/facturen/${invoice.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{invoice.customer_name}</span>
                        <Badge className={STATUS_COLORS[invoice.status] || 'bg-slate-100'}>
                          {STATUS_LABELS[invoice.status] || invoice.status}
                        </Badge>
                        {isOverdue(invoice) && (
                          <Badge className="bg-red-500 text-white">Verlopen</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        {invoice.invoice_number && <span>{invoice.invoice_number}</span>}
                        {invoice.customer_plaatsnaam && <span>{invoice.customer_plaatsnaam}</span>}
                        <span>
                          {new Date(invoice.created_at).toLocaleDateString('nl-NL', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        {invoice.due_date && (
                          <span className={isOverdue(invoice) ? 'text-red-600 font-medium' : ''}>
                            Vervalt: {new Date(invoice.due_date).toLocaleDateString('nl-NL', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold whitespace-nowrap">
                        {formatCurrency(invoice.total_incl)}
                      </span>
                      <div className="flex gap-1" onClick={(e) => e.preventDefault()}>
                        {invoice.status === 'concept' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => handleSend(invoice.id, e)}
                            title="Verstuur"
                          >
                            <Send className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {(invoice.status === 'verzonden' || invoice.status === 'deels_betaald') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600 hover:text-green-800"
                            onClick={(e) => handleMarkPaid(invoice.id, e)}
                            title="Markeer als betaald"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {invoice.status === 'concept' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                            onClick={(e) => handleDelete(invoice.id, e)}
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
