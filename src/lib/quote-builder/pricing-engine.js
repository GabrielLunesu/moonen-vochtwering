/**
 * Pricing engine for the conversational quote builder.
 * Wraps existing staffel pricing and treatment templates from the codebase.
 * All money math is deterministic — the AI never invents prices.
 */

import { getStaffelPrijs, getStaffelLabel, applyMinimum } from '@/lib/utils/pricing';
import {
  DEFAULT_LINE_ITEM_TEMPLATES,
  EXTRA_LINE_ITEMS,
  OPLOSSING_OPTIONS,
  KELDER_SUB_AREAS,
} from '@/lib/utils/inspection-constants';

// --- Treatment code mapping ---
// Maps flat treatment codes to their template sources and descriptions

const TREATMENT_MAP = {
  // Kelderafdichting sub-areas
  kelderafdichting_kimnaad: {
    templateKey: 'kelderafdichting_kimnaad',
    label: 'Kimnaad afdichten',
    category: 'kelderafdichting',
  },
  kelderafdichting_muurvlak: {
    templateKey: 'kelderafdichting_muurvlak',
    label: 'Muurvlakken waterdicht (compleet pakket)',
    category: 'kelderafdichting',
    isBundle: true,
  },
  kelderafdichting_pilaar: {
    templateKey: 'kelderafdichting_pilaar',
    label: 'Pilaar waterdicht afwerken',
    category: 'kelderafdichting',
  },
  kelderafdichting_vloer: {
    templateKey: 'kelderafdichting_vloer',
    label: 'Waterdichte keldervloer',
    category: 'kelderafdichting',
  },
  kelderafdichting_afwerking: {
    templateKey: 'kelderafdichting_afwerking',
    label: 'Afwerking stucwerk',
    category: 'kelderafdichting',
  },

  // Muurinjectie — price depends on wall depth
  muurinjectie_10cm: {
    templateKey: 'muurinjectie',
    label: 'Muurinjectie (Kiesol C) — 10 cm',
    category: 'injectie',
    depth: 10,
    overridePrice: 80,
  },
  muurinjectie_20cm: {
    templateKey: 'muurinjectie',
    label: 'Muurinjectie (Kiesol C) — 20 cm',
    category: 'injectie',
    depth: 20,
    overridePrice: 90,
  },
  muurinjectie_30cm: {
    templateKey: 'muurinjectie',
    label: 'Muurinjectie (Kiesol C) — 30 cm',
    category: 'injectie',
    depth: 30,
    overridePrice: 100,
  },

  // Vochtbestendige pleister (same steps as muurvlak)
  vochtbestendige_pleister: {
    templateKey: 'vochtbestendige_pleister',
    label: 'Vochtbestendige pleister (compleet pakket)',
    category: 'pleister',
    isBundle: true,
  },

  // Gevelimpregnatie
  gevelimpregnatie: {
    templateKey: 'gevelimpregnatie',
    label: 'Gevelimpregnatie (Funcosil FC)',
    category: 'gevel',
  },

  // Drainage
  drainage_buis: {
    templateKey: 'drainage',
    label: 'Drainage aanleggen',
    category: 'drainage',
    templateIndex: 0,
  },
  drainage_grondwerk: {
    templateKey: 'drainage',
    label: 'Grondwerk en afvoer (drainage)',
    category: 'drainage',
    templateIndex: 1,
  },

  // Ventilatie
  ventilatie_koker: {
    templateKey: 'ventilatie',
    label: 'Renovatiekoker bijmaken',
    category: 'ventilatie',
  },

  // Extras
  leidingdoorvoer: { extraIndex: 0, label: 'Leidingdoorvoer afdichten (Stopaq)', category: 'extra' },
  schimmel_doden: { extraIndex: 1, label: 'Schimmel doden', category: 'extra' },
  gevel_reinigen: { extraIndex: 2, label: 'Gevel chemisch reinigen (Clean FP)', category: 'extra' },
  spouwrooster: { extraIndex: 3, label: 'Spouwrooster plaatsen', category: 'extra' },
  air70_ventilatie: { extraIndex: 4, label: 'AIR70 ventilatiesysteem montage', category: 'extra' },
  frezen_verflaag: { extraIndex: 5, label: 'Frezen verflaag', category: 'extra' },
  mb2k_kiesol: { extraIndex: 6, label: 'MB2K + Kiesol MB (instabiele vloer)', category: 'extra' },
  kim_aanhechten: { extraIndex: 7, label: 'Kim aanhechten aan bestaande vloer', category: 'extra' },
  trap_demonteren: { extraIndex: 8, label: 'Trap demonteren en terugplaatsen', category: 'extra' },
  egaliseren_vloer: { extraIndex: 9, label: 'Egaliseren vloer 10-20mm', category: 'extra' },
};

