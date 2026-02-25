# Conversational Quote Builder — Architecture

## The Idea

Replace the static checkbox-based quote form with a hybrid interface: a conversational AI assistant on the left that understands natural language, paired with a live-updating structured quote on the right. The AI interprets what Donato describes, asks clarifying questions, and builds up quote lines — but never decides prices. A deterministic pricing engine handles all money math.

---

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    TABLET UI (Split View)                │
│                                                         │
│  ┌──────────────────┐  ┌─────────────────────────────┐  │
│  │                  │  │                             │  │
│  │   CHAT PANEL     │  │   LIVE QUOTE PANEL          │  │
│  │                  │  │                             │  │
│  │  Donato types    │  │   Klant: Janssen            │  │
│  │  naturally,      │  │   Adres: Heerlen            │  │
│  │  AI asks         │  │                             │  │
│  │  clarifying      │  │   ┌─────────────────────┐   │  │
│  │  questions       │  │   │ Frezen stucwerk     │   │  │
│  │                  │  │   │ 36m² × €60 = €2.160 │   │  │
│  │                  │  │   ├─────────────────────┤   │  │
│  │                  │  │   │ Kiesol hechtlaag    │   │  │
│  │                  │  │   │ 36m² × €15 = €540   │   │  │
│  │                  │  │   ├─────────────────────┤   │  │
│  │                  │  │   │ ...more lines...    │   │  │
│  │                  │  │   └─────────────────────┘   │  │
│  │                  │  │                             │  │
│  │                  │  │   Subtotaal:    €X.XXX,XX   │  │
│  │                  │  │   BTW 21%:      €X.XXX,XX   │  │
│  │                  │  │   ─────────────────────     │  │
│  │                  │  │   Totaal:       €X.XXX,XX   │  │
│  │                  │  │                             │  │
│  └──────────────────┘  └─────────────────────────────┘  │
│                                                         │
│  [Bekijk PDF]    [Opslaan concept]    [Verstuur offerte] │
└─────────────────────────────────────────────────────────┘
```

---

## Three-Layer Architecture

### Layer 1 — AI Interpreter (Claude Haiku)

**Role:** Translate natural Dutch language into structured tool calls. Never generates prices or amounts directly.

**What it does:**
- Understands messy, shorthand Dutch input ("muren slaan door, stuc eraf, alles behandelen")
- Identifies which treatments are needed based on described problems
- Asks targeted follow-up questions for missing info (m², wall depth, finish preference)
- Maintains conversation context ("noordmuur ook schimmel" → knows dimensions from earlier)
- Suggests common treatment combinations based on diagnosis

**What it does NOT do:**
- Calculate prices (that's the pricing engine)
- Make up measurements or assumptions without asking
- Decide treatment options without confirmation

**Tool calls it can make:**

```
set_customer(name, phone, email, street, postcode, city)
add_line(treatment_code, quantity, unit, note?)
update_line(line_id, field, value)
remove_line(line_id)
set_discount(type: "percentage" | "fixed", value)
add_note(text)
get_treatment_info(treatment_code) → returns pricing tiers, description
suggest_treatments(problem_type) → returns relevant treatment codes
```

**System prompt knows:**
- All treatment codes and what problems they solve
- Which treatments typically go together (e.g., doorslag = frezen + hechtlaag + aanbrandlaag + afwerking)
- What parameters each treatment needs (m², stuk, strekkende meter, depth)
- Does NOT contain prices (asks the pricing engine)

### Layer 2 — Pricing Engine (Deterministic Code)

**Role:** Single source of truth for all pricing. Pure math, zero AI.

**Input:** Treatment code + quantity + any modifiers (depth, area tier)
**Output:** Unit price (with tier applied), line total, any minimum applied

**Pricing config structure:**

```json
{
  "treatments": {
    "frezen_stucwerk": {
      "label": "Frezen/kappen stucwerk/egaline",
      "unit": "m2",
      "base_price": 100.00,
      "tiers": [
        { "from_qty": 10, "price": 65.00 },
        { "from_qty": 20, "price": 60.00 }
      ],
      "minimum": null,
      "btw": 21,
      "category": "voorbereiding"
    },
    "frezen_verflaag": {
      "label": "Frezen verflaag",
      "unit": "m2",
      "base_price": 70.00,
      "tiers": [
        { "from_qty": 10, "price": 65.00 },
        { "from_qty": 20, "price": 60.00 }
      ],
      "minimum": null,
      "btw": 21,
      "category": "voorbereiding"
    },
    "kiesol_hechtlaag": {
      "label": "Aanbrengen Kiesol hechtlaag",
      "unit": "m2",
      "base_price": 15.00,
      "tiers": [],
      "minimum": null,
      "btw": 21,
      "category": "behandeling"
    },
    "aanbrandlaag_sulfatex": {
      "label": "Aanbrengen aanbrandlaag WP Sulfatex (2mm)",
      "unit": "m2",
      "base_price": 50.00,
      "tiers": [],
      "minimum": null,
      "btw": 21,
      "category": "behandeling"
    },
    "afwerking_ds_levell_spaan": {
      "label": "Aanbrengen WP DS Levell met spaan (max 10mm)",
      "unit": "m2",
      "base_price": 70.00,
      "tiers": [],
      "minimum": null,
      "btw": 21,
      "category": "afwerking"
    },
    "afwerking_optie1_ds_levell": {
      "label": "Strak stuken met WP DS Levell (10-30mm)",
      "unit": "m2",
      "base_price": 100.00,
      "tiers": [],
      "minimum": null,
      "btw": 21,
      "category": "afwerking_esthetisch"
    },
    "afwerking_optie2_sp_top_white": {
      "label": "Strak stuken met SP Top White (10-30mm)",
      "unit": "m2",
      "base_price": 90.00,
      "tiers": [],
      "minimum": null,
      "btw": 21,
      "category": "afwerking_esthetisch"
    },
    "injectie_kiesol_c": {
      "label": "Injecteren met Kiesol C",
      "unit": "m",
      "base_price": null,
      "variants": {
        "30cm": 100.00,
        "20cm": 90.00,
        "10cm": 80.00
      },
      "minimum": null,
      "btw": 21,
      "category": "injectie"
    },
    "impregneren_funcosil": {
      "label": "Impregneren met Funcosil FC",
      "unit": "m2",
      "base_price": 15.00,
      "tiers": [
        { "from_qty": 50, "price": 13.00 }
      ],
      "minimum": null,
      "btw": 21,
      "category": "impregnatie"
    },
    "keldervloer_nieuw": {
      "label": "Nieuwe vezelversterkte waterdichte keldervloer",
      "unit": "m2",
      "base_price": 150.00,
      "tiers": [
        { "from_qty": 20, "price": 130.00 },
        { "from_qty": 30, "price": 110.00 },
        { "from_qty": 40, "price": 90.00 }
      ],
      "minimum": 1500.00,
      "btw": 21,
      "category": "vloer"
    },
    "renovatiekoker": {
      "label": "Bijmaken renovatiekoker",
      "unit": "stuk",
      "base_price": 100.00,
      "tiers": [],
      "note": "zwart/bruin/wit",
      "minimum": null,
      "btw": 21,
      "category": "ventilatie"
    },
    "leidingdoorvoer_stopaq": {
      "label": "Afdichten leidingdoorvoer met Stopaq",
      "unit": "stuk",
      "base_price": 150.00,
      "tiers": [],
      "minimum": null,
      "btw": 21,
      "category": "afdichting"
    },
    "air70_montage": {
      "label": "Montage AIR70",
      "unit": "stuk",
      "base_price": 2000.00,
      "tiers": [],
      "minimum": null,
      "btw": 21,
      "category": "ventilatie"
    },
    "schimmel_behandeling": {
      "label": "Schimmels doden met schimmeldodend middel",
      "unit": "m2",
      "base_price": 10.00,
      "tiers": [],
      "minimum": null,
      "btw": 21,
      "category": "behandeling"
    },
    "chemisch_reinigen": {
      "label": "Chemisch reinigen met Clean FP",
      "unit": "m2",
      "base_price": 35.00,
      "tiers": [],
      "minimum": null,
      "btw": 21,
      "category": "reiniging"
    },
    "spouwrooster": {
      "label": "Openen stootvoeg en plaatsen spouwrooster",
      "unit": "stuk",
      "base_price": 15.00,
      "tiers": [],
      "minimum": null,
      "btw": 21,
      "category": "ventilatie"
    },
    "vloer_mb2k_kiesol": {
      "label": "Vloer waterdicht afdichten met MB2K en Kiesol MB",
      "unit": "m2",
      "base_price": 200.00,
      "tiers": [],
      "minimum": null,
      "btw": 21,
      "category": "vloer"
    },
    "kim_cementmortel": {
      "label": "Aanhechten kim aan bestaande vloer met cementmortel",
      "unit": "m2",
      "base_price": 40.00,
      "tiers": [],
      "minimum": null,
      "btw": 21,
      "category": "vloer"
    },
    "trap_demonteren": {
      "label": "Trap demonteren en terugplaatsen zonder modificatie",
      "unit": "stuk",
      "base_price": 300.00,
      "tiers": [],
      "minimum": null,
      "btw": 21,
      "category": "overig"
    },
    "egaliseren_vloer": {
      "label": "Egaliseren vloer 10-20mm",
      "unit": "m2",
      "base_price": 25.00,
      "tiers": [],
      "minimum": null,
      "btw": 21,
      "category": "vloer"
    }
  },

  "treatment_bundles": {
    "doorslag_muur_compleet": {
      "label": "Muur waterdicht maken (compleet)",
      "description": "Standaard pakket bij doorslaand vocht op muren",
      "includes": [
        "frezen_stucwerk",
        "kiesol_hechtlaag",
        "aanbrandlaag_sulfatex",
        "afwerking_ds_levell_spaan"
      ],
      "optional_finish": [
        "afwerking_optie1_ds_levell",
        "afwerking_optie2_sp_top_white"
      ]
    },
    "kelder_volledig": {
      "label": "Kelder volledig renoveren",
      "description": "Muren + vloer + ventilatie",
      "includes": [
        "frezen_stucwerk",
        "kiesol_hechtlaag",
        "aanbrandlaag_sulfatex",
        "afwerking_ds_levell_spaan",
        "keldervloer_nieuw"
      ],
      "optional": [
        "renovatiekoker",
        "trap_demonteren",
        "schimmel_behandeling"
      ]
    }
  }
}
```

**Pricing function:**

```
calculate_price(treatment_code, quantity, variant?) → {
  unit_price: number,      // after tier applied
  tier_applied: string,    // e.g., "20m²+ staffel"
  line_total: number,      // quantity × unit_price
  minimum_applied: bool,   // if minimum was higher
  final_total: number,     // max(line_total, minimum)
  btw: number
}
```

### Layer 3 — Editable Quote UI (React)

**Role:** Visual representation of the quote. Editable by tapping any line. Updates in real-time as AI adds lines.

**Features:**
- Each line shows: description, quantity, unit, unit price, line total
- Tap to edit any field (quantity, override price, add note)
- Drag to reorder lines
- Delete with swipe
- Discount section (percentage or fixed)
- Running totals: subtotaal excl. BTW, BTW, totaal incl. BTW
- Customer info section (auto-filled from CRM or entered via chat)

---

## Conversation Flow Examples

### Example 1: Standard basement waterproofing

```
Donato: kelder van de buren, 4x5m, 2.5m hoog, alle muren slaan door

