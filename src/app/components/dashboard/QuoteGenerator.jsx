'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Textarea } from '@/app/components/ui/textarea';
import { Button } from '@/app/components/ui/button';
import { Separator } from '@/app/components/ui/separator';
import { Badge } from '@/app/components/ui/badge';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/app/components/ui/sheet';
import { toast } from 'sonner';
import {
  Save, Send, Loader2, Trash2, Plus, Eye, Sparkles, Undo2,
  ChevronDown, ChevronUp, Camera, Search, Link as LinkIcon,
} from 'lucide-react';
import {
  DIAGNOSE_OPTIONS,
  OPLOSSING_OPTIONS,
  KELDER_SUB_AREAS,
  DEFAULT_LINE_ITEM_TEMPLATES,
  EXTRA_LINE_ITEMS,
  normalizeDiagnose,
  normalizeOplossing,
} from '@/lib/utils/inspection-constants';
import { getStaffelPrijs, getStaffelLabel, applyMinimum } from '@/lib/utils/pricing';

// --- Helpers ---

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

function isSquareMeterUnit(unit) {
  const normalized = String(unit || '').trim().toLowerCase().replaceAll('\u00b2', '2').replaceAll('^', '');
  return normalized === 'm2';
}

function formatCurrency(value) {
  return `\u20AC${toMoney(value).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function hydrateKelderSubAreas(saved) {
  const areas = {};
  for (const area of KELDER_SUB_AREAS) {
    areas[area.key] = {
      enabled: saved?.[area.key]?.enabled ?? false,
      quantity: saved?.[area.key]?.quantity ?? '',
    };
  }
  return areas;
}

function hasKelderSubAreas(oplossingen) {
  return oplossingen.some((opl) => {
    const opt = OPLOSSING_OPTIONS.find((o) => o.value === opl);
    return opt?.hasSubAreas;
  });
}

const DEFAULT_QUOTE_DEFAULTS = {
  btw_percentage: 21,
  garantie_jaren: 5,
  doorlooptijd: '3 werkdagen',
  betaling: 'Op de eerste werkdag bij aanvang, restant binnen 2 weken na oplevering',
  geldigheid_dagen: 30,
  offerte_inleiding: '',
};

// --- Component ---

export default function QuoteGenerator({ quote = null, leadId = null }) {
  const router = useRouter();
  const isEdit = Boolean(quote?.id);

  // --- Customer state ---
  const [customerSearch, setCustomerSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  const [customer, setCustomer] = useState({
    lead_id: quote?.lead_id || leadId || null,
    name: quote?.customer_name || '',
    email: quote?.customer_email || '',
    phone: quote?.customer_phone || '',
    straat: quote?.customer_straat || '',
    postcode: quote?.customer_postcode || '',
    plaatsnaam: quote?.customer_plaatsnaam || '',
  });

  // --- Diagnose & treatment state ---
  const [diagnose, setDiagnose] = useState(normalizeDiagnose(quote?.diagnose || []));
  const [diagnoseDetails, setDiagnoseDetails] = useState(quote?.diagnose_details || '');
  const [oplossingen, setOplossingen] = useState(normalizeOplossing(quote?.oplossingen || []));
  const [kelderSubAreas, setKelderSubAreas] = useState(hydrateKelderSubAreas(quote?.kelder_sub_areas));
  const [oppervlakte, setOppervlakte] = useState(String(quote?.oppervlakte_m2 || ''));
  const [injectieDepth, setInjectieDepth] = useState(quote?.injectie_depth || 30);
  const [notes, setNotes] = useState(quote?.notes || '');
  const [photos, setPhotos] = useState(quote?.photos || []);

  // --- Line items & pricing ---
  const [lineItems, setLineItems] = useState(
    Array.isArray(quote?.line_items) && quote.line_items.length > 0
      ? quote.line_items.map((item) => newLineItem(item))
      : []
  );
  const [lineItemHints, setLineItemHints] = useState({});
  const [settingsTemplates, setSettingsTemplates] = useState(DEFAULT_LINE_ITEM_TEMPLATES);
  const [settingsExtras, setSettingsExtras] = useState(EXTRA_LINE_ITEMS);

  // --- Quote terms ---
  const [quoteDefaults, setQuoteDefaults] = useState({
    ...DEFAULT_QUOTE_DEFAULTS,
    ...(quote?.garantie_jaren ? { garantie_jaren: quote.garantie_jaren } : {}),
    ...(quote?.doorlooptijd ? { doorlooptijd: quote.doorlooptijd } : {}),
    ...(quote?.betaling ? { betaling: quote.betaling } : {}),
    ...(quote?.geldigheid_dagen ? { geldigheid_dagen: quote.geldigheid_dagen } : {}),
    ...(quote?.offerte_inleiding != null ? { offerte_inleiding: quote.offerte_inleiding } : {}),
  });

  // --- Discount ---
  const [discountType, setDiscountType] = useState(quote?.discount_type || 'percentage');
  const [discountValue, setDiscountValue] = useState(String(quote?.discount_value || ''));
  const [label, setLabel] = useState(quote?.label || '');

  // --- UI state ---
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState('');
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [conditionsOpen, setConditionsOpen] = useState(false);
  const [extrasOpen, setExtrasOpen] = useState(false);
  const [refining, setRefining] = useState(false);
  const [originalDiagnoseDetails, setOriginalDiagnoseDetails] = useState(null);

  // --- Load settings & pricelist ---
  useEffect(() => {
    fetch('/api/settings')
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((settings) => {
        if (settings.pricelist?.templates && typeof settings.pricelist.templates === 'object') {
          setSettingsTemplates(settings.pricelist.templates);
        } else if (settings.line_item_templates && typeof settings.line_item_templates === 'object') {
          setSettingsTemplates(settings.line_item_templates);
        }
        if (settings.pricelist?.extras && Array.isArray(settings.pricelist.extras)) {
          setSettingsExtras(settings.pricelist.extras);
        }
        if (settings.quote_defaults && typeof settings.quote_defaults === 'object') {
          setQuoteDefaults((prev) => ({ ...prev, ...settings.quote_defaults }));
        }
      })
      .catch(() => {});
  }, []);

  // --- Load lead data if leadId provided ---
  useEffect(() => {
    if (!leadId || isEdit) return;
    fetch(`/api/leads/${leadId}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((lead) => {
        setSelectedLead(lead);
        setCustomer({
          lead_id: lead.id,
          name: lead.name || '',
          email: lead.email || '',
          phone: lead.phone || '',
          straat: lead.straat || '',
          postcode: lead.postcode || '',
          plaatsnaam: lead.plaatsnaam || '',
        });
        // Pre-fill inspection data if available
        const insp = lead.inspection_data_v2;
        if (insp) {
          if (insp.diagnose) setDiagnose(normalizeDiagnose(insp.diagnose));
          if (insp.diagnose_details) setDiagnoseDetails(insp.diagnose_details);
          if (insp.oplossingen) setOplossingen(normalizeOplossing(insp.oplossingen));
          if (insp.kelder_sub_areas) setKelderSubAreas(hydrateKelderSubAreas(insp.kelder_sub_areas));
          if (insp.oppervlakte_m2) setOppervlakte(String(insp.oppervlakte_m2));
          if (insp.injectie_depth) setInjectieDepth(insp.injectie_depth);
          if (insp.notes) setNotes(insp.notes);
        }
        if (lead.photos?.length > 0) setPhotos(lead.photos);
        if (lead.oppervlakte_m2 && !insp?.oppervlakte_m2) setOppervlakte(String(lead.oppervlakte_m2));
      })
      .catch(() => {});
  }, [leadId, isEdit]);

  // Cleanup blob URLs
  useEffect(() => {
    return () => {
      if (previewPdfUrl) URL.revokeObjectURL(previewPdfUrl);
    };
  }, [previewPdfUrl]);

  // --- Computed totals (incl. BTW) ---
  const opp = toNumber(oppervlakte, 0);
  const subtotalIncl = useMemo(() => lineItems.reduce((sum, item) => sum + lineTotal(item), 0), [lineItems]);
  const discountAmount = useMemo(() => {
    const val = toNumber(discountValue, 0);
    if (val <= 0) return 0;
    if (discountType === 'percentage') return toMoney((subtotalIncl * Math.min(val, 100)) / 100);
    return toMoney(Math.min(val, subtotalIncl));
  }, [subtotalIncl, discountType, discountValue]);
  const afterDiscount = toMoney(subtotalIncl - discountAmount);
  const btwPercentage = toNumber(quoteDefaults.btw_percentage, 21);
  // All prices are incl. BTW, so back-calculate
  const exclBtw = toMoney(afterDiscount / (1 + btwPercentage / 100));
  const btwAmount = toMoney(afterDiscount - exclBtw);

  // --- Customer search ---
  useEffect(() => {
    if (customerSearch.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch('/api/leads');
        if (!res.ok) throw new Error();
        const leads = await res.json();
        const q = customerSearch.toLowerCase();
        const filtered = leads
          .filter((l) =>
            l.name?.toLowerCase().includes(q) ||
            l.phone?.includes(q) ||
            l.email?.toLowerCase().includes(q)
          )
          .slice(0, 8);
        setSearchResults(filtered);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  // --- Handlers ---

  const selectLead = (lead) => {
    setSelectedLead(lead);
    setCustomer({
      lead_id: lead.id,
      name: lead.name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      straat: lead.straat || '',
      postcode: lead.postcode || '',
      plaatsnaam: lead.plaatsnaam || '',
    });
    setCustomerSearch('');
    setSearchResults([]);
  };

  const clearSelectedLead = () => {
    setSelectedLead(null);
    setCustomer({ lead_id: null, name: '', email: '', phone: '', straat: '', postcode: '', plaatsnaam: '' });
  };

  const toggleDiagnose = (option) => {
    setDiagnose((prev) =>
      prev.includes(option) ? prev.filter((d) => d !== option) : [...prev, option]
    );
  };

  const toggleOplossing = (option) => {
    setOplossingen((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );
  };

  const toggleKelderSubArea = (key) => {
    setKelderSubAreas((prev) => ({
      ...prev,
      [key]: { ...prev[key], enabled: !prev[key].enabled },
    }));
  };

  const updateKelderSubAreaQuantity = (key, quantity) => {
    setKelderSubAreas((prev) => ({
      ...prev,
      [key]: { ...prev[key], quantity },
    }));
  };

  const injectieOption = OPLOSSING_OPTIONS.find((o) => o.depthOptions);

  const generateLineItemsFromSelections = () => {
    const items = [];
    const hints = {};

    for (const oplVal of oplossingen) {
      const opt = OPLOSSING_OPTIONS.find((o) => o.value === oplVal);
      if (!opt) continue;

      if (opt.hasSubAreas) {
        for (const area of KELDER_SUB_AREAS) {
          if (!kelderSubAreas?.[area.key]?.enabled) continue;
          const templates = settingsTemplates[area.templateKey] || DEFAULT_LINE_ITEM_TEMPLATES[area.templateKey] || [];
          const qty = Math.max(1, toNumber(kelderSubAreas[area.key].quantity, 1));
          for (const tpl of templates) {
            let price = tpl.unit_price;
            const hintParts = [];
            if (tpl.staffels) {
              price = getStaffelPrijs(tpl.unit_price, tpl.staffels, qty);
              const lbl = getStaffelLabel(tpl.staffels, qty);
              if (lbl) hintParts.push(`(${lbl})`);
            }
            if (tpl.minimum) {
              const { price: adjPrice, minimumApplied } = applyMinimum(price, qty, tpl.minimum);
              if (minimumApplied) {
                price = adjPrice;
                hintParts.push(`(min. \u20AC${tpl.minimum.toLocaleString('nl-NL')})`);
              }
            }
            const item = newLineItem({ description: tpl.description, unit: tpl.unit, unit_price: price, quantity: qty });
            if (hintParts.length > 0) hints[item.id] = hintParts.join(' ');
            items.push(item);
          }
        }
      } else if (opt.templateKey) {
        const templates = settingsTemplates[opt.templateKey] || DEFAULT_LINE_ITEM_TEMPLATES[opt.templateKey] || [];
        for (const tpl of templates) {
          let price = tpl.unit_price;
          let desc = tpl.description;
          const qty = isSquareMeterUnit(tpl.unit) || tpl.unit === 'm\u00b9' ? Math.max(1, opp || 1) : 1;
          const hintParts = [];

          if (opt.depthOptions && tpl.unit === 'm\u00b9') {
            const depthOpt = opt.depthOptions.find((d) => d.depth === injectieDepth);
            if (depthOpt) {
              price = depthOpt.prijs;
              desc = `${tpl.description}, ${depthOpt.depth}cm`;
            }
          }
          if (tpl.staffels) {
            price = getStaffelPrijs(price, tpl.staffels, qty);
            const lbl = getStaffelLabel(tpl.staffels, qty);
            if (lbl) hintParts.push(`(${lbl})`);
          }
          if (tpl.minimum) {
            const { price: adjPrice, minimumApplied } = applyMinimum(price, qty, tpl.minimum);
            if (minimumApplied) {
              price = adjPrice;
              hintParts.push(`(min. \u20AC${tpl.minimum.toLocaleString('nl-NL')})`);
            }
          }
          const item = newLineItem({ description: desc, unit: tpl.unit, unit_price: price, quantity: qty });
          if (hintParts.length > 0) hints[item.id] = hintParts.join(' ');
          items.push(item);
        }
      }
    }

    if (items.length > 0) {
      setLineItems(items);
      setLineItemHints(hints);
      toast.success('Regels gegenereerd uit selectie');
    } else {
      toast.info('Geen regels om te genereren. Selecteer een oplossing.');
    }
  };

  const updateLineItem = (id, field, value) => {
    setLineItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const handleRefineText = async () => {
    if (!diagnoseDetails || diagnoseDetails.trim().length < 5) {
      toast.error('Schrijf eerst een diagnose toelichting');
      return;
    }
    setRefining(true);
    setOriginalDiagnoseDetails(diagnoseDetails);
    try {
      const res = await fetch('/api/ai/refine-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: diagnoseDetails }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Verfijnen mislukt');
      }
      const { refined } = await res.json();
      setDiagnoseDetails(refined);
      toast.success('Tekst verfijnd');
    } catch (err) {
      toast.error(err?.message || 'Tekst verfijnen mislukt');
      setOriginalDiagnoseDetails(null);
    } finally {
      setRefining(false);
    }
  };

  const handlePhotoCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    // Use lead_id if available, otherwise use a temp identifier
    formData.append('lead_id', customer.lead_id || 'quote-draft');
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      setPhotos((prev) => [...prev, url]);
      toast.success('Foto ge\u00fcpload');
    } catch {
      toast.error('Foto uploaden mislukt');
    } finally {
      setUploading(false);
    }
  };

  // --- Build payload ---
  const buildPayload = () => {
    const normalizedLineItems = lineItems.map((item) => ({
      description: item.description,
      quantity: toNumber(item.quantity, 0),
      unit: item.unit,
      unit_price: toMoney(item.unit_price),
      total: lineTotal(item),
    }));

    return {
      lead_id: customer.lead_id,
      customer_name: customer.name,
      customer_email: customer.email || null,
      customer_phone: customer.phone || null,
      customer_straat: customer.straat || null,
      customer_postcode: customer.postcode || null,
      customer_plaatsnaam: customer.plaatsnaam || null,
      diagnose,
      diagnose_details: diagnoseDetails || null,
      oplossingen,
      kelder_sub_areas: kelderSubAreas,
      oppervlakte_m2: opp || null,
      injectie_depth: injectieDepth,
      notes: notes || null,
      photos,
      line_items: normalizedLineItems,
      subtotal_incl: toMoney(subtotalIncl),
      discount_type: discountAmount > 0 ? discountType : null,
      discount_value: discountAmount > 0 ? toNumber(discountValue, 0) : null,
      discount_amount: discountAmount > 0 ? discountAmount : null,
      btw_percentage: btwPercentage,
      btw_amount: btwAmount,
      total_incl: toMoney(afterDiscount),
      garantie_jaren: toNumber(quoteDefaults.garantie_jaren, 5),
      doorlooptijd: quoteDefaults.doorlooptijd || '3 werkdagen',
      betaling: quoteDefaults.betaling,
      geldigheid_dagen: toNumber(quoteDefaults.geldigheid_dagen, 30),
      offerte_inleiding: quoteDefaults.offerte_inleiding || null,
      label: label || null,
    };
  };

  // --- Save ---
  const handleSave = async () => {
    if (!customer.name) {
      toast.error('Vul een klantnaam in');
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      const url = isEdit ? `/api/quotes/${quote.id}` : '/api/quotes';
      const method = isEdit ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Opslaan mislukt');
      }
      const saved = await res.json();
      toast.success('Offerte opgeslagen als concept');
      if (!isEdit) {
        router.push(`/dashboard/offerte/${saved.id}`);
      }
    } catch (err) {
      toast.error(err?.message || 'Opslaan mislukt');
    } finally {
      setSaving(false);
    }
  };

  // --- Send ---
  const handleSend = async () => {
    if (!customer.name) {
      toast.error('Vul een klantnaam in');
      return;
    }
    if (!customer.email) {
      toast.error('Vul een e-mailadres in om de offerte te versturen');
      return;
    }
    if (lineItems.length === 0) {
      toast.error('Voeg eerst offerteregels toe');
      return;
    }
    setSending(true);
    try {
      // Save first
      const payload = buildPayload();
      const saveUrl = isEdit ? `/api/quotes/${quote.id}` : '/api/quotes';
      const saveMethod = isEdit ? 'PATCH' : 'POST';
      const saveRes = await fetch(saveUrl, {
        method: saveMethod,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!saveRes.ok) {
        const data = await saveRes.json().catch(() => ({}));
        throw new Error(data.error || 'Opslaan mislukt');
      }
      const saved = await saveRes.json();

      // Then send
      const sendRes = await fetch(`/api/quotes/${saved.id}/send`, { method: 'POST' });
      if (!sendRes.ok) {
        const data = await sendRes.json().catch(() => ({}));
        throw new Error(data.error || 'Verzenden mislukt');
      }

      toast.success('Offerte verzonden!');
      router.push(`/dashboard/offerte/${saved.id}`);
    } catch (err) {
      toast.error(err?.message || 'Verzenden mislukt');
    } finally {
      setSending(false);
    }
  };

  // --- PDF Preview ---
  const generateDraftPreview = async () => {
    setGeneratingPreview(true);
    if (previewPdfUrl) {
      URL.revokeObjectURL(previewPdfUrl);
      setPreviewPdfUrl('');
    }
    try {
      const payload = buildPayload();
      // Build a lead-like object for the existing PDF preview endpoint
      const draftLead = {
        id: quote?.id || 'draft',
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        straat: customer.straat,
        postcode: customer.postcode,
        plaatsnaam: customer.plaatsnaam,
        oppervlakte_m2: opp || null,
        inspection_notes: notes,
        quote_amount: exclBtw,
        photos,
        inspection_data_v2: {
          diagnose,
          diagnose_details: diagnoseDetails || null,
          oplossingen,
          kelder_sub_areas: kelderSubAreas,
          oppervlakte_m2: opp || null,
          line_items: payload.line_items,
          subtotal: toMoney(subtotalIncl),
          discount_type: discountAmount > 0 ? discountType : null,
          discount_value: discountAmount > 0 ? toNumber(discountValue, 0) : null,
          discount_amount: discountAmount > 0 ? discountAmount : null,
          btw_percentage: btwPercentage,
          btw_amount: btwAmount,
          total_incl_btw: toMoney(afterDiscount),
          garantie_jaren: toNumber(quoteDefaults.garantie_jaren, 5),
          doorlooptijd: quoteDefaults.doorlooptijd || '3 werkdagen',
          betaling: quoteDefaults.betaling,
          geldigheid_dagen: toNumber(quoteDefaults.geldigheid_dagen, 30),
          offerte_inleiding: quoteDefaults.offerte_inleiding || null,
          injectie_depth: injectieDepth,
          notes: notes || null,
        },
      };
      const res = await fetch('/api/pdf/quote/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftLead }),
      });
      if (!res.ok) throw new Error('Kon PDF preview niet genereren');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPreviewPdfUrl(url);
    } catch (error) {
      toast.error(error?.message || 'PDF preview genereren mislukt');
    } finally {
      setGeneratingPreview(false);
    }
  };

  const showKelderSubAreas = hasKelderSubAreas(oplossingen);

  return (
    <div className="space-y-4 pb-24">
      {/* Section 1: Klant */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Klant</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!customer.lead_id && !selectedLead ? (
            <>
              {/* Lead search */}
              <div className="space-y-2">
                <Label className="text-sm">Bestaande klant zoeken</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Zoek op naam, telefoon of e-mail..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {searching && (
                  <p className="text-xs text-muted-foreground">Zoeken...</p>
                )}
                {searchResults.length > 0 && (
                  <div className="rounded-md border divide-y max-h-48 overflow-y-auto">
                    {searchResults.map((lead) => (
                      <button
                        key={lead.id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-muted transition-colors text-sm"
                        onClick={() => selectLead(lead)}
                      >
                        <span className="font-medium">{lead.name}</span>
                        <span className="text-muted-foreground ml-2">{lead.phone}</span>
                        {lead.plaatsnaam && (
                          <span className="text-muted-foreground ml-2">{lead.plaatsnaam}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                <Separator />
                <p className="text-xs text-muted-foreground">Of vul de gegevens handmatig in:</p>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 p-3">
              <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{customer.name}</p>
                <p className="text-xs text-muted-foreground">
                  {customer.plaatsnaam} {customer.phone && `\u00b7 ${customer.phone}`}
                </p>
              </div>
              {customer.lead_id && (
                <a
                  href={`/dashboard/lead/${customer.lead_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs underline text-muted-foreground hover:text-foreground"
                >
                  Open lead
                </a>
              )}
              <Button type="button" variant="ghost" size="sm" onClick={clearSelectedLead}>
                Wijzig
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Naam *</Label>
              <Input
                value={customer.name}
                onChange={(e) => setCustomer((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Naam klant"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">E-mail</Label>
              <Input
                type="email"
                value={customer.email}
                onChange={(e) => setCustomer((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="email@voorbeeld.nl"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Telefoon</Label>
              <Input
                value={customer.phone}
                onChange={(e) => setCustomer((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="06 1234 5678"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Straat</Label>
              <Input
                value={customer.straat}
                onChange={(e) => setCustomer((prev) => ({ ...prev, straat: e.target.value }))}
                placeholder="Straatnaam 123"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Postcode</Label>
              <Input
                value={customer.postcode}
                onChange={(e) => setCustomer((prev) => ({ ...prev, postcode: e.target.value }))}
                placeholder="6412 BD"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Plaats</Label>
              <Input
                value={customer.plaatsnaam}
                onChange={(e) => setCustomer((prev) => ({ ...prev, plaatsnaam: e.target.value }))}
                placeholder="Heerlen"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Diagnose & Behandeling */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Diagnose & Behandeling</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Diagnose checkboxes */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Wat is het probleem?</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DIAGNOSE_OPTIONS.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-2 cursor-pointer rounded-md border p-2.5 hover:bg-muted transition-colors has-[data-state=checked]:border-primary has-[data-state=checked]:bg-primary/5"
                >
                  <Checkbox
                    checked={diagnose.includes(option)}
                    onCheckedChange={() => toggleDiagnose(option)}
                  />
                  <span className="text-sm">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Diagnose details + AI refine */}
          <div className="space-y-2">
            <Label>Toelichting diagnose</Label>
            <Textarea
              placeholder="Bijv. grondwater dringt door funderingsmuur, schimmelvorming op kelderwand"
              value={diagnoseDetails}
              onChange={(e) => setDiagnoseDetails(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={refining || !diagnoseDetails || diagnoseDetails.trim().length < 5}
                onClick={handleRefineText}
              >
                {refining ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {refining ? 'Verfijnen...' : 'Verfijn tekst'}
              </Button>
              {originalDiagnoseDetails && (
                <Button type="button" variant="ghost" size="sm" className="gap-1.5" onClick={() => {
                  setDiagnoseDetails(originalDiagnoseDetails);
                  setOriginalDiagnoseDetails(null);
                  toast.success('Originele tekst hersteld');
                }}>
                  <Undo2 className="h-3.5 w-3.5" />
                  Herstel
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Oplossing checkboxes */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Wat is de oplossing?</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {OPLOSSING_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 cursor-pointer rounded-md border p-2.5 hover:bg-muted transition-colors has-[data-state=checked]:border-primary has-[data-state=checked]:bg-primary/5"
                >
                  <Checkbox
                    checked={oplossingen.includes(option.value)}
                    onCheckedChange={() => toggleOplossing(option.value)}
                  />
                  <span className="text-sm">{option.value}</span>
                </label>
              ))}
            </div>

            {/* Injectie depth selector */}
            {oplossingen.some((opl) => {
              const opt = OPLOSSING_OPTIONS.find((o) => o.value === opl);
              return opt?.depthOptions;
            }) && (
              <div className="rounded-md border border-primary/30 bg-primary/5 p-3 space-y-2">
                <p className="text-sm font-medium">Injectiediepte</p>
                <div className="flex flex-wrap gap-3">
                  {injectieOption?.depthOptions.map((d) => (
                    <label key={d.depth} className="flex items-center gap-1.5 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="injectieDepth"
                        value={d.depth}
                        checked={injectieDepth === d.depth}
                        onChange={() => setInjectieDepth(d.depth)}
                        className="accent-[#355b23]"
                      />
                      <span>{d.label}</span>
                      <span className="text-muted-foreground">({'\u20AC'}{d.prijs}/m\u00b9)</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Kelder sub-areas */}
          {showKelderSubAreas && (
            <div className="rounded-md border border-primary/30 bg-primary/5 p-4 space-y-3">
              <p className="text-sm font-medium">Werkgebieden kelder</p>
              {KELDER_SUB_AREAS.map((area) => (
                <div key={area.key} className="flex items-center gap-3">
                  <Checkbox
                    checked={kelderSubAreas[area.key]?.enabled ?? false}
                    onCheckedChange={() => toggleKelderSubArea(area.key)}
                  />
                  <span className="text-sm flex-1 min-w-0">{area.label}</span>
                  {kelderSubAreas[area.key]?.enabled && (
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        className="w-20 h-8 text-sm"
                        placeholder="0"
                        value={kelderSubAreas[area.key]?.quantity ?? ''}
                        onChange={(e) => updateKelderSubAreaQuantity(area.key, e.target.value)}
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{area.unit}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Generate button */}
          {oplossingen.length > 0 && (
            <Button type="button" variant="outline" size="sm" onClick={generateLineItemsFromSelections}>
              Genereer regels uit selectie
            </Button>
          )}

          <Separator />

          {/* Oppervlakte + Photos + Notes */}
          <div className="space-y-2">
            <Label>Oppervlakte (m\u00b2)</Label>
            <Input
              type="number"
              step="0.1"
              placeholder="bijv. 28"
              className="max-w-[200px]"
              value={oppervlakte}
              onChange={(e) => setOppervlakte(e.target.value)}
            />
          </div>

          <div>
            <Label>Foto&apos;s</Label>
            <div className="grid grid-cols-3 gap-2 mt-2 mb-3">
              {photos.map((url, i) => (
                <div key={i} className="relative group">
                  <img src={url} alt={`Foto ${i + 1}`} className="rounded-md aspect-square object-cover" />
                  <button
                    type="button"
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <Label htmlFor="quote-photo-input" className="cursor-pointer">
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
              id="quote-photo-input"
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoCapture}
            />
          </div>

          <div className="space-y-2">
            <Label>Opmerkingen</Label>
            <Textarea
              rows={3}
              placeholder="Extra notities over de situatie"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Offerte */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Offerte</CardTitle>
            {label || !isEdit ? (
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Label</Label>
                <Input
                  className="w-56 h-8 text-sm"
                  placeholder="bijv. Optie A: alleen muren"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </div>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {lineItems.length === 0 && (
            <div className="rounded-md border p-3 text-sm text-muted-foreground">
              Nog geen regels. Kies een oplossing hierboven en klik &ldquo;Genereer regels uit selectie&rdquo;.
            </div>
          )}

          {/* Line items */}
          {lineItems.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-end rounded-md border p-3">
              <div className="col-span-12 sm:col-span-4 space-y-1">
                <Label className="text-xs">Omschrijving</Label>
                <Input
                  value={item.description}
                  onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                />
              </div>
              <div className="col-span-4 sm:col-span-1 space-y-1">
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
                <Label className="text-xs">Prijs incl. BTW</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={item.unit_price}
                  onChange={(e) => updateLineItem(item.id, 'unit_price', e.target.value)}
                />
              </div>
              <div className="col-span-8 sm:col-span-3 flex items-center justify-between sm:justify-end gap-2">
                <div className="text-right min-w-[70px]">
                  <span className="text-sm font-medium">{formatCurrency(lineTotal(item))}</span>
                  {lineItemHints[item.id] && (
                    <p className="text-[10px] text-muted-foreground leading-tight">{lineItemHints[item.id]}</p>
                  )}
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="shrink-0"
                  onClick={() => setLineItems((prev) => prev.filter((entry) => entry.id !== item.id))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          <div className="flex flex-wrap gap-2">
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

          {/* Quick-add extras */}
          <div className="rounded-md border overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between p-3 text-sm font-medium hover:bg-muted transition-colors"
              onClick={() => setExtrasOpen((prev) => !prev)}
            >
              <span>Veelgebruikte toevoegingen</span>
              {extrasOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {extrasOpen && (
              <div className="border-t p-3 flex flex-wrap gap-2">
                {settingsExtras.map((extra, idx) => (
                  <Button
                    key={idx}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      const qty = isSquareMeterUnit(extra.unit) ? Math.max(1, opp || 1) : 1;
                      let price = extra.unit_price;
                      if (extra.staffels) {
                        price = getStaffelPrijs(extra.unit_price, extra.staffels, qty);
                      }
                      setLineItems((prev) => [
                        ...prev,
                        newLineItem({ description: extra.description, unit: extra.unit, unit_price: price, quantity: qty }),
                      ]);
                      toast.success(`${extra.description} toegevoegd`);
                    }}
                  >
                    {extra.description} — {'\u20AC'}{extra.unit_price}/{extra.unit}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Discount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="space-y-1">
              <Label className="text-xs">Korting type</Label>
              <Select value={discountType} onValueChange={setDiscountType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">{`Vast bedrag (\u20AC)`}</SelectItem>
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
              <p className="text-sm text-muted-foreground pb-2">Korting: -{formatCurrency(discountAmount)}</p>
            )}
          </div>

          {/* Totals — incl. BTW display */}
          <div className="rounded-md bg-muted p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span>Subtotaal excl. BTW</span>
              <span>{formatCurrency(exclBtw)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Korting {discountType === 'percentage' ? `(${toNumber(discountValue, 0)}%)` : ''}</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>BTW ({btwPercentage}%)</span>
              <span>{formatCurrency(btwAmount)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-bold text-base">
              <span>Totaal incl. BTW</span>
              <span>{formatCurrency(afterDiscount)}</span>
            </div>
          </div>

          {/* Collapsible conditions */}
          <div className="rounded-md border overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between p-3 text-sm font-medium hover:bg-muted transition-colors"
              onClick={() => setConditionsOpen((prev) => !prev)}
            >
              <span>Offertevoorwaarden</span>
              {conditionsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {conditionsOpen && (
              <div className="border-t p-3 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Garantie (jaren)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={quoteDefaults.garantie_jaren}
                      onChange={(e) => setQuoteDefaults((prev) => ({ ...prev, garantie_jaren: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Doorlooptijd</Label>
                    <Input
                      value={quoteDefaults.doorlooptijd}
                      placeholder="bijv. 3 werkdagen"
                      onChange={(e) => setQuoteDefaults((prev) => ({ ...prev, doorlooptijd: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Geldigheid offerte (dagen)</Label>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={quoteDefaults.geldigheid_dagen}
                      onChange={(e) => setQuoteDefaults((prev) => ({ ...prev, geldigheid_dagen: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Betalingsvoorwaarden</Label>
                  <Textarea
                    rows={2}
                    value={quoteDefaults.betaling}
                    onChange={(e) => setQuoteDefaults((prev) => ({ ...prev, betaling: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Inleidende tekst offerte</Label>
                  <Textarea
                    rows={3}
                    placeholder="Laat leeg voor automatische tekst op basis van oplossing"
                    value={quoteDefaults.offerte_inleiding}
                    onChange={(e) => setQuoteDefaults((prev) => ({ ...prev, offerte_inleiding: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Laat leeg voor automatische tekst op basis van gekozen oplossing.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Actions (sticky bottom) */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-background border-t px-6 py-3 flex items-center justify-end gap-2 z-30">
        <Sheet
          open={pdfPreviewOpen}
          onOpenChange={(open) => {
            setPdfPreviewOpen(open);
            if (open) generateDraftPreview();
            else if (previewPdfUrl) {
              URL.revokeObjectURL(previewPdfUrl);
              setPreviewPdfUrl('');
            }
          }}
        >
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Eye className="h-4 w-4" />
              Bekijk PDF
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:!max-w-2xl lg:!max-w-4xl p-0 flex flex-col h-full">
            <SheetHeader className="p-4 border-b shrink-0">
              <SheetTitle>Offerte preview (concept)</SheetTitle>
            </SheetHeader>
            <div className="flex-1 min-h-0">
              {generatingPreview ? (
                <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  PDF genereren...
                </div>
              ) : previewPdfUrl ? (
                <iframe src={previewPdfUrl} className="w-full h-full border-0" title="Offerte PDF" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                  Preview niet beschikbaar
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>

        <Button
          onClick={handleSave}
          disabled={saving || sending}
          variant="outline"
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Opslaan...' : 'Opslaan als concept'}
        </Button>

        <Button
          onClick={handleSend}
          disabled={saving || sending || lineItems.length === 0}
          className="gap-2"
          style={{ backgroundColor: '#355b23' }}
        >
          <Send className="h-4 w-4" />
          {sending ? 'Verzenden...' : 'Verstuur offerte'}
        </Button>
      </div>
    </div>
  );
}
