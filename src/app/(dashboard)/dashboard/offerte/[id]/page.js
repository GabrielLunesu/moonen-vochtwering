'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import { Skeleton } from '@/app/components/ui/skeleton';
import {
  ArrowLeft,
  Send,
  Eye,
  Trash2,
  Loader2,
  FileText,
  User,
  MapPin,
  Phone,
  Mail,
  Pencil,
} from 'lucide-react';

const STATUS_CONFIG = {
  concept: { label: 'Concept', className: 'bg-slate-100 text-slate-700' },
  verzonden: { label: 'Verzonden', className: 'bg-orange-100 text-orange-800' },
  akkoord: { label: 'Akkoord', className: 'bg-green-100 text-green-800' },
  afgewezen: { label: 'Afgewezen', className: 'bg-red-100 text-red-800' },
  verlopen: { label: 'Verlopen', className: 'bg-gray-100 text-gray-500' },
};

function formatCurrency(value) {
  const num = Number(value) || 0;
  return `€${num.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function QuoteDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

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

  const handleSend = async () => {
    if (!quote.customer_email) {
      toast.error('Geen e-mailadres beschikbaar');
      return;
    }
    if (!confirm('Offerte versturen naar ' + quote.customer_email + '?')) return;
    setSending(true);
    try {
      const res = await fetch(`/api/quotes/${id}/send`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Verzenden mislukt');
      }
      toast.success('Offerte verzonden!');
      // Refresh quote data
      const updated = await fetch(`/api/quotes/${id}`).then((r) => r.json());
      setQuote(updated);
    } catch (err) {
      toast.error(err?.message || 'Verzenden mislukt');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Weet u zeker dat u deze offerte wilt verwijderen?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/quotes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Offerte verwijderd');
      router.push('/dashboard/offerte');
    } catch {
      toast.error('Verwijderen mislukt');
      setDeleting(false);
    }
  };

  const handlePreview = async () => {
    setPreviewLoading(true);
    try {
      // Build a draftLead object from the quote data for the preview API
      const draftLead = {
        id: quote.lead_id || 'draft',
        name: quote.customer_name,
        email: quote.customer_email,
        phone: quote.customer_phone,
        straat: quote.customer_straat,
        postcode: quote.customer_postcode,
        plaatsnaam: quote.customer_plaatsnaam,
        oppervlakte_m2: quote.oppervlakte_m2,
        inspection_notes: quote.notes,
        quote_amount: (quote.total_incl || 0) / (1 + (quote.btw_percentage || 21) / 100),
        photos: quote.photos || [],
        inspection_data_v2: {
          diagnose: quote.diagnose || [],
          diagnose_details: quote.diagnose_details,
          oplossingen: quote.oplossingen || [],
          kelder_sub_areas: quote.kelder_sub_areas,
          oppervlakte_m2: quote.oppervlakte_m2,
          line_items: quote.line_items || [],
          subtotal: quote.subtotal_incl,
          discount_type: quote.discount_type,
          discount_value: quote.discount_value,
          discount_amount: quote.discount_amount,
          btw_percentage: quote.btw_percentage,
          btw_amount: quote.btw_amount,
          total_incl_btw: quote.total_incl,
          garantie_jaren: quote.garantie_jaren,
          doorlooptijd: quote.doorlooptijd,
          betaling: quote.betaling,
          geldigheid_dagen: quote.geldigheid_dagen,
          offerte_inleiding: quote.offerte_inleiding,
          notes: quote.notes,
        },
      };
      const res = await fetch('/api/pdf/quote/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftLead }),
      });
      if (!res.ok) throw new Error('PDF genereren mislukt');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      toast.error(err?.message || 'PDF preview mislukt');
    } finally {
      setPreviewLoading(false);
    }
  };

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
      <div className="p-6 text-center">
        <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">Offerte niet gevonden</p>
        <Link href="/dashboard/offerte">
          <Button variant="outline" size="sm" className="mt-4">Terug naar offertes</Button>
        </Link>
      </div>
    );
  }

  const status = STATUS_CONFIG[quote.status] || STATUS_CONFIG.concept;
  const lineItems = quote.line_items || [];
  const isSent = quote.status !== 'concept';

  return (
    <div>
      {/* Header */}
      <div className="border-b px-6 py-4">
        <Link href="/dashboard/offerte">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2 mb-2">
            <ArrowLeft className="h-4 w-4" />
            Terug naar offertes
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">
              {quote.quote_number || 'Concept offerte'}
            </h1>
            <Badge className={status.className}>{status.label}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/offerte/builder?quote=${id}`}>
              <Button variant="outline" size="sm">
                <Pencil className="h-4 w-4 mr-1" />
                Bewerken
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
              disabled={previewLoading || lineItems.length === 0}
            >
              {previewLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
              PDF
            </Button>
            {quote.status === 'concept' && (
              <>
                <Button
                  size="sm"
                  onClick={handleSend}
                  disabled={sending || !quote.customer_email}
                  style={{ backgroundColor: '#355b23' }}
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                  Verstuur
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-red-600 hover:text-red-700"
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
                  Verwijder
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Overview row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground mb-1">Totaal incl. BTW</p>
              <p className="text-lg font-bold">{formatCurrency(quote.total_incl)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground mb-1">Aangemaakt</p>
              <p className="text-sm font-medium">{formatDate(quote.created_at)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground mb-1">Verzonden</p>
              <p className="text-sm font-medium">{quote.sent_at ? formatDateTime(quote.sent_at) : '—'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground mb-1">Reactie</p>
              <p className="text-sm font-medium">
                {quote.response === 'akkoord' ? 'Akkoord' : quote.response === 'afgewezen' ? 'Afgewezen' : '—'}
              </p>
              {quote.response_at && (
                <p className="text-xs text-muted-foreground">{formatDateTime(quote.response_at)}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Customer info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Klantgegevens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{quote.customer_name}</span>
              </div>
              {quote.customer_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{quote.customer_email}</span>
                </div>
              )}
              {quote.customer_phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{quote.customer_phone}</span>
                </div>
              )}
              {(quote.customer_straat || quote.customer_plaatsnaam) && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>
                    {[quote.customer_straat, quote.customer_postcode, quote.customer_plaatsnaam].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quote details */}
        {(quote.oplossingen?.length > 0 || quote.diagnose?.length > 0 || quote.oppervlakte_m2 || quote.doorlooptijd) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Offerte details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {quote.oplossingen?.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Betreft</p>
                    <p className="font-medium">{quote.oplossingen.join(', ')}</p>
                  </div>
                )}
                {quote.diagnose?.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Diagnose</p>
                    <p className="font-medium">{quote.diagnose.join(', ')}</p>
                  </div>
                )}
                {quote.oppervlakte_m2 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Oppervlakte</p>
                    <p className="font-medium">{quote.oppervlakte_m2} m²</p>
                  </div>
                )}
                {quote.doorlooptijd && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Doorlooptijd</p>
                    <p className="font-medium">{quote.doorlooptijd}</p>
                  </div>
                )}
                {quote.garantie_jaren && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Garantie</p>
                    <p className="font-medium">{quote.garantie_jaren} jaar</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Line items */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">Offerteregels</CardTitle>
              <Badge variant="secondary">{lineItems.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {lineItems.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Geen regels</p>
            ) : (
              <div className="space-y-0">
                {lineItems.map((item, i) => {
                  const lineTotal = Number(item.total) || Number(item.quantity) * Number(item.unit_price) || 0;
                  return (
                    <div key={i} className="flex items-center justify-between py-2.5 border-b last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{item.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} {item.unit} × {formatCurrency(item.unit_price)}
                        </p>
                      </div>
                      <span className="text-sm font-medium shrink-0 ml-4">
                        {formatCurrency(lineTotal)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Totals */}
        {lineItems.length > 0 && (
          <Card>
            <CardContent className="pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotaal incl. BTW</span>
                <span className="font-medium">{formatCurrency(quote.subtotal_incl)}</span>
              </div>
              {quote.discount_amount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>
                    Korting
                    {quote.discount_type === 'percentage' ? ` (${quote.discount_value}%)` : ''}
                  </span>
                  <span>-{formatCurrency(quote.discount_amount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-sm">
                <span>Excl. BTW</span>
                <span>{formatCurrency((quote.total_incl || 0) - (quote.btw_amount || 0))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>BTW ({quote.btw_percentage || 21}%)</span>
                <span>{formatCurrency(quote.btw_amount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>Totaal incl. BTW</span>
                <span>{formatCurrency(quote.total_incl)}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {quote.notes && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Notities</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{quote.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
