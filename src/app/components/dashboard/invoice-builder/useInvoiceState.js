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

function inferGuaranteeSettings(items = [], fallbackYears = 5) {
  const values = items
    .map(getLineGuaranteeYears)
    .filter((value) => value != null);
  const hasPerLineScope = items.some((item) => (item?.garantie_scope ?? item?.guarantee_scope) === 'per_line');
  const hasGlobalScope = items.some((item) => (item?.garantie_scope ?? item?.guarantee_scope) === 'global');
  const uniqueValues = new Set(values.map((value) => String(value)));

  return {
    perLine: hasPerLineScope || (!hasGlobalScope && uniqueValues.size > 1),
    globalYears: values[0] ?? fallbackYears,
  };
}

function makeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function useInvoiceState() {
  // --- Line items ---
  const [lineItems, setLineItems] = useState([]);

  // --- Customer ---
  const [customer, setCustomerState] = useState({
    lead_id: null,
    name: '',
    email: '',
    phone: '',
    straat: '',
    postcode: '',
    plaatsnaam: '',
  });

  // --- Discount ---
  const [discount, setDiscountState] = useState({ type: 'percentage', value: 0 });

  // --- Notes ---
  const [notes, setNotes] = useState('');

  // --- Betaling ---
  const [betaling, setBetaling] = useState('Binnen 14 dagen na factuurdatum');

  // --- Garantie ---
  const [guaranteePerLine, setGuaranteePerLineState] = useState(false);
  const [globalGuaranteeYears, setGlobalGuaranteeYears] = useState(5);

  // --- Dates ---
  const [dueDate, setDueDate] = useState(null);
  const [issueDate, setIssueDate] = useState(todayISO());

  // --- Editing existing invoice ---
  const [invoiceId, setInvoiceId] = useState(null);

  // --- Linked quote ---
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
        garantie_jaren: line.garantie_jaren ?? globalGuaranteeYears,
      },
    ]);
  }, [globalGuaranteeYears]);

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

  const setGuaranteePerLine = useCallback((enabled) => {
    const next = Boolean(enabled);
    setGuaranteePerLineState(next);
    if (next) {
      setLineItems((prev) => prev.map((item) => ({
        ...item,
        garantie_jaren: getLineGuaranteeYears(item) ?? globalGuaranteeYears,
      })));
    }
  }, [globalGuaranteeYears]);

  // --- Load existing invoice for editing ---
  const loadInvoice = useCallback((inv) => {
    if (!inv) return;
    const sourceLineItems = inv.line_items || [];
    const guaranteeSettings = inferGuaranteeSettings(sourceLineItems, 5);
    setInvoiceId(inv.id);
    setQuoteId(inv.quote_id || null);
    setCustomerState({
      lead_id: inv.lead_id || null,
      name: inv.customer_name || '',
      email: inv.customer_email || '',
      phone: inv.customer_phone || '',
      straat: inv.customer_straat || '',
      postcode: inv.customer_postcode || '',
      plaatsnaam: inv.customer_plaatsnaam || '',
    });
    setLineItems(
      sourceLineItems.map((item) => ({
        id: makeId(),
        description: item.description || '',
        quantity: toNumber(item.quantity, 1),
        unit: item.unit || 'stuk',
        unit_price: toMoney(item.unit_price),
        garantie_jaren: getLineGuaranteeYears(item) ?? guaranteeSettings.globalYears,
      }))
    );
    setGuaranteePerLineState(guaranteeSettings.perLine);
    setGlobalGuaranteeYears(guaranteeSettings.globalYears);
    setNotes(inv.notes || '');
    setBetaling(inv.betaling || 'Binnen 14 dagen na factuurdatum');
    setDueDate(inv.due_date || null);
    setIssueDate(inv.issue_date || todayISO());
    if (inv.discount_type && inv.discount_value > 0) {
      setDiscountState({
        type: normalizeDiscountType(inv.discount_type) || 'percentage',
        value: toNumber(inv.discount_value, 0),
      });
    }
  }, []);

  // --- Load from an approved quote ---
  const loadFromQuote = useCallback((quote) => {
    if (!quote) return;
    const sourceLineItems = quote.line_items || [];
    const quoteGuaranteeYears = toNumber(quote.garantie_jaren, 5);
    const guaranteeSettings = inferGuaranteeSettings(sourceLineItems, quoteGuaranteeYears);
    setQuoteId(quote.id);
    setCustomerState({
      lead_id: quote.lead_id || null,
      name: quote.customer_name || '',
      email: quote.customer_email || '',
      phone: quote.customer_phone || '',
      straat: quote.customer_straat || '',
      postcode: quote.customer_postcode || '',
      plaatsnaam: quote.customer_plaatsnaam || '',
    });
    setLineItems(
      sourceLineItems.map((item) => ({
        id: makeId(),
        description: item.description || '',
        quantity: toNumber(item.quantity, 1),
        unit: item.unit || 'stuk',
        unit_price: toMoney(item.unit_price),
        garantie_jaren: getLineGuaranteeYears(item) ?? quoteGuaranteeYears,
      }))
    );
    setGuaranteePerLineState(guaranteeSettings.perLine);
    setGlobalGuaranteeYears(quoteGuaranteeYears);
    setNotes(quote.notes || '');
    setIssueDate(todayISO());
    if (quote.discount_type && quote.discount_value > 0) {
      setDiscountState({
        type: normalizeDiscountType(quote.discount_type) || 'percentage',
        value: toNumber(quote.discount_value, 0),
      });
    }
  }, []);

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
  const btwPercentage = 21;
  const exclBtw = toMoney(afterDiscount / 1.21);
  const btwAmount = toMoney(afterDiscount - exclBtw);

  // --- Build payload for API ---
  const buildPayload = useCallback(() => {
    const normalizedLineItems = lineItems.map((item) => ({
      description: item.description,
      quantity: toNumber(item.quantity, 0),
      unit: item.unit,
      unit_price: toMoney(item.unit_price),
      total: toMoney(toNumber(item.quantity) * toNumber(item.unit_price)),
      garantie_jaren: guaranteePerLine
        ? getLineGuaranteeYears(item) ?? globalGuaranteeYears
        : globalGuaranteeYears,
      garantie_scope: guaranteePerLine ? 'per_line' : 'global',
    }));

    return {
      invoice_id: invoiceId || undefined,
      quote_id: quoteId || null,
      lead_id: customer.lead_id,
      customer_name: customer.name,
      customer_email: customer.email || null,
      customer_phone: customer.phone || null,
      customer_straat: customer.straat || null,
      customer_postcode: customer.postcode || null,
      customer_plaatsnaam: customer.plaatsnaam || null,
      notes: notes || null,
      betaling,
      due_date: dueDate || null,
      issue_date: issueDate,
      line_items: normalizedLineItems,
      subtotal_incl: toMoney(subtotalIncl),
      discount_type: discountAmount > 0 ? discount.type : null,
      discount_value: discountAmount > 0 ? toNumber(discount.value, 0) : null,
      discount_amount: discountAmount > 0 ? discountAmount : null,
      btw_percentage: btwPercentage,
      btw_amount: btwAmount,
      total_incl: toMoney(afterDiscount),
      excl_btw: exclBtw,
    };
  }, [
    lineItems, customer, notes, betaling, dueDate, issueDate,
    invoiceId, quoteId, subtotalIncl, discount, discountAmount,
    btwPercentage, btwAmount, afterDiscount, exclBtw, guaranteePerLine, globalGuaranteeYears,
  ]);

  return {
    // State
    lineItems,
    customer,
    discount,
    notes,
    betaling,
    guaranteePerLine,
    globalGuaranteeYears,
    dueDate,
    issueDate,
    invoiceId,
    quoteId,

    // Setters
    setNotes,
    setBetaling,
    setGuaranteePerLine,
    setGlobalGuaranteeYears,
    setDueDate,
    setIssueDate,

    // Actions
    addLine,
    updateLine,
    removeLine,
    setCustomer,
    setDiscount,
    loadInvoice,
    loadFromQuote,
    buildPayload,

    // Computed
    subtotalIncl,
    discountAmount,
    afterDiscount,
    exclBtw,
    btwAmount,
    btwPercentage,
  };
}
