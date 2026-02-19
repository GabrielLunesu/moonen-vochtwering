// Shared constants for inspection form + PDF template
// Both InspectionForm.jsx and quote-template.js import from here.

export const DIAGNOSE_OPTIONS = [
  'Opstijgend vocht',
  'Condensatie',
  'Lekkage (inwendig)',
  'Lekkage (extern)',
  'Schimmel door vocht',
  'Capillair vocht',
  'Vochtdoorslag gevel',
];

export const OPLOSSING_OPTIONS = [
  {
    value: 'Injectie (DPC)',
    templateKey: 'muurinjectie',
    depthOptions: [
      { label: '10 cm', depth: 10, prijs: 80 },
      { label: '20 cm', depth: 20, prijs: 90 },
      { label: '30 cm', depth: 30, prijs: 100 },
    ],
    defaultDepth: 30,
  },
  { value: 'Kelderafdichting (inwendig)', templateKey: 'kelderafdichting', hasSubAreas: true },
  { value: 'Kelderafdichting (uitwendig)', templateKey: 'kelderafdichting', hasSubAreas: true },
  { value: 'Vochtbestendige pleister', templateKey: 'vochtbestendige_pleister' },
  { value: 'Gevelimpregnatie', templateKey: 'gevelimpregnatie' },
  { value: 'Drainage', templateKey: 'drainage' },
  { value: 'Ventilatie verbetering', templateKey: 'ventilatie' },
];

export const KELDER_SUB_AREAS = [
  { key: 'kimnaad', label: 'Kimnaad (vloer-wandovergang)', unit: 'm¹', templateKey: 'kelderafdichting_kimnaad' },
  { key: 'muurvlak', label: 'Muurvlakken', unit: 'm²', templateKey: 'kelderafdichting_muurvlak' },
  { key: 'pilaar', label: 'Pilaren', unit: 'stuk', templateKey: 'kelderafdichting_pilaar' },
  { key: 'vloer', label: 'Vloer', unit: 'm²', templateKey: 'kelderafdichting_vloer' },
  { key: 'afwerking', label: 'Afwerking stucwerk', unit: 'm²', templateKey: 'kelderafdichting_afwerking' },
];

// --- Real pricelist-based templates ---
// Each item may include optional `staffels` and `minimum` fields.
// staffels: [{ vanaf: <quantity>, prijs: <discounted unit price> }]
// minimum: minimum total amount (unit_price * quantity must meet this floor)

export const DEFAULT_LINE_ITEM_TEMPLATES = {
  // Kelderafdichting sub-areas — individual treatment steps
  kelderafdichting_kimnaad: [
    { description: 'Kimnaad afdichten', unit: 'm¹', unit_price: 85 },
  ],
  kelderafdichting_muurvlak: [
    { description: 'Frezen/kappen stucwerk of egaline', unit: 'm²', unit_price: 100 },
    { description: 'Hechtlaag aanbrengen (Kiesol)', unit: 'm²', unit_price: 15 },
    { description: 'Aanbrandlaag (WP Sulfatex, 2mm)', unit: 'm²', unit_price: 50 },
    { description: 'Waterdichte afwerklaag (WP DS Levell)', unit: 'm²', unit_price: 70 },
  ],
  kelderafdichting_pilaar: [
    { description: 'Pilaar waterdicht afwerken', unit: 'stuk', unit_price: 350 },
  ],
  kelderafdichting_vloer: [
    {
      description: 'Vezelversterkte waterdichte keldervloer',
      unit: 'm²',
      unit_price: 150,
      staffels: [
        { vanaf: 20, prijs: 130 },
        { vanaf: 30, prijs: 110 },
        { vanaf: 40, prijs: 90 },
      ],
      minimum: 1500,
    },
  ],
  kelderafdichting_afwerking: [
    { description: 'Strak stuken (SP Top White, 10-30mm)', unit: 'm²', unit_price: 90 },
  ],
  // Legacy combined template (for old data)
  kelderafdichting: [
    { description: 'Frezen/kappen stucwerk of egaline', unit: 'm²', unit_price: 100 },
    { description: 'Hechtlaag aanbrengen (Kiesol)', unit: 'm²', unit_price: 15 },
    { description: 'Aanbrandlaag (WP Sulfatex, 2mm)', unit: 'm²', unit_price: 50 },
    { description: 'Waterdichte afwerklaag (WP DS Levell)', unit: 'm²', unit_price: 70 },
  ],
  // Muurinjectie — single line, price determined by depth selector
  muurinjectie: [
    { description: 'Muurinjectie (Kiesol C)', unit: 'm¹', unit_price: 100 },
  ],
  // Vochtbestendige pleister — same treatment steps as muurvlak
  vochtbestendige_pleister: [
    { description: 'Frezen/kappen stucwerk of egaline', unit: 'm²', unit_price: 100 },
    { description: 'Hechtlaag aanbrengen (Kiesol)', unit: 'm²', unit_price: 15 },
    { description: 'Aanbrandlaag (WP Sulfatex, 2mm)', unit: 'm²', unit_price: 50 },
    { description: 'Waterdichte afwerklaag (WP DS Levell)', unit: 'm²', unit_price: 70 },
  ],
  gevelimpregnatie: [
    {
      description: 'Gevelimpregnatie (Funcosil FC)',
      unit: 'm²',
      unit_price: 15,
      staffels: [{ vanaf: 50, prijs: 13 }],
    },
  ],
  drainage: [
    { description: 'Drainage aanleggen', unit: 'm¹', unit_price: 120 },
    { description: 'Grondwerk en afvoer', unit: 'stuk', unit_price: 850 },
  ],
  ventilatie: [
    { description: 'Renovatiekoker bijmaken', unit: 'stuk', unit_price: 100 },
  ],
};

// Quick-add extras — one-click line items for common additions
export const EXTRA_LINE_ITEMS = [
  { description: 'Leidingdoorvoer afdichten (Stopaq)', unit: 'stuk', unit_price: 150 },
  { description: 'Schimmel doden (schimmeldodend middel)', unit: 'm²', unit_price: 10 },
  { description: 'Gevel chemisch reinigen (Clean FP)', unit: 'm²', unit_price: 35 },
  { description: 'Spouwrooster plaatsen', unit: 'stuk', unit_price: 15 },
  { description: 'AIR70 ventilatiesysteem montage', unit: 'stuk', unit_price: 2000 },
  {
    description: 'Frezen verflaag',
    unit: 'm²',
    unit_price: 70,
    staffels: [
      { vanaf: 10, prijs: 65 },
      { vanaf: 20, prijs: 60 },
    ],
  },
  { description: 'MB2K + Kiesol MB (instabiele vloer)', unit: 'm²', unit_price: 200 },
  { description: 'Kim aanhechten aan bestaande vloer', unit: 'm²', unit_price: 40 },
  { description: 'Trap demonteren en terugplaatsen', unit: 'stuk', unit_price: 300 },
  { description: 'Egaliseren vloer 10-20mm', unit: 'm²', unit_price: 25 },
];

/** Normalize old single-string diagnose to array */
export function normalizeDiagnose(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value) {
    if (value === 'Combinatie') return [];
    // Handle comma-separated legacy strings
    if (value.includes(',')) return value.split(',').map((s) => s.trim()).filter(Boolean);
    return [value];
  }
  return [];
}

/** Normalize old single-string oplossing to array */
export function normalizeOplossing(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value) {
    if (value === 'Combinatie') return [];
    if (value.includes(',')) return value.split(',').map((s) => s.trim()).filter(Boolean);
    return [value];
  }
  return [];
}
