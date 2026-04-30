'use client';

import { useState, useMemo, useCallback } from 'react';
import { normalizeDiscountType } from '@/lib/utils/quote-discounts';

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toMoney(value) {
  return Math.round(toNumber(value, 0) * 100) / 100;
}

function getLineGuaranteeYears(item) {
  const parsed = Number(item?.garantie_jaren ?? item?.guarantee_years);
  return Number.isFinite(parsed) ? parsed : null;
}

function hasPerLineGuarantee(items = []) {
  return items.some((item) => {
    const scope = item?.garantie_scope ?? item?.guarantee_scope;
    return scope === 'per_line' || (scope !== 'global' && getLineGuaranteeYears(item) != null);
  });
}

function normalizeVoorwaarden(terms = [], guaranteePerLine, guaranteeYears) {
  const guaranteeText = guaranteePerLine
    ? 'Garantie: per regel zoals vermeld in de prijsopgave.'
    : `Garantie: ${toNumber(guaranteeYears, 5)} jaar op waterdichtheid.`;

  return (terms || []).map((term) => {
    if (/^\s*Garantie\s*:/i.test(term || '')) {
      return guaranteeText;
    }
    return term;
  });
}

function makeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
}

const DEFAULT_DEFAULTS = {
  btw_percentage: 21,
  garantie_jaren: 5,
  doorlooptijd: '3 werkdagen',
  betaling: '40% op de eerste werkdag bij aanvang, restant binnen 2 weken na oplevering',
  geldigheid_dagen: 30,
  offerte_inleiding: null,
};

