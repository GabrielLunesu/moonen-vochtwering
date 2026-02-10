'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Textarea } from '@/app/components/ui/textarea';
import { Button } from '@/app/components/ui/button';
import { Separator } from '@/app/components/ui/separator';
import { Badge } from '@/app/components/ui/badge';
import { toast } from 'sonner';
import { Camera, Save, Send, Loader2, Trash2, Plus, ChevronLeft, ChevronRight, Eye, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';

const DIAGNOSE_OPTIONS = [
  'Opstijgend vocht',
  'Condensatie',
  'Lekkage (inwendig)',
  'Lekkage (extern)',
  'Schimmel door vocht',
  'Capillair vocht',
  'Vochtdoorslag gevel',
  'Combinatie',
];

const OPLOSSING_OPTIONS = [
  { value: 'Injectie (DPC)', templateKey: 'muurinjectie' },
  { value: 'Kelderafdichting (inwendig)', templateKey: 'kelderafdichting' },
  { value: 'Kelderafdichting (uitwendig)', templateKey: 'kelderafdichting' },
  { value: 'Vochtbestendige pleister', templateKey: null },
  { value: 'Gevelimpregnatie', templateKey: null },
  { value: 'Drainage', templateKey: null },
  { value: 'Ventilatie verbetering', templateKey: null },
  { value: 'Combinatie', templateKey: null },
];

const DEFAULT_LINE_ITEM_TEMPLATES = {
  kelderafdichting: [
    { description: 'Kelderwanden waterdicht maken', unit: 'm²', unit_price: 280 },
    { description: 'Vloer/wandovergangen afdichten', unit: 'stuk', unit_price: 650 },
    { description: 'Afwerking stucwerk', unit: 'm²', unit_price: 40 },
  ],
  muurinjectie: [
    { description: 'Muurinjectie tegen opstijgend vocht', unit: 'm¹', unit_price: 95 },
    { description: 'Boor- en injectiewerkzaamheden', unit: 'stuk', unit_price: 350 },
    { description: 'Nabehandeling en afwerking', unit: 'm²', unit_price: 35 },
  ],
};

const DEFAULT_QUOTE_DEFAULTS = {
  btw_percentage: 21,
  garantie_jaren: 5,
  doorlooptijd: '3 werkdagen',
  betaling: '40% bij opdracht, 60% na oplevering',
};

const STEPS = [
  { key: 1, label: 'Diagnose' },
  { key: 2, label: 'Oplossing' },
  { key: 3, label: 'Afmetingen & Foto\'s' },
  { key: 4, label: 'Offerte' },
];

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toMoney(value) {
  return Math.round(toNumber(value, 0) * 100) / 100;
}

function makeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `li-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function newLineItem(partial = {}) {
  return {
    id: partial.id || makeId(),
    description: partial.description || '',
    quantity: partial.quantity ?? 1,
    unit: partial.unit || 'stuk',
    unit_price: partial.unit_price ?? 0,
  };
}

function lineTotal(item) {
  return toMoney(toNumber(item.quantity) * toNumber(item.unit_price));
}

function findTemplateKey(oplossing) {
  return OPLOSSING_OPTIONS.find((option) => option.value === oplossing)?.templateKey || null;
}

function formatCurrency(value) {
  return `€${toMoney(value).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function hydrateInitialLineItems(lead) {
  const parsed = Array.isArray(lead?.inspection_data_v2?.line_items)
    ? lead.inspection_data_v2.line_items.map((item) =>
        newLineItem({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
        })
      )
    : [];

  if (parsed.length > 0) return parsed;

  if (lead?.quote_amount) {
    return [
      newLineItem({
        description: lead.oplossing || 'Vochtwering werkzaamheden',
        quantity: lead.oppervlakte_m2 || 1,
        unit: lead.oppervlakte_m2 ? 'm²' : 'stuk',
        unit_price: lead.oppervlakte_m2 ? toNumber(lead.quote_amount) / toNumber(lead.oppervlakte_m2, 1) : toNumber(lead.quote_amount),
      }),
    ];
  }

  return [];
}

export default function InspectionForm({ lead, onSave, mode = 'create' }) {
  const isEditMode = mode === 'edit';
  const initialData = lead.inspection_data_v2 || {};

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    diagnose: lead.diagnose || initialData.diagnose || '',
    diagnose_details: initialData.diagnose_details || '',
    oplossing: lead.oplossing || initialData.oplossing || '',
    oppervlakte_m2: String(lead.oppervlakte_m2 || initialData.oppervlakte_m2 || ''),
    inspection_notes: lead.inspection_notes || initialData.notes || '',
    quote_amount: String(lead.quote_amount || initialData.subtotal || ''),
  });

  const [photos, setPhotos] = useState(lead.photos || []);
  const [lineItems, setLineItems] = useState(hydrateInitialLineItems(lead));
  const [settingsTemplates, setSettingsTemplates] = useState(DEFAULT_LINE_ITEM_TEMPLATES);
  const [quoteDefaults, setQuoteDefaults] = useState({
    ...DEFAULT_QUOTE_DEFAULTS,
    ...(initialData.btw_percentage ? { btw_percentage: initialData.btw_percentage } : {}),
    ...(initialData.garantie_jaren ? { garantie_jaren: initialData.garantie_jaren } : {}),
    ...(initialData.doorlooptijd ? { doorlooptijd: initialData.doorlooptijd } : {}),
  });

  const [lengthValue, setLengthValue] = useState('');
  const [widthValue, setWidthValue] = useState('');
  const [quoteTouched, setQuoteTouched] = useState(Boolean(lead.quote_amount));

  const [discountType, setDiscountType] = useState(initialData.discount_type || 'percentage');
  const [discountValue, setDiscountValue] = useState(String(initialData.discount_value || ''));
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((settings) => {
        if (settings.line_item_templates && typeof settings.line_item_templates === 'object') {
          setSettingsTemplates(settings.line_item_templates);
        }

        if (settings.quote_defaults && typeof settings.quote_defaults === 'object') {
          setQuoteDefaults((prev) => ({ ...prev, ...settings.quote_defaults }));
        }
      })
      .catch(() => {
        // Keep defaults silently when settings endpoint is unavailable.
      });
  }, []);

  const oppervlakte = toNumber(form.oppervlakte_m2, 0);
  const calcArea = toMoney(toNumber(lengthValue, 0) * toNumber(widthValue, 0));

  const subtotal = useMemo(() => lineItems.reduce((sum, item) => sum + lineTotal(item), 0), [lineItems]);
  const discountAmount = useMemo(() => {
    const val = toNumber(discountValue, 0);
    if (val <= 0) return 0;
    if (discountType === 'percentage') return toMoney((subtotal * Math.min(val, 100)) / 100);
    return toMoney(Math.min(val, subtotal));
  }, [subtotal, discountType, discountValue]);
  const discountedSubtotal = toMoney(subtotal - discountAmount);
  const btwPercentage = toNumber(quoteDefaults.btw_percentage, 21);
  const btwAmount = toMoney((discountedSubtotal * btwPercentage) / 100);
  const totalIncl = toMoney(discountedSubtotal + btwAmount);

  useEffect(() => {
    if (!quoteTouched) {
      setForm((prev) => ({ ...prev, quote_amount: subtotal > 0 ? String(subtotal) : '' }));
    }
  }, [quoteTouched, subtotal]);

  const setLineItemsFromTemplate = (oplossing, m2 = oppervlakte) => {
    const templateKey = findTemplateKey(oplossing);
    if (!templateKey) return;

    const source = settingsTemplates[templateKey] || DEFAULT_LINE_ITEM_TEMPLATES[templateKey] || [];
    if (!Array.isArray(source) || source.length === 0) return;

    const hydrated = source.map((item) =>
      newLineItem({
        description: item.description,
        unit: item.unit,
        unit_price: item.unit_price,
        quantity: item.unit === 'm²' ? Math.max(1, m2 || 1) : 1,
      })
    );

    setLineItems(hydrated);
  };

  const applyAreaToLineItems = (areaValue) => {
    if (!areaValue || areaValue <= 0) return;

    setLineItems((prev) =>
      prev.map((item) =>
        item.unit === 'm²'
          ? {
              ...item,
              quantity: areaValue,
            }
          : item
      )
    );
  };

  const handlePhotoCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('lead_id', lead.id);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      setPhotos((prev) => [...prev, url]);
      toast.success('Foto geüpload');
    } catch {
      toast.error('Foto uploaden mislukt');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (sendQuote = false) => {
    setSaving(true);

    try {
      const normalizedLineItems = lineItems.map((item) => ({
        description: item.description,
        quantity: toNumber(item.quantity, 0),
        unit: item.unit,
        unit_price: toMoney(item.unit_price),
        total: lineTotal(item),
      }));

      const quoteAmount = toMoney(form.quote_amount || subtotal);

      const inspectionDataV2 = {
        diagnose: form.diagnose || null,
        diagnose_details: form.diagnose_details || null,
        oplossing: form.oplossing || null,
        oppervlakte_m2: oppervlakte || null,
        line_items: normalizedLineItems,
        subtotal: toMoney(subtotal),
        discount_type: discountAmount > 0 ? discountType : null,
        discount_value: discountAmount > 0 ? toNumber(discountValue, 0) : null,
        discount_amount: discountAmount > 0 ? discountAmount : null,
        btw_percentage: btwPercentage,
        btw_amount: btwAmount,
        total_incl_btw: totalIncl,
        garantie_jaren: toNumber(quoteDefaults.garantie_jaren, 5),
        doorlooptijd: quoteDefaults.doorlooptijd || '3 werkdagen',
        betaling: quoteDefaults.betaling || '40% bij opdracht, 60% na oplevering',
        notes: form.inspection_notes || null,
      };

      // In edit mode, don't regress status if lead is already further in pipeline
      const STAGE_ORDER = ['nieuw', 'uitgenodigd', 'bevestigd', 'bezocht', 'offerte_verzonden', 'akkoord', 'verloren'];
      const currentIdx = STAGE_ORDER.indexOf(lead.status);
      const bezoochtIdx = STAGE_ORDER.indexOf('bezocht');

      const updates = {
        diagnose: form.diagnose || null,
        oplossing: form.oplossing || null,
        oppervlakte_m2: oppervlakte || null,
        inspection_notes: form.inspection_notes || null,
        quote_amount: quoteAmount || null,
        inspection_data_v2: inspectionDataV2,
        photos,
      };

      // Only set status to bezocht if not already further in the pipeline
      if (!isEditMode || currentIdx <= bezoochtIdx) {
        updates.status = 'bezocht';
      }

      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        if (payload?.error?.includes('inspection_data_v2')) {
          throw new Error('De database mist kolom inspection_data_v2. Run de migratie 2026-02-09-inspection-v2.sql.');
        }
        throw new Error(payload?.error || 'Kon inspectie niet opslaan');
      }

      if (sendQuote && quoteAmount > 0) {
        const quoteRes = await fetch(`/api/leads/${lead.id}/send-quote`, {
          method: 'POST',
        });
        if (!quoteRes.ok) {
          const payload = await quoteRes.json().catch(() => ({}));
          throw new Error(payload?.error || 'Offerte verzenden mislukt');
        }
        toast.success('Offerte verzonden!');
      } else {
        toast.success('Inspectie opgeslagen');
      }

      onSave?.();
    } catch (error) {
      toast.error(error?.message || 'Opslaan mislukt');
    } finally {
      setSaving(false);
    }
  };

  const updateLineItem = (id, field, value) => {
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const canGoNext =
    (step === 1 && form.diagnose) ||
    (step === 2 && form.oplossing) ||
    step >= 3;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Inspectie bij</p>
          <h2 className="font-bold text-lg">{lead.name} - {lead.plaatsnaam}</h2>
          {lead.type_probleem && <Badge variant="outline" className="mt-2">{lead.type_probleem}</Badge>}
          <div className="mt-2">
            <a href={`tel:${lead.phone}`} className="text-sm" style={{ color: '#355b23' }}>
              {lead.phone}
            </a>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {STEPS.map((item) => (
              <Badge key={item.key} variant={step === item.key ? 'default' : 'secondary'}>
                Stap {item.key}: {item.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {step === 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Stap 1/4 - Diagnose</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Diagnose</Label>
              <Select
                value={form.diagnose}
                onValueChange={(value) => setForm((prev) => ({ ...prev, diagnose: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kies diagnose" />
                </SelectTrigger>
                <SelectContent>
                  {DIAGNOSE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Diagnose details</Label>
              <Textarea
                placeholder="Bijv. grondwater dringt door funderingsmuur"
                value={form.diagnose_details}
                onChange={(e) => setForm((prev) => ({ ...prev, diagnose_details: e.target.value }))}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Stap 2/4 - Oplossing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Oplossing</Label>
              <Select
                value={form.oplossing}
                onValueChange={(value) => {
                  setForm((prev) => ({ ...prev, oplossing: value }));
                  setLineItemsFromTemplate(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kies oplossing" />
                </SelectTrigger>
                <SelectContent>
                  {OPLOSSING_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border p-3 text-sm text-muted-foreground">
              Bij selectie van een standaardoplossing vullen de meest gebruikte line items automatisch in.
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Stap 3/4 - Afmetingen & Foto&apos;s</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Oppervlakte (m²)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="bijv. 28"
                  value={form.oppervlakte_m2}
                  onChange={(e) => {
                    const next = e.target.value;
                    setForm((prev) => ({ ...prev, oppervlakte_m2: next }));
                    applyAreaToLineItems(toNumber(next, 0));
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Lengte (m)</Label>
                <Input type="number" step="0.1" value={lengthValue} onChange={(e) => setLengthValue(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Breedte (m)</Label>
                <Input type="number" step="0.1" value={widthValue} onChange={(e) => setWidthValue(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <p className="text-sm">Automatische berekening: {lengthValue || '0'} × {widthValue || '0'} = <strong>{calcArea || 0} m²</strong></p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (calcArea <= 0) return;
                  setForm((prev) => ({ ...prev, oppervlakte_m2: String(calcArea) }));
                  applyAreaToLineItems(calcArea);
                }}
              >
                Gebruik
              </Button>
            </div>

            <div>
              <Label>Foto&apos;s</Label>
              <div className="grid grid-cols-3 gap-2 mt-2 mb-3">
                {photos.map((url, i) => (
                  <img key={i} src={url} alt={`Foto ${i + 1}`} className="rounded-md aspect-square object-cover" />
                ))}
              </div>

              <Label htmlFor="photo-input" className="cursor-pointer">
                <div className="flex items-center justify-center gap-2 border-2 border-dashed rounded-md p-4 text-muted-foreground hover:bg-muted transition-colors">
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Camera className="h-5 w-5" />
                      <span className="text-sm">Foto toevoegen</span>
                    </>
                  )}
                </div>
              </Label>
              <input
                id="photo-input"
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoCapture}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Stap 4/4 - Offerte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {lineItems.length === 0 && (
                <div className="rounded-md border p-3 text-sm text-muted-foreground">
                  Nog geen line items. Voeg regels toe of kies een oplossing met template.
                </div>
              )}

              {lineItems.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-end rounded-md border p-3">
                  <div className="col-span-12 sm:col-span-5 space-y-1">
                    <Label className="text-xs">Omschrijving</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2 space-y-1">
                    <Label className="text-xs">Aantal</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(item.id, 'quantity', e.target.value)}
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-2 space-y-1">
                    <Label className="text-xs">Eenheid</Label>
                    <Input
                      value={item.unit}
                      onChange={(e) => updateLineItem(item.id, 'unit', e.target.value)}
                    />
                  </div>
                  <div className="col-span-5 sm:col-span-2 space-y-1">
                    <Label className="text-xs">Prijs</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateLineItem(item.id, 'unit_price', e.target.value)}
                    />
                  </div>
                  <div className="col-span-7 sm:col-span-1 flex items-center justify-between sm:justify-end gap-2">
                    <span className="text-sm font-medium">{formatCurrency(lineTotal(item))}</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => setLineItems((prev) => prev.filter((entry) => entry.id !== item.id))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => setLineItems((prev) => [...prev, newLineItem()])}
              >
                <Plus className="h-4 w-4" />
                Regel toevoegen
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className="space-y-1">
                <Label className="text-xs">Korting type</Label>
                <Select value={discountType} onValueChange={setDiscountType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Vast bedrag (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Korting waarde</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={discountType === 'percentage' ? 'bijv. 10' : 'bijv. 250'}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                />
              </div>
              {discountAmount > 0 && (
                <p className="text-sm text-muted-foreground pb-2">
                  Korting: -{formatCurrency(discountAmount)}
                </p>
              )}
            </div>

            <div className="rounded-md bg-muted p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span>Subtotaal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Korting {discountType === 'percentage' ? `(${toNumber(discountValue, 0)}%)` : ''}</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>BTW ({btwPercentage}%){discountAmount > 0 ? ` over ${formatCurrency(discountedSubtotal)}` : ''}</span>
                <span>{formatCurrency(btwAmount)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-bold">
                <span>Totaal incl. BTW</span>
                <span>{formatCurrency(totalIncl)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Offertebedrag (excl. BTW)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.quote_amount}
                onChange={(e) => {
                  setQuoteTouched(true);
                  setForm((prev) => ({ ...prev, quote_amount: e.target.value }));
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Bijzonderheden</Label>
              <Textarea
                rows={4}
                placeholder="Extra notities voor offerte"
                value={form.inspection_notes}
                onChange={(e) => setForm((prev) => ({ ...prev, inspection_notes: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between gap-2 pb-8">
        <Button
          type="button"
          variant="outline"
          disabled={step === 1}
          onClick={() => setStep((prev) => Math.max(1, prev - 1))}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Vorige
        </Button>

        <div className="flex items-center gap-2">
          {step < 4 && (
            <Button
              type="button"
              disabled={!canGoNext}
              onClick={() => setStep((prev) => Math.min(4, prev + 1))}
            >
              Volgende
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}

          {step === 4 && (
            <>
              {lead.id && lead.quote_amount > 0 && (
                <Dialog open={pdfPreviewOpen} onOpenChange={setPdfPreviewOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Eye className="h-4 w-4" />
                      Bekijk PDF
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl h-[80vh]">
                    <DialogHeader>
                      <DialogTitle>Offerte preview</DialogTitle>
                    </DialogHeader>
                    <iframe
                      src={`/api/pdf/quote/${lead.id}`}
                      className="w-full h-full rounded-md border"
                      title="Offerte PDF"
                    />
                  </DialogContent>
                </Dialog>
              )}

              <Button
                onClick={() => handleSave(false)}
                disabled={saving}
                variant="outline"
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Opslaan...' : 'Opslaan'}
              </Button>

              {isEditMode ? (
                <Button
                  onClick={() => handleSave(true)}
                  disabled={saving || toMoney(form.quote_amount) <= 0}
                  className="gap-2"
                  style={{ backgroundColor: '#355b23' }}
                >
                  <RotateCcw className="h-4 w-4" />
                  {saving ? 'Verzenden...' : 'Opslaan & opnieuw versturen'}
                </Button>
              ) : (
                <Button
                  onClick={() => handleSave(true)}
                  disabled={saving || toMoney(form.quote_amount) <= 0}
                  className="gap-2"
                  style={{ backgroundColor: '#355b23' }}
                >
                  <Send className="h-4 w-4" />
                  {saving ? 'Verzenden...' : 'Genereer & verstuur offerte'}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