AI:     Kelder 4×5m, hoogte 2.5m.
        Muuroppervlak: 45m² (omtrek 18m × 2.5m).
        Standaard pakket doorslaand vocht:
        • Frezen stucwerk
        • Kiesol hechtlaag
        • Aanbrandlaag WP Sulfatex
        • WP DS Levell met spaan
        
        Welke esthetische afwerking?
        1. Strak stuken DS Levell (€100/m²)
        2. Strak stuken SP Top White (€90/m²)
        3. Geen extra afwerking

Donato: 1

AI:     ✓ Compleet muurpakket + afwerking optie 1 toegevoegd (45m²).
        Hoe zit het met de vloer?

Donato: vloer is oke, maar er zit schimmel in de hoek bij de trap, 
        misschien 3m2

AI:     ✓ Schimmelbehandeling 3m² toegevoegd.
        Verder nog iets? Ventilatie, leidingdoorvoeren?

Donato: nee dat is het, klant is Pietersen uit Heerlen

AI:     ✓ Klantgegevens ingesteld.
        Offerte is klaar — check de regels rechts.
```

**Quote panel shows:**
| Omschrijving | m² | Prijs/m² | Totaal |
|---|---|---|---|
| Frezen stucwerk | 45 | €60,00 | €2.700,00 |
| Kiesol hechtlaag | 45 | €15,00 | €675,00 |
| Aanbrandlaag WP Sulfatex | 45 | €50,00 | €2.250,00 |
| WP DS Levell met spaan | 45 | €70,00 | €3.150,00 |
| Strak stuken DS Levell | 45 | €100,00 | €4.500,00 |
| Schimmelbehandeling | 3 | €10,00 | €30,00 |


### Example 2: Quick injection job

```
Donato: alleen injecteren, buitenmuur woonkamer 8 meter, 
        muur is 20cm dik