/**
 * Get all treatment codes as an array.
 */
export function getAllTreatmentCodes() {
  return Object.keys(TREATMENT_MAP);
}

/**
 * Get info about a treatment code (without pricing).
 */
export function getTreatmentInfo(code) {
  const entry = TREATMENT_MAP[code];
  if (!entry) return null;

  // Get the template(s) to determine unit info
  if (entry.extraIndex != null) {
    const extra = EXTRA_LINE_ITEMS[entry.extraIndex];
    if (!extra) return null;
    return {
      code,
      label: entry.label,
      category: entry.category,
      unit: extra.unit,
      description: extra.description,
      hasStaffels: Boolean(extra.staffels?.length),
    };
  }

  const templates = DEFAULT_LINE_ITEM_TEMPLATES[entry.templateKey] || [];
  if (entry.templateIndex != null) {
    const tpl = templates[entry.templateIndex];
    if (!tpl) return null;
    return {
      code,
      label: entry.label,
      category: entry.category,
      unit: tpl.unit,
      description: tpl.description,
      hasStaffels: Boolean(tpl.staffels?.length),
      isBundle: false,
    };
  }

  // Bundle treatments return multiple lines
  if (entry.isBundle) {
    return {
      code,
      label: entry.label,
      category: entry.category,
      unit: templates[0]?.unit || 'm²',
      isBundle: true,
      lineCount: templates.length,
      lines: templates.map((t) => ({ description: t.description, unit: t.unit })),
    };
  }

  // Single-template treatment
  const tpl = templates[0];
  if (!tpl) return null;
  return {
    code,
    label: entry.label,
    category: entry.category,
    unit: entry.overridePrice ? tpl.unit : tpl.unit,
    description: tpl.description,
    hasStaffels: Boolean(tpl.staffels?.length),
    hasMinimum: Boolean(tpl.minimum),
  };
}

/**
 * Calculate price for a treatment code with a given quantity.
 * Returns an array of line items (bundles produce multiple).
 *
 * @param {string} code - Treatment code from TREATMENT_MAP
 * @param {number} quantity - Quantity (m², m¹, stuk, etc.)
 * @returns {Array<{ description, unit, unit_price, quantity, line_total, tier_applied, minimum_applied }>}
 */