export function useQuoteState(initialLead = null) {
  // --- Line items ---
  const [lineItems, setLineItems] = useState([]);

  // --- Customer ---
  const [customer, setCustomerState] = useState({
    lead_id: initialLead?.id || null,
    name: initialLead?.name || '',
    email: initialLead?.email || '',
    phone: initialLead?.phone || '',
    straat: initialLead?.straat || '',
    postcode: initialLead?.postcode || '',
    plaatsnaam: initialLead?.plaatsnaam || '',
  });

  // --- Discount ---
  const [discount, setDiscountState] = useState({ type: 'percentage', value: 0 });

  // --- Notes ---
  const DEFAULT_NOTES = [
    'Elektra en water wordt door u voorzien tijdens het werk',
    'Ruimte moet vrij zijn op dagen van uitvoering',
    'Gevels schoonspuiten niet in genoemde prijzen',
    'Stuken en verven niet in genoemde prijzen',
    'Kiesol heeft tot 3 jaar nodig om zijn werk te doen',
    'Meer/minderwerk wordt naderhand verrekend',
    'Plinten kunnen worden weggehaald maar niet terug geplaatst',
    'U regelt zelf de communicatie met buren',
    '1e jaar behandeling kelder niet te verven',
    'Geaard stopcontact niet in offerte',
    'Afdichting is handwerk; wordt met de spaan aangebracht',
    'Trap wordt even weggehaald of opzij gezet om zijkant te behandelen',
    'Ervan uitgaande dat aan constructie van de kelder niks mis is',
  ].join('\n');
  const [notes, setNotes] = useState(DEFAULT_NOTES);

  // --- Diagnose ---
  const [diagnose, setDiagnose] = useState([]);

  // --- Oplossingen (for PDF "Betreft" section) ---
  const [oplossingen, setOplossingen] = useState([]);

  // --- Diagnose details (free text) ---
  const [diagnoseDetails, setDiagnoseDetails] = useState('');

  // --- Oppervlakte (m²) ---
  const [oppervlakte, setOppervlakte] = useState(null);

  // --- Quote defaults ---
  const [defaults, setDefaults] = useState(DEFAULT_DEFAULTS);
  const [guaranteePerLine, setGuaranteePerLineState] = useState(false);

  // --- Voorwaarden (editable terms for PDF) ---
  const DEFAULT_VOORWAARDEN = [
    'Prijzen zijn vast en all-inclusive.',
    'Geen meerwerk zonder voorafgaand overleg.',
    `Betaling: ${DEFAULT_DEFAULTS.betaling}.`,
    'Start werkzaamheden in overleg, doorgaans binnen 2-4 weken.',
    `Garantie: ${DEFAULT_DEFAULTS.garantie_jaren} jaar op waterdichtheid.`,
  ];
  const [voorwaarden, setVoorwaarden] = useState(DEFAULT_VOORWAARDEN);

  // --- Label ---
  const [label, setLabel] = useState('');

  // --- Photos (from lead) ---
  const [photos, setPhotos] = useState(initialLead?.photos || []);

  // --- Editing existing quote ---
  const [quoteId, setQuoteId] = useState(null);

  // --- Actions ---

  const addLine = useCallback((line) => {
    setLineItems((prev) => [
      ...prev,
      {
        id: makeId(),
        description: line.description,
        quantity: toNumber(line.quantity, 1),
        unit: line.unit || 'stuk',
        unit_price: toMoney(line.unit_price),
        garantie_jaren: line.garantie_jaren ?? (guaranteePerLine ? toNumber(defaults.garantie_jaren, 5) : null),
        tier_applied: line.tier_applied || null,
        minimum_applied: line.minimum_applied || false,
      },
    ]);
  }, [defaults.garantie_jaren, guaranteePerLine]);

  const addLines = useCallback((lines) => {
    const newItems = lines.map((line) => ({
      id: makeId(),
      description: line.description,
      quantity: toNumber(line.quantity, 1),
      unit: line.unit || 'stuk',
      unit_price: toMoney(line.unit_price),
      garantie_jaren: line.garantie_jaren ?? (guaranteePerLine ? toNumber(defaults.garantie_jaren, 5) : null),
      tier_applied: line.tier_applied || null,
      minimum_applied: line.minimum_applied || false,
    }));
    setLineItems((prev) => [...prev, ...newItems]);
  }, [defaults.garantie_jaren, guaranteePerLine]);

  const updateLine = useCallback((index, updates) => {
    setLineItems((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      const updated = [...prev];
      const item = { ...updated[index] };

      if (updates.quantity != null) item.quantity = toNumber(updates.quantity, item.quantity);
      if (updates.unit_price != null) item.unit_price = toMoney(updates.unit_price);
      if (updates.description != null) item.description = updates.description;
      if (updates.unit != null) item.unit = updates.unit;
      if (Object.prototype.hasOwnProperty.call(updates, 'garantie_jaren')) {
        item.garantie_jaren = updates.garantie_jaren === '' || updates.garantie_jaren == null
          ? null
          : toNumber(updates.garantie_jaren, item.garantie_jaren);
      }

      updated[index] = item;
      return updated;
    });
  }, []);

  const removeLine = useCallback((index) => {
    setLineItems((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const setCustomer = useCallback((updates) => {
    setCustomerState((prev) => ({ ...prev, ...updates }));
  }, []);

  const setDiscount = useCallback((discountObj) => {
    setDiscountState({
      type: normalizeDiscountType(discountObj.type) || 'percentage',
      value: toNumber(discountObj.value, 0),
    });
  }, []);

  const addNote = useCallback((note) => {
    setNotes((prev) => {
      if (!prev) return note;
      return prev + '\n' + note;
    });
  }, []);

  const setGuaranteePerLine = useCallback((enabled) => {
    const next = Boolean(enabled);
    setGuaranteePerLineState(next);
    if (next) {
      setLineItems((prev) => prev.map((item) => ({
        ...item,
        garantie_jaren: getLineGuaranteeYears(item) ?? toNumber(defaults.garantie_jaren, 5),
      })));
    }
  }, [defaults.garantie_jaren]);

  // --- Load existing quote for editing ---
  const loadQuote = useCallback((q) => {
    if (!q) return;
    const sourceLineItems = q.line_items || [];
    setQuoteId(q.id);
    setCustomerState({
      lead_id: q.lead_id || null,
      name: q.customer_name || '',
      email: q.customer_email || '',
      phone: q.customer_phone || '',
      straat: q.customer_straat || '',
      postcode: q.customer_postcode || '',
      plaatsnaam: q.customer_plaatsnaam || '',
    });
    setLineItems(
      sourceLineItems.map((item) => ({
        id: makeId(),
        description: item.description || '',
        quantity: toNumber(item.quantity, 1),
        unit: item.unit || 'stuk',
        unit_price: toMoney(item.unit_price),
        garantie_jaren: getLineGuaranteeYears(item),
        tier_applied: item.tier_applied || null,
        minimum_applied: item.minimum_applied || false,
      }))
    );
    setGuaranteePerLineState(hasPerLineGuarantee(sourceLineItems));
    setDiagnose(q.diagnose || []);
    setOplossingen(q.oplossingen || []);
    setDiagnoseDetails(q.diagnose_details || '');
    setOppervlakte(q.oppervlakte_m2 || null);
    setNotes(q.notes || '');
    setLabel(q.label || '');
    setPhotos(q.photos || []);
    if (Array.isArray(q.voorwaarden) && q.voorwaarden.length > 0) {
      setVoorwaarden(q.voorwaarden);
    }
    if (q.discount_type && q.discount_value > 0) {
      setDiscountState({
        type: normalizeDiscountType(q.discount_type) || 'percentage',
        value: toNumber(q.discount_value, 0),
      });
    }
    setDefaults((prev) => ({
      ...prev,
      btw_percentage: q.btw_percentage ?? prev.btw_percentage,
      garantie_jaren: q.garantie_jaren ?? prev.garantie_jaren,
      doorlooptijd: q.doorlooptijd || prev.doorlooptijd,
      betaling: q.betaling || prev.betaling,
      geldigheid_dagen: q.geldigheid_dagen ?? prev.geldigheid_dagen,
      offerte_inleiding: typeof q.offerte_inleiding === 'string' ? q.offerte_inleiding : prev.offerte_inleiding,
    }));
  }, []);

  // --- Dispatch tool results from AI ---
  const dispatchToolResult = useCallback((result) => {
    if (!result || !result.action) return;

    switch (result.action) {
      case 'add_lines':
        if (result.lines?.length) {
          addLines(result.lines);
          if (result.lines.some((line) => getLineGuaranteeYears(line) != null)) {
            setGuaranteePerLine(true);
          }
        }
        break;

      case 'update_line':
        if (result.line_index != null) {
          const updates = {};
          if (result.new_quantity != null) updates.quantity = result.new_quantity;
          if (result.garantie_jaren != null) updates.garantie_jaren = result.garantie_jaren;
          if (Object.keys(updates).length > 0) {
            updateLine(result.line_index, updates);
          }
          if (result.garantie_jaren != null) {
            setGuaranteePerLine(true);
          }
        }
        break;

      case 'remove_line':
        if (result.line_index != null) {
          removeLine(result.line_index);
        }
        break;

      case 'set_customer':
        if (result.customer) {
          setCustomer(result.customer);
        }
        break;

      case 'set_discount':
        if (result.discount) {
          setDiscount(result.discount);
        }
        break;

      case 'add_note':
        if (result.note) {
          addNote(result.note);
        }
        break;

      case 'set_quote_details':
        if (result.oplossingen) setOplossingen(result.oplossingen);
        if (result.diagnose) setDiagnose(result.diagnose);
        if (result.diagnose_details) setDiagnoseDetails(result.diagnose_details);
        if (result.oppervlakte_m2 != null) setOppervlakte(result.oppervlakte_m2);
        if (result.doorlooptijd || result.garantie_jaren || Object.prototype.hasOwnProperty.call(result, 'offerte_inleiding') || result.betaling) {
          setDefaults((prev) => ({
            ...prev,
            ...(result.doorlooptijd ? { doorlooptijd: result.doorlooptijd } : {}),
            ...(result.garantie_jaren ? { garantie_jaren: result.garantie_jaren } : {}),
            ...(Object.prototype.hasOwnProperty.call(result, 'offerte_inleiding') ? { offerte_inleiding: result.offerte_inleiding } : {}),
            ...(result.betaling ? { betaling: result.betaling } : {}),
          }));
        }
        break;

      // area_calculated and suggestions are informational — no state change needed
      case 'area_calculated':
      case 'suggestions':
      case 'error':
        break;

      default:
        break;
    }
  }, [addLines, updateLine, removeLine, setCustomer, setDiscount, addNote, setGuaranteePerLine, setOplossingen, setDiagnose, setDiagnoseDetails, setOppervlakte, setDefaults]);

  // --- Computed totals ---
  const subtotalIncl = useMemo(
    () => toMoney(lineItems.reduce((sum, item) => sum + toMoney(toNumber(item.quantity) * toNumber(item.unit_price)), 0)),
    [lineItems]
  );

  const discountAmount = useMemo(() => {
    const val = toNumber(discount.value, 0);
    if (val <= 0) return 0;
    if (discount.type === 'percentage') return toMoney((subtotalIncl * Math.min(val, 100)) / 100);
    return toMoney(Math.min(val, subtotalIncl));
  }, [subtotalIncl, discount]);

  const afterDiscount = toMoney(subtotalIncl - discountAmount);
  const btwPercentage = toNumber(defaults.btw_percentage, 21);
  const exclBtw = toMoney(afterDiscount / (1 + btwPercentage / 100));
  const btwAmount = toMoney(afterDiscount - exclBtw);

  // --- Snapshot for system prompt injection ---
  const getSnapshot = useCallback(() => ({
    lineItems: lineItems.map((item, i) => ({
      index: i + 1,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unit_price,
      garantie_jaren: guaranteePerLine ? getLineGuaranteeYears(item) ?? toNumber(defaults.garantie_jaren, 5) : null,
      line_total: toMoney(item.quantity * item.unit_price),
    })),
    customer: customer.name ? { name: customer.name, plaatsnaam: customer.plaatsnaam } : null,
    discount: discount.value > 0 ? discount : null,
    notes: notes || null,
    oplossingen: oplossingen.length > 0 ? oplossingen : null,
    diagnoseDetails: diagnoseDetails || null,
    oppervlakte: oppervlakte || null,
    doorlooptijd: defaults.doorlooptijd,
    garantie_jaren: defaults.garantie_jaren,
    garantie_per_regel: guaranteePerLine,
    subtotalIncl,
  }), [lineItems, customer, discount, notes, oplossingen, diagnoseDetails, oppervlakte, defaults, guaranteePerLine, subtotalIncl]);

  // --- Build payload matching QuoteGenerator format for API compatibility ---
  const buildPayload = useCallback(() => {
    const normalizedLineItems = lineItems.map((item) => ({
      description: item.description,
      quantity: toNumber(item.quantity, 0),
      unit: item.unit,
      unit_price: toMoney(item.unit_price),
      total: toMoney(toNumber(item.quantity) * toNumber(item.unit_price)),
      ...(guaranteePerLine
        ? {
            garantie_jaren: getLineGuaranteeYears(item) ?? toNumber(defaults.garantie_jaren, 5),
            garantie_scope: 'per_line',
          }
        : {}),
    }));
    const normalizedVoorwaarden = normalizeVoorwaarden(
      voorwaarden,
      guaranteePerLine,
      defaults.garantie_jaren
    );

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
      kelder_sub_areas: null,
      oppervlakte_m2: oppervlakte || null,
      injectie_depth: null,
      notes: notes || null,
      photos,
      line_items: normalizedLineItems,
      subtotal_incl: toMoney(subtotalIncl),
      discount_type: discountAmount > 0 ? discount.type : null,
      discount_value: discountAmount > 0 ? toNumber(discount.value, 0) : null,
      discount_amount: discountAmount > 0 ? discountAmount : null,
      btw_percentage: btwPercentage,
      btw_amount: btwAmount,
      total_incl: toMoney(afterDiscount),
      garantie_jaren: toNumber(defaults.garantie_jaren, 5),
      doorlooptijd: defaults.doorlooptijd || '3 werkdagen',
      betaling: defaults.betaling,
      geldigheid_dagen: toNumber(defaults.geldigheid_dagen, 30),
      offerte_inleiding: defaults.offerte_inleiding,
      voorwaarden: normalizedVoorwaarden.length > 0 ? normalizedVoorwaarden : null,
      label: label || null,
    };
  }, [
    lineItems, customer, diagnose, diagnoseDetails, oplossingen, oppervlakte,
    notes, photos, subtotalIncl, discount, discountAmount, btwPercentage,
    btwAmount, afterDiscount, defaults, guaranteePerLine, label, voorwaarden,
  ]);

  return {
    // State
    lineItems,
    customer,
    discount,
    notes,
    diagnose,
    defaults,
    guaranteePerLine,
    label,
    photos,
    oplossingen,
    diagnoseDetails,
    oppervlakte,
    voorwaarden,
    quoteId,

    // Setters
    setLineItems,
    setCustomer,
    setDiscount,
    setNotes,
    setDiagnose,
    setDefaults,
    setGuaranteePerLine,
    setLabel,
    setPhotos,
    setOplossingen,
    setDiagnoseDetails,
    setOppervlakte,
    setVoorwaarden,
    setQuoteId,

    // Actions
    addLine,
    addLines,
    updateLine,
    removeLine,
    addNote,
    loadQuote,
    dispatchToolResult,

    // Computed
    subtotalIncl,
    discountAmount,
    afterDiscount,
    exclBtw,
    btwAmount,
    btwPercentage,

    // Utilities
    getSnapshot,
    buildPayload,
  };
}