AI:     ✓ Injectie Kiesol C: 8m × €90 (20cm diep) = €720.
        Nog iets?

Donato: nee

AI:     ✓ Klaar.
```

### Example 3: Corrections and edits

```
Donato: eigenlijk is die muur niet 8 maar 6 meter

AI:     ✓ Injectie aangepast: 6m. Nieuw totaal: €540.

Donato: en doe er ook gevelimpregnatie bij, zelfde muur, 
        6 breed 3 hoog

AI:     ✓ Funcosil FC impregnatie: 18m² × €15 = €270 toegevoegd.
```

---

## Data Flow

```
User Input (NL text)
       │
       ▼
┌──────────────┐     tool calls      ┌──────────────────┐
│  AI Agent    │ ──────────────────→  │  Pricing Engine  │
│  (Haiku)     │ ←────────────────── │  (Deterministic)  │
│              │    prices + totals   │                  │
│  Understands │                     │  - Volume tiers   │
│  context     │                     │  - Minimums       │
│  Asks Qs     │                     │  - Variants       │
│  Maps to     │                     │  - BTW calc       │
│  treatments  │                     │                  │
└──────────────┘                     └──────────────────┘
       │
       │ structured quote state
       ▼
┌──────────────────┐
│  Quote UI        │
│  (React)         │
│                  │
│  - Live lines    │
│  - Editable      │
│  - Totals        │
│  - PDF export    │
└──────────────────┘
       │
       ▼