export function calculatePrice(code, quantity) {
  const entry = TREATMENT_MAP[code];
  if (!entry) return [];

  const qty = Math.max(0, Number(quantity) || 0);

  // Extra line items
  if (entry.extraIndex != null) {
    const extra = EXTRA_LINE_ITEMS[entry.extraIndex];
    if (!extra) return [];

    let unitPrice = extra.unit_price;
    let tierApplied = null;
    let minimumApplied = false;

    if (extra.staffels?.length) {
      unitPrice = getStaffelPrijs(extra.unit_price, extra.staffels, qty);
      tierApplied = getStaffelLabel(extra.staffels, qty);
    }

    const lineTotal = Math.round(unitPrice * qty * 100) / 100;

    return [{
      description: extra.description,
      unit: extra.unit,
      unit_price: unitPrice,
      quantity: qty,
      line_total: lineTotal,
      tier_applied: tierApplied,
      minimum_applied: minimumApplied,
    }];
  }

  const templates = DEFAULT_LINE_ITEM_TEMPLATES[entry.templateKey] || [];

  // Single item from a multi-item template (e.g. drainage_buis)
  if (entry.templateIndex != null) {
    const tpl = templates[entry.templateIndex];
    if (!tpl) return [];
    return [computeLine(tpl, qty, entry.overridePrice)];
  }

  // Override price (injection depths)
  if (entry.overridePrice && templates.length === 1) {
    const tpl = templates[0];
    return [computeLine({ ...tpl, unit_price: entry.overridePrice }, qty)];
  }

  // Bundle — all lines in the template get the same quantity
  if (entry.isBundle) {
    return templates.map((tpl) => computeLine(tpl, qty));
  }

  // Single template item
  if (templates.length === 1) {
    return [computeLine(templates[0], qty)];
  }

  // Multiple templates but not a bundle — return all
  return templates.map((tpl) => computeLine(tpl, qty));
}

function computeLine(tpl, qty, overridePrice) {
  let unitPrice = overridePrice ?? tpl.unit_price;
  let tierApplied = null;
  let minimumApplied = false;

  if (tpl.staffels?.length) {
    unitPrice = getStaffelPrijs(overridePrice ?? tpl.unit_price, tpl.staffels, qty);
    tierApplied = getStaffelLabel(tpl.staffels, qty);
  }

  if (tpl.minimum) {
    const result = applyMinimum(unitPrice, qty, tpl.minimum);
    unitPrice = result.price;
    minimumApplied = result.minimumApplied;
  }

  const lineTotal = Math.round(unitPrice * qty * 100) / 100;

  return {
    description: tpl.description,
    unit: tpl.unit,
    unit_price: unitPrice,
    quantity: qty,
    line_total: lineTotal,
    tier_applied: tierApplied,
    minimum_applied: minimumApplied,
  };
}

/**
 * Suggest treatment codes based on a problem type.
 */
export function suggestTreatmentsForProblem(problem) {
  const p = (problem || '').toLowerCase();
  const suggestions = [];

  if (p.includes('opstijgend') || p.includes('capillair') || p.includes('injectie')) {
    suggestions.push('muurinjectie_30cm', 'vochtbestendige_pleister');
  }
  if (p.includes('kelder') || p.includes('doorslag') || p.includes('lekkage')) {
    suggestions.push(
      'kelderafdichting_muurvlak',
      'kelderafdichting_kimnaad',
      'kelderafdichting_vloer',
      'kelderafdichting_afwerking'
    );
  }
  if (p.includes('schimmel')) {
    suggestions.push('schimmel_doden');
  }
  if (p.includes('gevel') || p.includes('doorslag') || p.includes('buitenmuur')) {
    suggestions.push('gevelimpregnatie');
  }
  if (p.includes('drainage') || p.includes('grondwater')) {
    suggestions.push('drainage_buis', 'drainage_grondwerk');
  }
  if (p.includes('ventilatie') || p.includes('condensatie')) {
    suggestions.push('ventilatie_koker', 'air70_ventilatie');
  }
  if (p.includes('vloer') && !p.includes('kelder')) {
    suggestions.push('kelderafdichting_vloer');
  }
  if (p.includes('pleister') || p.includes('stuc')) {
    suggestions.push('vochtbestendige_pleister');
  }

  // Deduplicate
  return [...new Set(suggestions)];
}

/**
 * Calculate wall surface area from dimensions.
 * Common helper the AI uses when a user says "kelder 4x5, 2.5m hoog".
 */
export function calculateWallArea(length, width, height) {
  const perimeter = 2 * (Number(length) + Number(width));
  return Math.round(perimeter * Number(height) * 10) / 10;
}

/**
 * Calculate floor area.
 */
export function calculateFloorArea(length, width) {
  return Math.round(Number(length) * Number(width) * 10) / 10;
}
