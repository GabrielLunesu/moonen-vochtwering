'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import { Textarea } from '@/app/components/ui/textarea';
import { Skeleton } from '@/app/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Label } from '@/app/components/ui/label';
import { toast } from 'sonner';
import { Trash2, Plus, Eye, Send, ArrowLeft, CheckCircle } from 'lucide-react';
import { useInvoiceState } from '@/app/components/dashboard/invoice-builder/useInvoiceState';

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
  return `\u20AC${(Math.round(Number(value) * 100) / 100).toLocaleString('nl-NL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function FactuurDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  // Payment tracking
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const state = useInvoiceState();
  const {
    lineItems, customer, discount, notes, betaling, dueDate, issueDate,
    guaranteePerLine, globalGuaranteeYears,
    subtotalIncl, discountAmount, afterDiscount, exclBtw, btwAmount, btwPercentage,
    addLine, updateLine, removeLine, setCustomer, setDiscount,
    setNotes, setBetaling, setGuaranteePerLine, setGlobalGuaranteeYears, setDueDate, setIssueDate,
    loadInvoice, buildPayload,
  } = state;

  useEffect(() => {
    fetch(`/api/invoices/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setInvoice(data);
        loadInvoice(data);
        setPaidAmount(data.paid_amount || '');
        setPaymentNotes(data.payment_notes || '');
      })
      .catch(() => {
        toast.error('Factuur niet gevonden');
        router.push('/dashboard/facturen');
      })
      .finally(() => setLoading(false));
  }, [id, loadInvoice, router]);

  const handleSave = async () => {
    if (!customer.name) {
      toast.error('Klantnaam is verplicht');
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      delete payload.lead_id;
      delete payload.quote_id;
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setInvoice(updated);
      toast.success('Factuur opgeslagen');
    } catch {
      toast.error('Opslaan mislukt');
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    if (!customer.email) {
      toast.error('E-mailadres is verplicht voor verzenden');
      return;
    }
    if (lineItems.length === 0) {
      toast.error('Voeg minimaal één regel toe');
      return;
    }
    // Save first, then send
    setSending(true);
    try {
      const payload = buildPayload();
      delete payload.lead_id;
      delete payload.quote_id;
      await fetch(`/api/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const sendRes = await fetch(`/api/invoices/${id}/send`, { method: 'POST' });
      if (!sendRes.ok) {
        const data = await sendRes.json();
        throw new Error(data.error || 'Verzenden mislukt');
      }
      const updated = await sendRes.json();
      setInvoice(updated);
      toast.success('Factuur verzonden');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  const handlePreview = async () => {
    if (lineItems.length === 0) {
      toast.error('Voeg minimaal één regel toe');
      return;
    }
    setPreviewing(true);
    try {
      const payload = buildPayload();
      payload.invoice_number = invoice?.invoice_number || null;
      payload.issue_date = issueDate;
      payload.due_date = dueDate;
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
      toast.error('Kon PDF niet genereren');
    } finally {
      setPreviewing(false);
    }
  };

  const handleMarkPaid = async (fullPayment = true) => {
    try {
      const amount = fullPayment ? invoice.total_incl : Number(paidAmount);
      if (!fullPayment && (!amount || amount <= 0)) {
        toast.error('Voer een geldig bedrag in');
        return;
      }
      const status = fullPayment || amount >= Number(invoice.total_incl) ? 'betaald' : 'deels_betaald';
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          paid_amount: amount,
          paid_at: new Date().toISOString(),
          payment_notes: paymentNotes || null,
        }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setInvoice(updated);
      toast.success(status === 'betaald' ? 'Factuur volledig betaald' : 'Deelbetaling geregistreerd');
    } catch {
      toast.error('Kon betaling niet registreren');
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    );
  }

  const isEditable = invoice?.status === 'concept';

  return (
    <div>
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/facturen')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">
                  {invoice?.invoice_number || 'Factuur'}
                </h1>
                <Badge className={STATUS_COLORS[invoice?.status] || 'bg-slate-100'}>
                  {STATUS_LABELS[invoice?.status] || invoice?.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {invoice?.customer_name}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePreview} disabled={previewing}>
              <Eye className="h-4 w-4 mr-1" />
              PDF
            </Button>
            {isEditable && (
              <>
                <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? 'Opslaan...' : 'Opslaan'}
                </Button>
                <Button
                  size="sm"
                  style={{ backgroundColor: '#355b23' }}
                  onClick={handleSend}
                  disabled={sending}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  {sending ? 'Verzenden...' : 'Verstuur'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto space-y-4">
        {/* Payment Tracking (for sent invoices) */}
        {invoice && invoice.status !== 'concept' && (
          <Card className={invoice.status === 'betaald' ? 'border-green-300 bg-green-50' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Betaling</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {invoice.status === 'betaald' ? (
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">
                    Volledig betaald op{' '}
                    {invoice.paid_at
                      ? new Date(invoice.paid_at).toLocaleDateString('nl-NL', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : 'onbekende datum'}
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Totaalbedrag:</span>
                    <span className="font-bold">{formatCurrency(invoice.total_incl)}</span>
                    {invoice.paid_amount > 0 && (
                      <>
                        <span className="text-muted-foreground ml-2">Betaald:</span>
                        <span className="font-medium text-green-700">{formatCurrency(invoice.paid_amount)}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Betaald bedrag"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      className="w-40 text-sm"
                    />
                    <Input
                      placeholder="Notitie (optioneel)"
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      className="flex-1 text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkPaid(false)}
                    >
                      Deelbetaling
                    </Button>
                    <Button
                      size="sm"
                      style={{ backgroundColor: '#355b23' }}
                      onClick={() => handleMarkPaid(true)}
                      className="gap-1"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Volledig betaald
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Customer */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Klantgegevens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Naam *"
                value={customer.name}
                onChange={(e) => setCustomer({ name: e.target.value })}
                className="text-sm"
                disabled={!isEditable}
              />
              <Input
                placeholder="E-mail"
                value={customer.email}
                onChange={(e) => setCustomer({ email: e.target.value })}
                className="text-sm"
                disabled={!isEditable}
              />
              <Input
                placeholder="Telefoon"
                value={customer.phone}
                onChange={(e) => setCustomer({ phone: e.target.value })}
                className="text-sm"
                disabled={!isEditable}
              />
              <Input
                placeholder="Plaatsnaam"
                value={customer.plaatsnaam}
                onChange={(e) => setCustomer({ plaatsnaam: e.target.value })}
                className="text-sm"
                disabled={!isEditable}
              />
              <Input
                placeholder="Straat + nr"
                value={customer.straat}
                onChange={(e) => setCustomer({ straat: e.target.value })}
                className="text-sm"
                disabled={!isEditable}
              />
              <Input
                placeholder="Postcode"
                value={customer.postcode}
                onChange={(e) => setCustomer({ postcode: e.target.value })}
                className="text-sm"
                disabled={!isEditable}
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
                  disabled={!isEditable}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Vervaldatum</label>
                <Input
                  type="date"
                  value={dueDate || ''}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="text-sm"
                  disabled={!isEditable}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Betalingstermijn</label>
              <Input
                value={betaling}
                onChange={(e) => setBetaling(e.target.value)}
                className="text-sm"
                disabled={!isEditable}
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
                      disabled={!isEditable}
                    />
                    <span className="text-xs text-muted-foreground shrink-0">jaar</span>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2 rounded-md border px-3 py-2">
                <Checkbox
                  id="invoice-detail-guarantee-per-line"
                  checked={Boolean(guaranteePerLine)}
                  onCheckedChange={(checked) => setGuaranteePerLine(checked === true)}
                  className="mt-0.5"
                  disabled={!isEditable}
                />
                <div className="space-y-0.5">
                  <Label htmlFor="invoice-detail-guarantee-per-line" className="text-sm">
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
              {isEditable && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 text-xs"
                  onClick={() => addLine({ description: '', quantity: 1, unit: 'stuk', unit_price: 0 })}
                >
                  <Plus className="h-3 w-3" />
                  Regel toevoegen
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {lineItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Geen factuurregels.
              </p>
            ) : (
              <div className="space-y-2">
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
                        disabled={!isEditable}
                      />
                      <Input
                        className="col-span-2 text-sm"
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateLine(index, { quantity: e.target.value })}
                        disabled={!isEditable}
                      />
                      <Input
                        className="col-span-1 text-sm"
                        value={item.unit}
                        onChange={(e) => updateLine(index, { unit: e.target.value })}
                        disabled={!isEditable}
                      />
                      <Input
                        className="col-span-2 text-sm"
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateLine(index, { unit_price: e.target.value })}
                        disabled={!isEditable}
                      />
                      <span className="col-span-1 text-sm text-right font-medium">
                        {formatCurrency(item.quantity * item.unit_price)}
                      </span>
                      {isEditable ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="col-span-1 h-8 w-8 text-red-500"
                          onClick={() => removeLine(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <div className="col-span-1" />
                      )}
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
                          disabled={!isEditable}
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
            {isEditable && (
              <>
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
              </>
            )}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotaal (incl. BTW)</span>
                <span>{formatCurrency(subtotalIncl)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Korting{discount.type === 'percentage' ? ` (${discount.value}%)` : ''}</span>
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
              placeholder="Optionele notities..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="text-sm"
              disabled={!isEditable}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