┌──────────────────┐
│  CRM Integration │
│                  │
│  - Save to lead  │
│  - PDF generate  │
│  - Email send    │
│  - Status track  │
└──────────────────┘
```

---

## Technical Decisions

### AI Model
**Claude Haiku 4.5** — fast enough for conversational feel, cheap enough for per-quote usage. System prompt contains treatment knowledge and tool definitions but NO prices.

### Pricing Engine
**Server-side TypeScript function.** Called via API by the AI agent's tool use. Single `pricing-config.json` file that can be updated when prices change. No AI involved in price calculation ever.

### State Management
The quote state lives in React (or Zustand/similar). Both the AI tool calls and manual UI edits modify the same state. This means:
- AI adds a line → appears in UI instantly
- User edits a line in UI → AI is aware of the change in next message
- Everything stays in sync

### Quote State Shape

```typescript
interface QuoteState {
  id: string;
  lead_id: string | null;
  status: "draft" | "sent" | "accepted" | "rejected";
  label: string; // e.g., "Optie A: muren + vloer"
  
  customer: {
    name: string;
    phone: string;
    email: string;
    street: string;
    postcode: string;
    city: string;
  };
  
  diagnosis: {
    problems: string[];        // problem codes
    description: string;       // AI-refined natural language
    photos: string[];          // uploaded photo URLs
    notes: string;
  };
  
  lines: QuoteLine[];
  
  discount: {
    type: "percentage" | "fixed";
    value: number;
  } | null;
  
  totals: {
    subtotal_excl: number;
    btw_amount: number;
    total_incl: number;
  };
  
  conversation_log: Message[];  // full chat history = inspection report
  
  created_at: string;
  updated_at: string;
}

interface QuoteLine {
  id: string;
  treatment_code: string;
  label: string;
  quantity: number;
  unit: "m2" | "m" | "stuk";
  unit_price: number;
  tier_applied: string | null;
  line_total: number;
  note: string | null;
  category: string;
  sort_order: number;
}
```

---

## Migration Path

### Phase 1: Smart Form (quick win)
Keep the current form layout but add intelligence:
- Auto-suggest treatments when problem checkboxes are selected
- Auto-calculate volume tier pricing as m² is entered
- Auto-fill common bundles (doorslag muur pakket)
- This already saves Donato significant mental overhead

### Phase 2: Chat + Form Hybrid
Add the chat panel alongside the form:
- Chat input as an alternative to clicking checkboxes
- AI fills the same form fields that exist today
- Form remains fully editable
- Donato can use either input method or both

### Phase 3: Full Conversational (target state)
- Chat becomes the primary input method
- Quote panel replaces the form (cleaner, more focused)
- Form fields only appear when tapped for editing
- PDF generation from quote state
- Conversation log becomes inspection report

---

## Key Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| AI hallucinates a price | AI never sees prices. Tool calls go to pricing engine. |
| AI misunderstands input | Always shows what it interpreted: "45m² muuroppervlak" — Donato can correct |
| Slow response on-site | Haiku is fast (~500ms). Pricing engine is local/cached. |
| Donato doesn't trust it | Phase 1+2 let him verify and edit everything. Build trust gradually. |
| Price config gets stale | Single JSON file, easy to update. Could add admin UI later. |
| Edge cases AI can't handle | Manual line add always available. AI is assistant, not gatekeeper. |
| No internet on-site | Consider offline mode: pricing engine works locally, AI queued. |

---

## Bonus: The Conversation Log as Inspection Report

Every chat message is stored. After the visit, you have:

```
14:30 — "kelder 4x5m, 2.5m hoog, alle muren doorslag"
14:31 — "afwerking optie 1"  
14:32 — "schimmel bij trap, 3m2"
14:33 — "klant Pietersen, Heerlen"
```

This becomes the inspection report attached to the lead in the CRM. No separate note-taking needed. The AI can even generate a polished summary:

> "Kelder van 20m² (4×5m, 2.5m hoog). Alle muren vertonen doorslaand vocht. Volledige muurbehandeling nodig inclusief strak stuken. Schimmelvorming geconstateerd bij trap (ca. 3m²). Vloer in goede staat. Geen ventilatieproblemen geconstateerd."

That summary goes on the PDF, in the CRM, in the follow-up email — all from one natural conversation.