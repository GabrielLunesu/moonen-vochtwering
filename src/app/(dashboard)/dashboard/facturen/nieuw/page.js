'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import { Textarea } from '@/app/components/ui/textarea';
import { Skeleton } from '@/app/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Label } from '@/app/components/ui/label';
import { toast } from 'sonner';
import { Trash2, Plus, Eye, Send, ArrowLeft, Users, UserPlus } from 'lucide-react';
import LeadSelector from '@/app/components/dashboard/quote-builder/LeadSelector';
import { useInvoiceState } from '@/app/components/dashboard/invoice-builder/useInvoiceState';

function formatCurrency(value) {
  return `\u20AC${(Math.round(Number(value) * 100) / 100).toLocaleString('nl-NL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function InvoiceBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quoteParam = searchParams.get('quote');

  const [showCrmDialog, setShowCrmDialog] = useState(!quoteParam);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const state = useInvoiceState();
  const {
    lineItems, customer, discount, notes, betaling, dueDate, issueDate,
    guaranteePerLine, globalGuaranteeYears,
    subtotalIncl, discountAmount, afterDiscount, exclBtw, btwAmount, btwPercentage,
    addLine, updateLine, removeLine, setCustomer, setDiscount,
    setNotes, setBetaling, setGuaranteePerLine, setGlobalGuaranteeYears, setDueDate, setIssueDate,
    loadFromQuote, buildPayload,
  } = state;

  // Pre-fill from quote if ?quote= param
  useEffect(() => {
    if (!quoteParam) return;
    fetch(`/api/quotes/${quoteParam}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((quote) => {
        loadFromQuote(quote);
      })
      .catch(() => toast.error('Kon offerte niet laden'));
  }, [quoteParam, loadFromQuote]);

  const handleLeadSelect = useCallback((leadData) => {
    setCustomer({
      lead_id: leadData.id || leadData.lead_id,
      name: leadData.name || '',
      email: leadData.email || '',
      phone: leadData.phone || '',
      straat: leadData.straat || '',
      postcode: leadData.postcode || '',
      plaatsnaam: leadData.plaatsnaam || '',
    });
    setShowCrmDialog(false);
  }, [setCustomer]);

  const handleSave = async () => {
    if (!customer.name) {
      toast.error('Klantnaam is verplicht');
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Opslaan mislukt');
      }
      const invoice = await res.json();
      toast.success('Factuur opgeslagen');
      router.push(`/dashboard/facturen/${invoice.id}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndSend = async () => {
    if (!customer.name) {
      toast.error('Klantnaam is verplicht');
      return;
    }
    if (!customer.email) {
      toast.error('E-mailadres is verplicht voor verzenden');
      return;
    }
    if (lineItems.length === 0) {
      toast.error('Voeg minimaal één regel toe');
      return;
    }
    setSending(true);
    try {
      const payload = buildPayload();
      const createRes = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!createRes.ok) {
        const data = await createRes.json();
        throw new Error(data.error || 'Opslaan mislukt');
      }
      const invoice = await createRes.json();

      const sendRes = await fetch(`/api/invoices/${invoice.id}/send`, { method: 'POST' });
      if (!sendRes.ok) {
        const data = await sendRes.json();
        throw new Error(data.error || 'Verzenden mislukt');
      }
      toast.success('Factuur verzonden');
      router.push('/dashboard/facturen');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  const handlePreview = async () => {
    if (lineItems.length === 0) {
      toast.error('Voeg minimaal één regel toe voor een voorbeeld');
      return;
    }
    setPreviewing(true);
    try {
      const payload = buildPayload();
      const res = await fetch('/api/pdf/invoice/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice: payload }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch {
      toast.error('Kon PDF voorbeeld niet genereren');
    } finally {
      setPreviewing(false);
    }
  };

  return (
    <div>
      {/* CRM Check Dialog */}
      <Dialog open={showCrmDialog} onOpenChange={setShowCrmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nieuwe factuur</DialogTitle>
            <DialogDescription>
              Is deze klant al in het CRM?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Zoek een bestaande klant:</p>
              <LeadSelector onSelect={handleLeadSelect} />
            </div>
            <Separator />
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => setShowCrmDialog(false)}
            >
              <UserPlus className="h-4 w-4" />
              Nee, handmatig invullen
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/facturen')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Nieuwe factuur</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Maak een factuur aan en verstuur naar de klant
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePreview} disabled={previewing}>
              <Eye className="h-4 w-4 mr-1" />
              {previewing ? 'Laden...' : 'PDF voorbeeld'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? 'Opslaan...' : 'Opslaan'}
            </Button>
            <Button
              size="sm"
              style={{ backgroundColor: '#355b23' }}
              onClick={handleSaveAndSend}
              disabled={sending}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {sending ? 'Verzenden...' : 'Opslaan & versturen'}
            </Button>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        {/* Customer */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Klantgegevens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!quoteParam && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 mb-2"
                onClick={() => setShowCrmDialog(true)}
              >
                <Users className="h-4 w-4" />
                Koppel aan CRM
              </Button>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Naam *"
                value={customer.name}
                onChange={(e) => setCustomer({ name: e.target.value })}
                className="text-sm"
              />
              <Input
                placeholder="E-mail"
                value={customer.email}
                onChange={(e) => setCustomer({ email: e.target.value })}
                className="text-sm"
              />
              <Input
                placeholder="Telefoon"
                value={customer.phone}
                onChange={(e) => setCustomer({ phone: e.target.value })}
                className="text-sm"
              />
              <Input
                placeholder="Plaatsnaam"
                value={customer.plaatsnaam}
                onChange={(e) => setCustomer({ plaatsnaam: e.target.value })}
                className="text-sm"
              />
              <Input
                placeholder="Straat + nr"
                value={customer.straat}
                onChange={(e) => setCustomer({ straat: e.target.value })}
                className="text-sm"
              />
              <Input
                placeholder="Postcode"
                value={customer.postcode}
                onChange={(e) => setCustomer({ postcode: e.target.value })}
                className="text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Invoice Details */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Factuurgegevens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Factuurdatum</label>
                <Input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Vervaldatum</label>
                <Input
                  type="date"
                  value={dueDate || ''}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Betalingstermijn</label>
              <Input
                value={betaling}
                onChange={(e) => setBetaling(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className={guaranteePerLine ? '' : 'grid grid-cols-2 gap-2'}>
              {!guaranteePerLine && (
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Garantie</label>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min="0"
                      value={globalGuaranteeYears}
                      onChange={(e) => setGlobalGuaranteeYears(e.target.value !== '' ? Number(e.target.value) : 5)}
                      className="text-sm"
                    />
                    <span className="text-xs text-muted-foreground shrink-0">jaar</span>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2 rounded-md border px-3 py-2">
                <Checkbox
                  id="invoice-guarantee-per-line"
                  checked={Boolean(guaranteePerLine)}
                  onCheckedChange={(checked) => setGuaranteePerLine(checked === true)}
                  className="mt-0.5"
                />
                <div className="space-y-0.5">
                  <Label htmlFor="invoice-guarantee-per-line" className="text-sm">
                    Garantie per regel
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Voor verschillende garantietermijnen.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Line items */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Factuurregels</CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-xs"
                onClick={() => addLine({ description: '', quantity: 1, unit: 'stuk', unit_price: 0 })}
              >
                <Plus className="h-3 w-3" />
                Regel toevoegen
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {lineItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nog geen regels. Voeg een regel toe.
              </p>
            ) : (
              <div className="space-y-2">
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
                  <div className="col-span-5">Omschrijving</div>
                  <div className="col-span-2">Aantal</div>
                  <div className="col-span-1">Eenheid</div>
                  <div className="col-span-2">Prijs (incl.)</div>
                  <div className="col-span-1 text-right">Bedrag</div>
                  <div className="col-span-1" />
                </div>
                {lineItems.map((item, index) => (
                  <div key={item.id} className="space-y-1">
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <Input
                        className="col-span-5 text-sm"
                        placeholder="Omschrijving"
                        value={item.description}
                        onChange={(e) => updateLine(index, { description: e.target.value })}
                      />
                      <Input
                        className="col-span-2 text-sm"
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateLine(index, { quantity: e.target.value })}
                      />
                      <Input
                        className="col-span-1 text-sm"
                        placeholder="stuk"
                        value={item.unit}
                        onChange={(e) => updateLine(index, { unit: e.target.value })}
                      />
                      <Input
                        className="col-span-2 text-sm"
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateLine(index, { unit_price: e.target.value })}
                      />
                      <span className="col-span-1 text-sm text-right font-medium">
                        {formatCurrency(item.quantity * item.unit_price)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="col-span-1 h-8 w-8 text-red-500"
                        onClick={() => removeLine(index)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    {guaranteePerLine && (
                      <div className="flex items-center gap-2 pl-1">
                        <span className="text-xs text-muted-foreground">Garantie</span>
                        <Input
                          type="number"
                          min="0"
                          value={item.garantie_jaren ?? globalGuaranteeYears}
                          onChange={(e) => updateLine(index, {
                            garantie_jaren: e.target.value !== '' ? Number(e.target.value) : null,
                          })}
                          className="h-8 w-20 text-sm"
                        />
                        <span className="text-xs text-muted-foreground">jaar</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Discount + Totals */}
        <Card>
          <CardContent className="pt-4 space-y-3">
            {/* Discount */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground w-20">Korting</span>
              <Select
                value={discount.type}
                onValueChange={(val) => setDiscount({ type: val, value: discount.value })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Vast bedrag</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                min="0"
                step="0.01"
                className="w-24 text-sm"
                value={discount.value || ''}
                onChange={(e) => setDiscount({ type: discount.type, value: e.target.value })}
                placeholder="0"
              />
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotaal (incl. BTW)</span>
                <span>{formatCurrency(subtotalIncl)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>
                    Korting{discount.type === 'percentage' ? ` (${discount.value}%)` : ''}
                  </span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Excl. BTW</span>
                <span>{formatCurrency(exclBtw)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">BTW ({btwPercentage}%)</span>
                <span>{formatCurrency(btwAmount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Totaal incl. BTW</span>
                <span>{formatCurrency(afterDiscount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Notities</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Optionele notities op de factuur..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="text-sm"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function NieuweFactuurPage() {
  return (
    <Suspense fallback={
      <div className="p-6 space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    }>
      <InvoiceBuilderContent />
    </Suspense>
  );
}
