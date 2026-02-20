# Moonen Vochtwering — CRM & Quoting Webapp

> **Living document** — last updated: 20 Feb 2026

---

## Current Status

### Core Build (Phase 1-4)
- ✅ Foundation, auth, pipeline, lead detail, emails, customer flows
- ✅ Planning calendar/map + WhatsApp deeplinks
- ✅ Inspection form + quote sending + PDF generation
- ✅ Follow-ups, settings, cron

### v2 Enhancements Implemented
- ✅ Dynamic availability slots (`availability_slots`) with calendar management in dashboard
- ✅ Availability email now uses **first 4 real open moments**
- ✅ If no open moments exist, availability email is **not sent**
- ✅ Public confirmation page books real slots and handles full-slot conflicts
- ✅ Smart follow-up guards + per-lead pause toggle (`followup_paused`)
- ✅ Pipeline audit trail (`lead_events`) + timeline now reads actual events
- ✅ Route optimization endpoint (`/api/route/optimize`) with OSRM + fallback
- ✅ Day route planning UI with hourly scheduling + persisted route order (`route_position`)
- ✅ Failure alerting (email + optional webhook) via ops alert helper
- ✅ On-site quoting v2 wizard with line items + `inspection_data_v2`
- ✅ Stage aging support (`stage_changed_at`) with SLA badges and action-priority filtering
- ✅ Lead detail communication snapshot + full email history (`/api/leads/[id]/emails`)
- ✅ Branded 2-page quote PDF with line items, terms, logo, and inspection photos (fallback-safe)
- ✅ Quote numbering (`MV-YYYY-####`) with DB-backed sequence helper
- ✅ Quote email now includes attached PDF + public tokenized PDF link

### Sprint C+ — UX Overhaul (Implemented)
- ✅ Flexible stage actions: `getAvailableActions(lead, communication, linkedQuotes)` returns context-aware buttons per stage
- ✅ Actions no longer locked to single stage (e.g. re-send availability from `bevestigd` without pipeline regression)
- ✅ Quote editing & preview: discount support (percentage/fixed), PDF preview dialog, edit mode with "Opslaan & opnieuw versturen"
- ✅ Inspection form respects pipeline position in edit mode (won't regress `offerte_verzonden` to `bezocht`)
- ✅ Discount row in quote PDF between subtotal and BTW, BTW recalculated on discounted amount
- ✅ Interactive week calendar (`WeekCalendar.jsx`) with per-cell slot management: click to create, drag to create range, popover to toggle/delete
- ✅ Email template editor: editable subject, greeting, body, CTA label, closing per template type with live preview
- ✅ All 4 email templates accept `overrides` parameter; API routes load overrides from `settings` table
- ✅ Fixed CSS theme isolation: shadcn tokens use explicit hex values to prevent marketing dark-mode leaking into dashboard

### Sprint C++ — Quote Generator Refactor (Implemented)
- ✅ Step 4 quote builder has quick m² pricing controls (set m² price once, apply to all m² lines, add m² line quickly)
- ✅ Draft PDF preview now renders from unsaved form state via `/api/pdf/quote/preview`
- ✅ Quote PDF layout refactored: right-aligned totals, improved line wrapping, cleaner pricing table
- ✅ Light green Moonen branding applied in quote PDF
- ✅ Optional SF Pro Display PDF font registration with safe Helvetica fallback
- ✅ Faster quote navigation: each lead card menu includes "Maak offerte" linking to QuoteGenerator, and lead detail now shows visible lead ID

### Sprint D — Quote Wizard & PDF Overhaul (Implemented)
- ✅ Logo converted from 4MB SVG to 60KB PNG; `assets.js` tries PNG first with SVG fallback
- ✅ Fixed PDF text overlaps in AAN and BETREFT cards
- ✅ Dynamic intro text per solution type (kelderafdichting, injectie/DPC, gevelimpregnatie)
- ✅ Editable Offertevoorwaarden in Step 4: garantie, doorlooptijd, geldigheid, betaling, inleiding
- ✅ Updated payment terms default; new `inspection_data_v2` fields: `geldigheid_dagen`, `offerte_inleiding`

### Sprint E+ — Real Pricelist Integration (Implemented)
- ✅ **Real pricelist prices**: All `DEFAULT_LINE_ITEM_TEMPLATES` updated to match `moonen-pricelist.md` with actual product names and prices
- ✅ **Staffel pricing**: Volume-based price breaks auto-applied during line item generation via `getStaffelPrijs()` (e.g. keldervloer ≥20m²: €130, ≥30m²: €110, ≥40m²: €90)
- ✅ **Minimum enforcement**: Items with `minimum` field (e.g. keldervloer min. €1.500) adjust unit price upward when total would be below floor
- ✅ **Muurinjectie depth selector**: Radio group (10/20/30cm) determines price per m¹ (€80/€90/€100), persisted in `inspection_data_v2.injectie_depth`
- ✅ **Individual treatment steps**: kelderafdichting muurvlak generates 4 separate line items (frezen, Kiesol hechtlaag, Sulfatex aanbrandlaag, DS Levell afwerklaag)
- ✅ **Quick-add extras**: Collapsible "Veelgebruikte toevoegingen" section with one-click buttons for common additions (leidingdoorvoer, schimmel doden, gevel reinigen, spouwrooster, AIR70, frezen verflaag)
- ✅ **Visual hints**: Staffel and minimum indicators shown next to line item totals after generation
- ✅ **Pricing utilities**: `pricing.js` rewritten with `getStaffelPrijs()`, `getStaffelLabel()`, and `applyMinimum()` helpers
- ✅ **Backward compatible**: Old quotes unaffected; new fields (`staffels`, `minimum`) are optional; `injectie_depth` defaults to 30cm

### Sprint E — Inspection Form, PDF & Quote System Overhaul (Implemented)
- ✅ **Diagnose is multi-select**: checkboxes replace dropdown, `form.diagnose` is now an array
- ✅ **Oplossing is multi-select**: checkboxes replace dropdown, `form.oplossingen` is now an array (renamed from `form.oplossing`)
- ✅ **Kelderafdichting sub-areas**: 5 checkboxes (kimnaad, muurvlakken, pilaren, vloer, afwerking) with per-area quantity inputs and unit-specific templates
- ✅ **Single scrollable page**: replaced 4-step wizard with 3 sections (Diagnose & Oplossing, Foto's & Opmerkingen, Offerte)
- ✅ **AI text refinement**: "Verfijn tekst" button on diagnose details calls `/api/ai/refine-text` (Claude Haiku 4.5), with undo support
- ✅ **PDF viewer overhaul**: replaced Dialog with Sheet (side=right, nearly full-width) for better PDF preview
- ✅ **PDF template handles arrays**: diagnose/oplossing arrays rendered as comma-separated; intro text adapts for multiple solutions
- ✅ **PDF auto page-breaks**: `wrap={false}` on table rows/totals box prevents row splitting; `wrap` on page 2 enables auto-flow
- ✅ **Shared constants module**: `inspection-constants.js` centralizes diagnose options, oplossing options, kelder sub-areas, line item templates, and normalization functions
- ✅ **Backward compatibility**: old single-string diagnose/oplossing data normalizes to arrays via `normalizeDiagnose()`/`normalizeOplossing()`; save writes comma-joined strings to legacy columns
- ✅ **New dependencies**: `ai` + `@ai-sdk/anthropic` for AI refinement, shadcn `checkbox` component
- ✅ **New env var**: `ANTHROPIC_API_KEY` (required for AI text refinement)

### Self-Service Booking & Appointment Management (Implemented)
- ✅ Simplified contact form: removed address fields (straat, postcode, plaats), only name/email/phone/type/toelichting
- ✅ Auto-sends "Plan uw inspectie" email on form submit (replaces generic auto-reply)
- ✅ Lead auto-advances to `uitgenodigd` on successful planning email send
- ✅ `/bevestig` now has 2-step flow: address collection → slot picker
- ✅ Customer provides address (straat, postcode, plaatsnaam) during booking, not on contact form
- ✅ Confirmation email includes "Verzetten of annuleren" link to `/afspraak`
- ✅ New `/afspraak` page: view appointment, reschedule (pick new slot), or cancel
- ✅ No hard cutoff on reschedule/cancel — soft 24h warning shown, action always allowed
- ✅ Cancel releases slot, sets status back to `uitgenodigd`, sends re-booking CTA
- ✅ Reschedule atomically books new slot then releases old, sends new confirmation
- ✅ Admin always notified by email on reschedule or cancel
- ✅ `plaatsnaam` column now nullable (address collected at booking time, not form submit)

### Inspection Wizard — Direct Online Booking (Implemented)
- ✅ **Multi-step wizard** replaces flat contact form on `/gratis-inspectie` page
- ✅ **Step 1: Contact** — name, email, phone, problem type (optional), message (optional)
- ✅ **Step 2: Choice** — two option cards: "Bericht versturen" (contact-only) or "Direct inplannen" (recommended, with badge)
- ✅ **Step 3: Address** (booking path only) — straat, postcode, plaatsnaam
- ✅ **Step 4: Slot selection** (booking path only) — reuses `SlotCalendar` component, preloads slots
- ✅ **Step 5: Success** — animated checkmark, booking confirmation or contact acknowledgment
- ✅ **CSS-only animations**: fade+slide transitions between steps, animated progress bar, SVG checkmark draw animation
- ✅ **New API: `POST /api/customer/book-inspection`** — public endpoint, creates lead + books slot atomically, sends confirmation + admin notification
- ✅ **Modified API: `POST /api/contact`** — accepts `mode: 'contact_only'` to send simple thank-you email instead of plan-inspection email
- ✅ **New email template: `contact-received.js`** — simple "wij hebben uw bericht ontvangen" acknowledgment
- ✅ **Deprecated flow**: plan-inspection email with `/bevestig` link no longer sent for wizard submissions (still available for legacy/dashboard use)
- ✅ **Direct booking path**: lead goes straight from creation → `bevestigd` (skips `nieuw` → `uitgenodigd`)
- ✅ **Contact-only path**: lead stays at `nieuw`, no booking link sent, admin follows up manually
- ✅ Google Ads conversion tracking preserved on both paths
- ✅ SLOT_FULL handling: removes unavailable slot from calendar, shows error, lets user pick another

### Calendar Availability Overhaul (Implemented)
- ✅ Customer-facing month calendar on `/bevestig` and `/afspraak` (replaces dropdown slot picker)
- ✅ `SlotCalendar.jsx`: month grid with green dot indicators, clickable days, time slot pills, Dutch labels, mobile-first 44px touch targets
- ✅ Dashboard calendar rescheduling: click lead block → popover ("Open lead" / "Verplaatsen") → pick-target mode → confirm dialog → auto-email
- ✅ Dashboard quick lead creation: click open slot → "Nieuwe aanvraag" → mini form dialog → creates lead as `bevestigd` with slot booked
- ✅ New API: `POST /api/leads/[id]/reschedule` — admin-initiated reschedule (auth-based, atomic slot swap, confirmation email)
- ✅ New API: `POST /api/leads/create-with-booking` — combined lead creation + slot booking for phone-in leads (source: `telefoon`)
- ✅ `QuickLeadDialog.jsx`: form dialog with name, phone, email, address, type, toelichting fields
- ✅ `WeekCalendar.jsx` enhanced: lead popovers, reschedule mode with banner + pulsing targets, drag-to-reschedule (mouse + touch), AlertDialog confirmation
- ✅ Planning page passes `onLeadsChange` callback to WeekCalendar for data refresh after reschedule/create
- ✅ "Nieuwe aanvraag" button on Kanban pipeline page — creates lead without appointment (status: `nieuw`)
- ✅ New `POST /api/leads` — auth-protected manual lead creation with token generation and event logging
- ✅ `NewLeadDialog.jsx`: form dialog for manual lead creation from Kanban, creates as `nieuw` in pipeline

### Manual Follow-Up Emails (Implemented)
- ✅ Automatic follow-up cron disabled (early return in `/api/cron/follow-ups`)
- ✅ Manual follow-up via lead detail: "Stuur follow-up X/3" button opens email preview dialog
- ✅ `GET /api/leads/[id]/preview-follow-up` — renders follow-up email HTML for preview (auth required)
- ✅ `POST /api/leads/[id]/send-follow-up` — sends follow-up email manually, increments `follow_up_count` (auth required)
- ✅ Preview dialog shows recipient, subject, and rendered HTML in iframe before sending
- ✅ 3-tier follow-up template reused (gentle/helpful/last), respects email template overrides from settings
- ✅ `getAvailableActions()` shows "Stuur follow-up" button for `offerte_verzonden` leads without response and <3 follow-ups sent

### CRM Warning Cards (Implemented)
- ✅ Lead cards now show `Laatste contact`, `Volgende stap` (+ uiterlijke datum), and `Afspraak`
- ✅ In-app warning model in `lead-workflow.js` with reason codes and severity (`none`, `warning`, `critical`)
- ✅ Lead card risk badge (`laag`, `midden`, `hoog`) derived from stage aging + quote/inspection signals
- ✅ Kanban columns now sort leads by priority score so urgent leads appear first in each stage
- ✅ "Needs action vandaag" filter label changed to Dutch: `Actie nodig`

### Sprint F — Standalone Quote Generator (Implemented)
- ✅ **New `quotes` table**: Standalone quotes with full customer snapshot, line items (incl. BTW), totals, terms, status tracking, and lead linkage
- ✅ **CRUD API**: `GET/POST /api/quotes`, `GET/PATCH/DELETE /api/quotes/[id]`, `POST /api/quotes/[id]/send`
- ✅ **QuoteGenerator component**: Customer search/selector, diagnose & treatment checkboxes, line item editor with auto-generation, BTW incl. totals, discount, PDF preview, save/send
- ✅ **QuoteList component**: Filterable/searchable quote list with status badges, duplicate & delete functionality
- ✅ **PricelistEditor component**: Editable pricelist settings per category, staffel editing, extras management, saves to `settings.pricelist`
- ✅ **Page routes**: `/dashboard/offerte` (list), `/dashboard/offerte/nieuw` (new), `/dashboard/offerte/[id]` (edit), `/dashboard/offerte/instellingen` (pricelist)
- ✅ **Sidebar nav**: "Offertes" added between Planning and Instellingen
- ✅ **Lead integration**: "Maak offerte" action in lead detail, linked quotes section on lead detail page, pre-fill from lead/inspection data
- ✅ **Multiple quotes per lead**: Each lead can have multiple quotes with labels (e.g. "Optie A: alleen muren")
- ✅ **Auto-create lead**: Creating a quote without a lead auto-creates one (source: `offerte`)
- ✅ **Quote sending**: Generates quote number, renders PDF, sends email with attachment, updates linked lead status
- ✅ **BTW incl. display**: All prices stored and shown incl. BTW; totals show excl. BTW, BTW amount, and incl. BTW
- ✅ **New extras**: MB2K + Kiesol MB (€200/m²), Kim aanhechten (€40/m²), Trap demonteren (€300/stuk), Egaliseren vloer (€25/m²)
- ✅ **Quote centralization**: `InspectionForm.jsx`, `inspectie/[id]/page.js`, `leads/[id]/send-quote/route.js`, and marketing `InspectionForm.js` deleted; all quote actions route through QuoteGenerator

### Bidirectional Google Calendar Sync (Implemented)
- ✅ Service Account JWT auth via `google-auth-library` (no heavyweight `googleapis` package)
- ✅ Google → CRM: push notifications (webhooks) + incremental sync with sync tokens
- ✅ CRM → Google: automatic event create/update/delete on inspection booking/reschedule/cancel
- ✅ Daily cron (`/api/cron/gcal-renew`) renews watch channel + safety sync
- ✅ New tables: `google_calendar_events` (synced events), `gcal_sync_state` (sync tokens/channel info)
- ✅ New `google_event_id` column on `leads` table
- ✅ Dashboard: Google events render as purple blocks in WeekCalendar
- ✅ Planning page: "Synchroniseer" button for manual sync
- ✅ Settings page: Google Calendar connection status, full sync, push notification renewal
- ✅ Graceful degradation: all gcal functions are no-ops when env vars not configured
- ✅ Best-effort sync: Google API failures never block CRM operations

### Operational Setup (Completed)
- ✅ Resend domain verification (`moonenvochtwering.nl`) + working `RESEND_API_KEY`
- ✅ Supabase Storage bucket `inspection-photos` (public)
- ✅ Vercel deployment with all env vars
- ✅ Latest migrations applied in Supabase (including `2026-02-09-quote-numbering.sql`)
- [ ] End-to-end production flow test

---

## Tech Stack

| Layer | Tool | Version | Cost |
|-------|------|---------|------|
| Framework | Next.js | 15.2.1 | Free |
| UI (marketing) | Tailwind CSS | 4 | Free |
| UI (dashboard) | shadcn/ui + Radix UI | new-york style | Free |
| Database/Auth/Storage/Realtime | Supabase | Free tier | Free |
| Email | Resend | Free tier (3k/mo) | Free |
| PDF | @react-pdf/renderer | 4.3.2 | Free |
| Drag & Drop | @hello-pangea/dnd | 18.0.1 | Free |
| Maps | Leaflet + react-leaflet | 1.9.4 / 5.0.0 | Free |
| Route Optimization | OSRM public trip API + fallback | n/a | Free |
| AI Text Refinement | Vercel AI SDK + @ai-sdk/anthropic | claude-haiku-4-5 | Pay-per-use |
| Google Calendar | google-auth-library + Calendar REST API | Service Account JWT | Free |
| Hosting/Cron | Vercel | Free tier | Free |

---

## Architecture

### Route Groups

```
src/app/
├── (marketing)/                 # Public website
│   └── vochtbestrijding/[city]/[service]/page.js  # 40 city×service SEO landing pages
├── (dashboard)/dashboard/       # Authenticated CRM
│   ├── page.js                  # Kanban
│   ├── lead/[id]/page.js        # Lead detail + event timeline
│   ├── planning/page.js         # Week calendar + day route planner + availability management
│   ├── offerte/page.js          # Quote list with filters + actions
│   ├── offerte/nieuw/page.js    # New quote (blank or pre-filled from lead)
│   ├── offerte/[id]/page.js     # Edit existing quote
│   ├── offerte/instellingen/page.js # Pricelist settings editor
│   └── instellingen/page.js     # Settings + email template editor
├── (public)/                    # Token-based customer actions
│   ├── bevestig/page.js         # Address form → pick slot → confirm
│   ├── afspraak/page.js         # View/reschedule/cancel appointment
│   └── reactie/page.js          # Quote response
├── api/                         # CRM APIs
└── middleware.js                # Protect /dashboard/*
```

### Key Dashboard Components

```
src/app/components/
├── dashboard/
│   ├── WeekCalendar.jsx           # Week view with slot CRUD, lead popovers, reschedule mode, drag-to-reschedule, quick lead creation
│   ├── QuickLeadDialog.jsx        # Dialog form for creating lead + booking from calendar
│   ├── QuoteGenerator.jsx          # Centralized quote builder: customer selector, treatment, line items (incl. BTW), PDF preview, save/send
│   ├── QuoteList.jsx               # Filterable quote list with status badges, duplicate, delete
│   ├── PricelistEditor.jsx         # Editable pricelist settings: templates per category, staffels, extras
│   ├── MapView.jsx                # Leaflet map with route visualization
│   ├── GoogleEventBlock.jsx       # Purple event block for Google Calendar events in WeekCalendar
│   ├── GoogleCalendarSettings.jsx # Settings UI: connection status, manual sync, watch renewal
│   └── ...
├── marketing/
│   └── CityServicePageLayout.js   # City×service SEO landing page layout (8 sections, JSON-LD, reuses FAQAccordion + CTASection)
├── public/
│   └── SlotCalendar.jsx           # Month-view calendar for customer slot selection (used on /bevestig, /afspraak, and InspectionWizard)
└── ui/                            # shadcn/ui primitives (dialog, alert-dialog, popover, checkbox, sheet, etc.)
```

### Key Library Modules

```
src/lib/
├── supabase/{client,server,admin}.js
├── email/{resend.js,templates/*}    # Templates: plan-inspection, availability, confirmation, quote, follow-up, admin-notification, contact-received
├── pdf/{quote-template.js,assets.js,fonts.js}
├── data/city-services.js        # 40 city×service entries (8 cities × 5 services) with E5 framework copy for SEO landing pages
├── google/calendar.js           # Google Calendar API client (JWT auth, event CRUD, watch, sync, lead sync helper)
├── ops/alerts.js                # Ops notifications (email/webhook)
└── utils/
    ├── events.js                # lead_events logger
    ├── inspection-constants.js  # Shared constants: diagnose/oplossing options, kelder sub-areas, line item templates, extra line items, normalization
    ├── lead-workflow.js         # Actions (with linkedQuotes) + stage aging + communication snapshot + warning/risk/priority helpers for dashboard cards
    ├── tokens.js
    ├── pipeline.js
    ├── pricing.js               # Staffel pricing: getStaffelPrijs(), getStaffelLabel(), applyMinimum()
    └── whatsapp.js
```

---

## City-Service Landing Pages (Marketing SEO)

40 statically generated landing pages covering 8 cities x 5 services for local SEO targeting. Each page has unique Dutch copy following the E5 framework (Empathize, Educate, Excite, Evidence, Enable).

### URL Pattern

```
/vochtbestrijding/{city}/{service}
```

### Cities (8)

`maastricht`, `heerlen`, `sittard-geleen`, `kerkrade`, `valkenburg`, `meerssen`, `brunssum`, `echt-susteren`

### Services (5)

`kelderafdichting`, `opstijgend-vocht`, `schimmelbestrijding`, `gevelimpregnatie`, `vochtwerend-stucwerk`

### Files

| File | Purpose |
|------|---------|
| `src/lib/data/city-services.js` | Data file with 40 city x service entries. Each entry contains: meta tags, hero copy, local problems, solution steps, testimonial, FAQ, CTA. Exports: `cityServices`, `getCityService(city, service)`, `getAllCityServiceParams()`, `getSiblingServices(city, service)`, `getSameCities(city, service)` |
| `src/app/components/marketing/CityServicePageLayout.js` | Client component rendering 8 sections: Hero, Local Problems, Solution Approach (Educate), Transformation (Excite), Evidence (testimonial), FAQ (reuses `FAQAccordion`), CTA (reuses `CTASection`), Internal Links (siblings + same-city). Includes JSON-LD structured data: `FAQPage`, `Service`, `BreadcrumbList` |
| `src/app/(marketing)/vochtbestrijding/[city]/[service]/page.js` | Dynamic route with `generateStaticParams()` (40 routes), `generateMetadata()` for per-page SEO, `notFound()` guard for invalid slugs |

### Modified Files

| File | Change |
|------|--------|
| `src/app/sitemap.js` | Added 40 city-service URLs via `getAllCityServiceParams()` (priority 0.7, monthly) |
| `src/app/components/marketing/CityPageLayout.js` | Service card links now route to `/vochtbestrijding/{city}/{service}` instead of `/diensten/{service}` |

### Page Sections (CityServicePageLayout)

1. **Hero** — city + service specific heading and subtext
2. **Local Problems** — 3 locally relevant problems with title + description
3. **Solution Approach** — educate section explaining the technique
4. **Transformation** — excite section describing the outcome
5. **Evidence** — testimonial with author, city, and project description
6. **FAQ** — 4 city-specific questions using existing `FAQAccordion` component
7. **CTA** — call-to-action using existing `CTASection` component
8. **Internal Links** — cross-links to sibling services in same city + same service in other cities

### Structured Data (JSON-LD)

Each page outputs three JSON-LD schemas:
- `FAQPage` — all FAQ questions/answers for rich snippet eligibility
- `Service` — service name, description, provider (LocalBusiness), areaServed (City)
- `BreadcrumbList` — Home > Vochtbestrijding > {City} > {Service}

---

## API Routes

| Method | Route | Auth | Purpose |
|-------|-------|------|---------|
| POST | `/api/contact` | Public | Contact form → lead + emails |
| GET | `/api/leads` | Auth | List leads |
| POST | `/api/leads` | Auth | Create lead manually (no appointment, status: nieuw) |
| GET | `/api/leads/[id]` | Auth | Get lead |
| PATCH | `/api/leads/[id]` | Auth | Update lead (status, notes, follow-up pause, route/time) |
| GET | `/api/leads/[id]/events` | Auth | Lead event history |
| POST | `/api/leads/[id]/send-availability` | Auth | Send availability email (first 4 open slots) |
| GET | `/api/pdf/quote/[id]` | Auth or quote token | Render quote PDF |
| POST | `/api/pdf/quote/preview` | Auth | Render draft quote PDF preview |
| GET/POST | `/api/availability` | Auth | List/create availability slots |
| PATCH/DELETE | `/api/availability/[id]` | Auth | Update/remove slot |
| POST | `/api/availability/generate` | Auth | Generate future slots from settings |
| GET | `/api/availability/public` | Public | Public list of open future slots |
| POST | `/api/leads/[id]/reschedule` | Auth | Admin-initiated reschedule (book new slot, release old, email customer) |
| POST | `/api/leads/create-with-booking` | Auth | Create lead + book slot in one step (phone-in leads, source: telefoon) |
| POST | `/api/customer/book-inspection` | Public | Wizard direct booking: create lead + book slot + send confirmation (no auth) |
| POST | `/api/customer/confirm` | Public token | Confirm inspection slot (atomic booking) + save address |
| GET | `/api/customer/appointment` | Public token | Fetch lead appointment details by token |
| POST | `/api/customer/reschedule` | Public token | Reschedule appointment (book new slot, release old) |
| POST | `/api/customer/cancel` | Public token | Cancel appointment (release slot, status → uitgenodigd) |
| POST | `/api/customer/quote-response` | Public token | Customer quote response |
| GET | `/api/quotes` | Auth | List quotes (optional `?lead=ID` filter) |
| POST | `/api/quotes` | Auth | Create quote (auto-creates lead if no lead_id) |
| GET | `/api/quotes/[id]` | Auth | Get single quote |
| PATCH | `/api/quotes/[id]` | Auth | Update quote |
| DELETE | `/api/quotes/[id]` | Auth | Delete quote |
| POST | `/api/quotes/[id]/send` | Auth | Send quote email with PDF attachment |
| GET/PATCH | `/api/settings` | Auth | CRM settings |
| POST | `/api/route/optimize` | Auth | OSRM route optimize + fallback |
| GET | `/api/leads/[id]/preview-follow-up` | Auth | Preview follow-up email HTML |
| POST | `/api/leads/[id]/send-follow-up` | Auth | Send follow-up email manually |
| GET | `/api/cron/follow-ups` | `CRON_SECRET` | Follow-up engine (disabled — use manual send) |
| POST | `/api/upload` | Auth | Upload inspection photos |
| POST | `/api/ai/refine-text` | Auth | AI-powered diagnose text refinement (Claude Haiku 4.5) |
| GET | `/api/geocode` | Public | Nominatim proxy |
| POST | `/api/gcal/webhook` | `GCAL_WEBHOOK_SECRET` | Receives Google Calendar push notifications → incremental sync |
| POST | `/api/gcal/sync` | Auth | Manual sync trigger (optional `?full=true` for full sync) |
| POST | `/api/gcal/watch` | Auth | Register/renew push notification channel |
| GET | `/api/gcal/events` | Auth | List synced Google Calendar events for date range (`?from=&to=`) |
| GET | `/api/cron/gcal-renew` | `CRON_SECRET` | Daily cron: renew watch channel + safety sync |

---

## Database Schema (Current)

### `leads` additions relevant to v2
- `plaatsnaam TEXT NULL` (nullable — address collected at booking, not form submit)
- `postcode TEXT` (saved from /bevestig address step)
- `availability_slot_id UUID` → linked booked slot
- `followup_paused BOOLEAN DEFAULT false`
- `route_position INT`
- `inspection_data_v2 JSONB` (includes `diagnose` array, `oplossingen` array, `kelder_sub_areas` object, `diagnose_details`, `line_items`, `discount_type`, `discount_value`, `discount_amount`, `m2_unit_price`, `geldigheid_dagen`, `offerte_inleiding`, `injectie_depth` when applicable)
- `stage_changed_at TIMESTAMPTZ`
- `quote_number TEXT`

### `availability_slots`
- `id UUID`
- `slot_date DATE`
- `slot_time TEXT`
- `max_visits INT DEFAULT 1`
- `booked_count INT DEFAULT 0`
- `is_open BOOLEAN DEFAULT true`
- `notes TEXT`
- `UNIQUE(slot_date, slot_time)`

### `lead_events`
- `id UUID`
- `created_at TIMESTAMPTZ`
- `lead_id UUID FK -> leads.id`
- `event_type TEXT`
- `old_value TEXT`
- `new_value TEXT`
- `metadata JSONB`
- `actor TEXT`

### `quotes` (new — standalone quote generator)
- `id UUID`
- `lead_id UUID FK -> leads.id ON DELETE SET NULL`
- `customer_name TEXT NOT NULL`
- `customer_email TEXT`, `customer_phone TEXT`, `customer_straat TEXT`, `customer_postcode TEXT`, `customer_plaatsnaam TEXT`
- `diagnose TEXT[]`, `diagnose_details TEXT`, `oplossingen TEXT[]`
- `kelder_sub_areas JSONB`, `oppervlakte_m2 NUMERIC`, `injectie_depth INT`
- `notes TEXT`, `photos TEXT[]`
- `line_items JSONB NOT NULL DEFAULT '[]'` (all prices incl. BTW)
- `subtotal_incl NUMERIC`, `discount_type TEXT`, `discount_value NUMERIC`, `discount_amount NUMERIC`
- `btw_percentage NUMERIC DEFAULT 21`, `btw_amount NUMERIC`, `total_incl NUMERIC`
- `garantie_jaren INT DEFAULT 5`, `doorlooptijd TEXT`, `betaling TEXT`, `geldigheid_dagen INT DEFAULT 30`, `offerte_inleiding TEXT`
- `label TEXT` (e.g. "Optie A: alleen muren")
- `quote_number TEXT`, `status TEXT` (concept/verzonden/akkoord/afgewezen/verlopen)
- `sent_at TIMESTAMPTZ`, `response TEXT`, `response_at TIMESTAMPTZ`, `quote_token TEXT UNIQUE`
- Indexes: `idx_quotes_lead_id`, `idx_quotes_status`

### `google_calendar_events` (new — Google Calendar sync)
- `id UUID`
- `google_event_id TEXT NOT NULL UNIQUE`
- `summary TEXT NOT NULL`
- `description TEXT`, `location TEXT`
- `start_time TIMESTAMPTZ NOT NULL`, `end_time TIMESTAMPTZ NOT NULL`
- `is_all_day BOOLEAN DEFAULT false`
- `status TEXT` (`confirmed`, `cancelled`, `tentative`)
- `source TEXT` (`google`, `crm`)
- `lead_id UUID FK -> leads.id ON DELETE SET NULL`
- Indexes: `idx_gcal_events_time`, `idx_gcal_events_status`, `idx_gcal_events_lead`

### `gcal_sync_state` (new — Google Calendar sync metadata)
- `key TEXT PRIMARY KEY`
- `value TEXT NOT NULL`
- `updated_at TIMESTAMPTZ`
- Stores: `sync_token`, `channel_id`, `channel_resource_id`, `channel_expiration`

### `leads` additions for Google Calendar
- `google_event_id TEXT` — linked Google Calendar event ID

### Existing core tables
- `leads`
- `email_log`
- `settings`

### RLS
- `leads`, `email_log`, `settings`, `availability_slots`, `lead_events`, `quotes`, `google_calendar_events`, `gcal_sync_state` all have authenticated access policies
- public `SELECT` on open `availability_slots` for customer booking flow

---

## Business Flow (Updated)

1. Customer fills simplified contact form (name, email, phone, type, toelichting)
2. System auto-creates lead + sends "Plan uw inspectie" email with booking link (`status → uitgenodigd`)
   - If planning email fails: lead stays `nieuw`, Gabriel re-sends manually
3. Customer clicks email link → `/bevestig?token=...`
   - Step 1: fills in address (straat, postcode, plaatsnaam)
   - Step 2: picks available slot
4. Backend books slot atomically + saves address; if slot full, customer gets retry state
5. Lead becomes `bevestigd`, confirmation email sent with "Verzetten of annuleren" link
6. Customer can visit `/afspraak?token=...` to reschedule or cancel at any time
   - Reschedule: pick new slot → old slot released, new slot booked, new confirmation email
   - Cancel: slot released, `status → uitgenodigd`, cancellation email with re-booking CTA
   - Admin always notified by email on reschedule or cancel
7. Manual availability send (`/api/leads/[id]/send-availability`) still works for re-sends
8. Gabriel can reschedule appointments from dashboard calendar (click lead → "Verplaatsen" → click open slot → confirm)
9. Gabriel can create leads from phone calls directly in the calendar (click open slot → "Nieuwe aanvraag" → fill form → auto-bevestigd)
10. Inspection + quote flow continues as before
11. Follow-up cron runs with strict guards and pause support

---

## Smart Follow-up Rules (Implemented)

Cron only sends follow-ups when all are true:
- `status = offerte_verzonden`
- `quote_sent_at IS NOT NULL`
- `quote_response IS NULL`
- `follow_up_count < max`
- `followup_paused = false`
- threshold reached from `follow_up_days`

Stops automatically when:
- customer responds
- status changes away from `offerte_verzonden`
- follow-up is paused manually

---

## Planning & Routing (Implemented)

- Planning page now supports date-based day route planning
- Optimize route button calls `/api/route/optimize`
- Uses OSRM trip API; falls back to nearest-neighbor route if OSRM fails
- Assigns 1 visit/hour from configurable start time
- Saves route order + times back to leads (`route_position`, `inspection_time`)
- WhatsApp day-route message includes ordered stops + times

---

## Ops Alerting (Implemented)

All critical failures trigger ops notifications through `src/lib/ops/alerts.js`.

Alert channels:
- Required: alert email (`OPS_ALERT_EMAIL`)
- Optional: webhook fan-out (`OPS_ALERT_WEBHOOK_URL`)

Key flows covered:
- contact intake failures / email send failures
- availability send failures
- customer confirm failures
- quote send failures
- cron follow-up partial/full failures
- route optimization failure fallback notification

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://mcflehevqqeskwiuqdnp.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...

# Email
RESEND_API_KEY=re_...

# Security
TOKEN_SECRET=<64-char-hex>
CRON_SECRET=<random-string>

# Site
NEXT_PUBLIC_SITE_URL=https://moonenvochtwering.nl

# AI
ANTHROPIC_API_KEY=sk-ant-...

# Ops alerts
OPS_ALERT_EMAIL=info@moonenvochtwering.nl
OPS_ALERT_WEBHOOK_URL=

# Google Calendar Sync
GOOGLE_SERVICE_ACCOUNT_EMAIL=...@...iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...
GOOGLE_CALENDAR_ID=your-gmail@gmail.com
GCAL_WEBHOOK_SECRET=<random-string>
```

---

## Migrations

Run in Supabase SQL editor in this order:
1. `docs/migrations/2026-02-09-availability-slots.sql`
2. `docs/migrations/2026-02-09-sprint1-audit-followup.sql`
3. `docs/migrations/2026-02-09-route-position.sql`
4. `docs/migrations/2026-02-09-inspection-v2.sql`
5. `docs/migrations/2026-02-09-stage-aging.sql`
6. `docs/migrations/2026-02-09-quote-numbering.sql`
7. `ALTER TABLE leads ALTER COLUMN plaatsnaam DROP NOT NULL;` (run manually)
8. `docs/migrations/2026-02-11-quotes-table.sql`
9. `docs/migrations/2026-02-18-google-calendar-sync.sql`

---

## Roadmap (From Here)

### Sprint A — UX + Insight Finalization (Completed)
- Added drag-to-reorder for day route list with immediate `route_position` persistence
- Added richer timeline labels (humanized stage/email events + actor display)
- Added lead detail "klant ontvangen" chips in the main header
- Added saved dashboard filters: `Actie nodig`, `Geen reactie >3d`, `Wacht op offerte reactie`

### Sprint B — Quote Professionalization (Completed)
- Redesign PDF into 2-page branded layout with `public/logo/logo.svg`
- Added quote numbering (`MV-YYYY-####`) on first quote send
- Render `inspection_data_v2.line_items` in PDF table with 40/60 payment terms
- Added photo embedding (max 4) in quote PDF with fallback rendering when image loading fails

### Sprint C+ — UX Overhaul (Completed)
- Flexible stage actions with `getAvailableActions()` — buttons adapt to lead state, not just stage
- Quote editing with discount support (percentage/fixed) + PDF preview dialog + edit mode
- Interactive week calendar replacing flat slot list on planning page (click/drag to create slots, popover to manage)
- Email template editor in settings with per-field overrides and live preview
- CSS theme isolation fix (shadcn tokens hardcoded to prevent marketing dark-mode bleed)

### Sprint C++ — Quote Generator Refactor (Completed)
- Draft PDF preview API (`/api/pdf/quote/preview`) renders from unsaved quote form state
- Step 4 quote editor supports quick m² pricing updates across all m² line items
- Quote PDF layout refactored for cleaner right-aligned totals and better text wrapping
- Optional SF Pro Display PDF font support via `public/fonts/SF-Pro-Display-{Regular,Medium,Bold}.otf`
- Automatic Helvetica fallback when SF Pro Display files are not present

### Sprint D — Quote Wizard & PDF Overhaul (Completed)
- ✅ Logo converted from 4MB SVG to 60KB PNG; `assets.js` tries PNG first with SVG fallback
- ✅ Fixed AAN card text overlap (marginBottom spacing, split address into street/city fields)
- ✅ Fixed BETREFT card overlap (increased intro marginTop to 8)
- ✅ Dynamic intro text per solution type (kelderafdichting, injectie/DPC, gevelimpregnatie, default)
- ✅ Custom intro text field in Step 4 (empty = auto from solution type)
- ✅ Editable Offertevoorwaarden section in Step 4: garantie, doorlooptijd, geldigheid, betaling, inleiding
- ✅ Updated payment terms default to "Op de eerste werkdag bij aanvang, restant binnen 2 weken na oplevering"
- ✅ New fields persisted in `inspection_data_v2`: `geldigheid_dagen`, `offerte_inleiding`

### Sprint E — Inspection Form, PDF & Quote Overhaul (Completed)
- Inspection form rewritten as single scrollable page (3 sections, no wizard)
- Multi-select diagnose and oplossing with checkbox UI
- Kelderafdichting sub-areas (kimnaad, muurvlakken, pilaren, vloer, afwerking) with per-area quantities
- AI text refinement for diagnose details (Claude Haiku 4.5 via Vercel AI SDK)
- Shared constants module (`inspection-constants.js`)
- PDF template handles array data, auto page-breaks, `wrap={false}` on rows/totals
- PDF viewer uses Sheet (side panel) instead of Dialog
- Backward compat: old string data normalizes to arrays

### Sprint F — Standalone Quote Generator (Completed)
- Standalone `quotes` table + CRUD API + send API
- QuoteGenerator component with customer selector, treatment selection, line items (incl. BTW), PDF preview
- QuoteList with status filters, duplicate, delete
- PricelistEditor for editable prices saved to `settings.pricelist`
- Lead detail integration: "Maak offerte" action + linked quotes section
- Multiple quotes per lead with labels
- New extras: MB2K, kim aanhechten, trap demonteren, egaliseren

### Sprint G — Operator Simplicity (Next)
- Add route start/end anchor support (home base) for more accurate OSRM planning

### Sprint H — Production Hardening
- Move runtime to Node 20+ in deployment
- Add smoke checks (contact -> availability -> confirm -> inspectie -> quote -> response)
- Add scheduled health checks for cron and ops alert delivery
- Run final UAT checklist on mobile for on-site quoting flow

---

## Known Limitations / Next Work

- Pricelist editor at `/dashboard/offerte/instellingen` replaces old `line_item_templates` gap; changes affect new quotes only
- Old `InspectionForm` removed; all quoting flows now use `QuoteGenerator` via the `quotes` table
- Email template overrides stored in `settings` table as `email_template_{type}` JSONB keys (no migration needed)
- OSRM public endpoint may rate-limit; fallback exists but is less accurate
- Node 18 warning appears in builds via Supabase SDK; upgrade runtime to Node 20+
- Availability slot management is fully interactive in the week calendar (flat list removed)
- SF Pro Display in PDFs requires adding font files to `public/fonts/`; otherwise Helvetica is used
- Warning signals are currently card-level only; dedicated warnings overview and grouped reason filters are not implemented yet
- Warning engine is CRM-only (no reminder cron/webhook/email escalation by design for now)
- Google Calendar sync requires one-time manual setup: create GCP project, enable Calendar API, create Service Account, share calendar, verify domain for webhooks
- Google Calendar events are display-only overlays in WeekCalendar — they do NOT block availability slots
- Push notification webhooks require domain verification in Google Cloud Console (`moonenvochtwering.nl`)

---

## Changelog

### 2026-02-20 — City-Service SEO Landing Pages
- New data file `src/lib/data/city-services.js`: 40 city x service combinations (8 cities x 5 services) with unique E5 framework copy in Dutch
- Exports: `cityServices`, `getCityService()`, `getAllCityServiceParams()`, `getSiblingServices()`, `getSameCities()`
- New component `CityServicePageLayout.js`: client component with 8 sections (Hero, Local Problems, Solution Approach, Transformation, Evidence, FAQ, CTA, Internal Links)
- JSON-LD structured data on each page: `FAQPage`, `Service`, `BreadcrumbList`
- Reuses existing `FAQAccordion` and `CTASection` marketing components
- New dynamic route: `src/app/(marketing)/vochtbestrijding/[city]/[service]/page.js` with `generateStaticParams()` (40 routes), `generateMetadata()`, `notFound()` guard
- Updated `sitemap.js`: added 40 city-service URLs (priority 0.7, monthly frequency)
- Updated `CityPageLayout.js`: service card links now route to `/vochtbestrijding/{city}/{service}` instead of `/diensten/{service}`

### 2026-02-18 — Bidirectional Google Calendar Sync
- Added `google-auth-library` for Service Account JWT authentication (avoids 200MB `googleapis` package)
- New `src/lib/google/calendar.js`: Google Calendar API client with JWT auth, event CRUD, watch management, sync token handling, and `syncLeadToGoogleCalendar()` helper
- New tables: `google_calendar_events` (synced events with google_event_id, summary, times, status, source), `gcal_sync_state` (key-value for sync_token, channel_id, etc.)
- New column: `leads.google_event_id TEXT`
- Migration: `docs/migrations/2026-02-18-google-calendar-sync.sql`
- **Google → CRM sync**: `POST /api/gcal/webhook` receives push notifications, does incremental sync via sync tokens, upserts events to Supabase
- **Manual sync**: `POST /api/gcal/sync` (auth required, optional `?full=true`)
- **Watch management**: `POST /api/gcal/watch` registers push notification channel (7-day TTL)
- **Event query**: `GET /api/gcal/events?from=&to=` returns synced events for date range
- **Daily cron**: `GET /api/cron/gcal-renew` renews watch channel + safety incremental sync
- **CRM → Google sync**: `syncLeadToGoogleCalendar(lead, action)` integrated into all 6 booking/reschedule/cancel routes (best-effort, never blocks main operation)
- Routes modified: `customer/confirm`, `customer/reschedule`, `customer/cancel`, `customer/book-inspection`, `leads/create-with-booking`, `leads/[id]/reschedule`
- `GoogleEventBlock.jsx`: purple event blocks rendered in WeekCalendar grid with popover details
- `WeekCalendar.jsx`: accepts `googleEvents` prop, maps events to grid cells by date/time, renders alongside existing slot/lead blocks, adds "Google Agenda" legend item
- `GoogleCalendarSettings.jsx`: connection status badge, "Volledige sync", "Push-notificaties vernieuwen", "Verbinding testen" buttons
- Planning page: fetches Google events on load, passes to WeekCalendar, adds "Synchroniseer" button in header
- Settings page: added Google Calendar settings section
- `vercel.json`: added `gcal-renew` cron at `0 6 * * *`
- **Graceful degradation**: all gcal functions check `isConfigured()` and return null/no-op when env vars missing
- New env vars: `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, `GOOGLE_CALENDAR_ID`, `GCAL_WEBHOOK_SECRET`

### 2026-02-19 — Drag-to-Reschedule in WeekCalendar
- `WeekCalendar.jsx`: leads can now be dragged to a new time slot for rescheduling (mouse + touch support)
- Drag uses 3px movement threshold to distinguish clicks (open popover) from drags (initiate reschedule)
- Visual ghost label follows cursor during drag; target cell highlights blue (valid) or red (invalid)
- Dropping on an open slot shows existing reschedule confirmation dialog; dropping on an empty cell auto-creates a slot first
- Dropping on a full/closed slot shows a toast; same-slot drops are no-ops
- Reuses existing `POST /api/leads/[id]/reschedule` API and confirmation email flow
- LeadBlock uses `PopoverAnchor` instead of `PopoverTrigger` for full click/drag control
- Dragged LeadBlock shows reduced opacity; grid cursor changes to `grabbing` during drag
- Touch support via `touchstart`/`touchmove`/`touchend` with `elementFromPoint` for cell detection

### 2026-02-18 — Quote Centralization
- Deleted `InspectionForm.jsx` (old 1195-line form), `inspectie/[id]/page.js` (old route), `leads/[id]/send-quote/route.js` (old API), and marketing `InspectionForm.js`
- All quote flows now route through `QuoteGenerator` at `/dashboard/offerte/nieuw?lead={id}` or `/dashboard/offerte/{quoteId}`
- `getAvailableActions(lead, communication, linkedQuotes)` now accepts `linkedQuotes` param — shows `edit_quote` (with quoteId) when quotes exist, `create_quote` when none
- `getPrimaryAction()` returns "Maak offerte" for `bevestigd` stage
- Lead card dropdown: "Maak offerte" links to `/dashboard/offerte/nieuw?lead={id}` (replaces old inspectie link)
- Lead detail: `sendQuote()` function removed; Linked Quotes section always visible (shows "Nog geen offertes" when empty)
- `POST /api/quotes`: auto-advances lead to `bezocht` when creating a quote linked to a lead at `nieuw`/`uitgenodigd`/`bevestigd`, with `status_change` event logged
- Shared modules kept: `inspection-constants.js`, `pricing.js`, `quote-template.js`

### 2026-02-11 — Standalone Quote Generator
- New `quotes` table with full customer snapshot, line items (incl. BTW), totals, terms, and status tracking
- Migration: `docs/migrations/2026-02-11-quotes-table.sql`
- CRUD API routes: `GET/POST /api/quotes`, `GET/PATCH/DELETE /api/quotes/[id]`
- Send API: `POST /api/quotes/[id]/send` — generates quote number, renders PDF, sends email, updates linked lead
- `QuoteGenerator.jsx`: customer search/selector, diagnose & treatment checkboxes, auto-generate line items from selections, editable line items with incl. BTW pricing, discount controls, PDF preview via Sheet, save as concept or send
- `QuoteList.jsx`: filterable/searchable list with status badges (concept/verzonden/akkoord/afgewezen/verlopen), duplicate, delete
- `PricelistEditor.jsx`: editable pricelist per category (kelder sub-areas, muurinjectie, etc.), staffel editing, extras section, saves to `settings.pricelist`
- Page routes: `/dashboard/offerte` (list), `/dashboard/offerte/nieuw` (new, optional `?lead=ID`), `/dashboard/offerte/[id]` (edit), `/dashboard/offerte/instellingen` (pricelist)
- Sidebar: "Offertes" nav item added between Planning and Instellingen
- Lead detail integration: "Maak offerte" action via `getAvailableActions()`, linked quotes section showing all quotes for a lead
- Auto-create lead: creating a quote without selecting a lead auto-creates one (source: `offerte`)
- Multiple quotes per lead: each with optional label (e.g. "Optie A: alleen muren")
- BTW incl. display: all prices stored/shown incl. BTW, totals show excl. BTW + BTW amount + incl. BTW
- New extras added to `EXTRA_LINE_ITEMS`: MB2K + Kiesol MB (€200/m²), Kim aanhechten (€40/m²), Trap demonteren (€300/stuk), Egaliseren vloer (€25/m²)
- Old InspectionForm removed in Sprint F+ centralization; all quoting now through `QuoteGenerator` + `quotes` table

### 2026-02-10 — Real Pricelist Integration
- Replaced placeholder prices in `DEFAULT_LINE_ITEM_TEMPLATES` with actual Moonen pricelist data (product names, real prices)
- `pricing.js` rewritten: `getStaffelPrijs(basePrijs, staffels, hoeveelheid)` applies volume-based price breaks; `getStaffelLabel()` returns display label; `applyMinimum(unitPrice, quantity, minimum)` enforces minimum totals
- Kelderafdichting muurvlak now generates 4 individual treatment steps: frezen (€100/m²), Kiesol hechtlaag (€15/m²), Sulfatex aanbrandlaag (€50/m²), DS Levell afwerklaag (€70/m²)
- Keldervloer has staffel pricing (≥20m²: €130, ≥30m²: €110, ≥40m²: €90) and minimum (€1.500)
- Afwerking corrected to SP Top White at €90/m²; ventilatie corrected to €100/stuk
- Gevelimpregnatie has staffel (≥50m²: €13/m²)
- Vochtbestendige pleister uses same 4-step treatment as muurvlak
- Added muurinjectie depth selector (10/20/30cm radio buttons) with price per depth (€80/€90/€100 per m¹)
- Depth persisted in `inspection_data_v2.injectie_depth`; defaults to 30cm for old data
- Added `EXTRA_LINE_ITEMS` constant: leidingdoorvoer (€150), schimmel doden (€10/m²), gevel reinigen (€35/m²), spouwrooster (€15), AIR70 (€2.000), frezen verflaag (€70/m² with staffel)
- Collapsible "Veelgebruikte toevoegingen" section in InspectionForm with one-click add buttons
- Visual hints (staffel/minimum labels) shown next to generated line item totals
- Staffels and minimums applied only during generation; all prices remain freely editable after

### 2026-02-10 — CRM Warning Cards + Priority Sorting
- `LeadCard.jsx` redesigned to surface: laatste contact, volgende stap (met uiterlijke datum), afspraakstatus, risicobadge, and warning reason
- Added in-app warning engine in `lead-workflow.js`: `getLeadWarnings()`, `getLeadRiskLevel()`, `getLeadPriorityScore()`, `getNextActionSummary()`, `getLastContactAt()`
- Warning reasons include: stage aging (`te_lang_in_fase`), stale quote without response, and next-day inspection planning gaps
- `isNeedsActionToday()` now uses warning state (`warning.level !== 'none'`)
- `KanbanBoard.jsx` now sorts leads per stage by priority score (urgent first, then oldest touchpoint)
- Dashboard filter label updated to Dutch: `Actie nodig`

### 2026-02-10 — Inspection Form, PDF & Quote System Overhaul
- Replaced 4-step wizard InspectionForm with single scrollable page (3 sections: Diagnose & Oplossing, Foto's & Opmerkingen, Offerte)
- Diagnose is now multi-select (checkboxes), stored as array in `inspection_data_v2.diagnose`; legacy `leads.diagnose` gets comma-joined string
- Oplossing is now multi-select (checkboxes), stored as array in `inspection_data_v2.oplossingen`; legacy `leads.oplossing` gets comma-joined string
- Added kelderafdichting sub-areas: kimnaad, muurvlakken, pilaren, vloer, afwerking — each with checkbox + quantity input + unit-specific line item templates
- Added "Verfijn tekst" AI button on diagnose details: calls `/api/ai/refine-text` using Claude Haiku 4.5 via `@ai-sdk/anthropic`; includes undo support
- Created shared `inspection-constants.js` module with all diagnose/oplossing options, kelder sub-areas, line item templates, and `normalizeDiagnose()`/`normalizeOplossing()` functions
- PDF template updated: `getDefaultIntroText()` handles arrays (multiple solutions → combined intro), `resolveDiagnosis()` and `resolveSolution()` handle both string and array data
- PDF template: added `wrap={false}` on table rows, totals box, terms box, and photos section to prevent element splitting across pages; page 2 uses `wrap` for auto page-break
- PDF viewer replaced Dialog with Sheet (side="right", `sm:!max-w-2xl lg:!max-w-4xl`) for nearly full-width preview
- Offertevoorwaarden section is now collapsible (default closed) to reduce visual noise
- "Genereer regels uit selectie" button explicitly regenerates line items from current oplossing + sub-area selections
- Photo grid now includes hover-to-delete button on each photo
- Installed new dependencies: `ai`, `@ai-sdk/anthropic`, shadcn `checkbox` component
- New env var: `ANTHROPIC_API_KEY`

### 2026-02-10 — Calendar Availability Overhaul
- Replaced dropdown slot picker on `/bevestig` and `/afspraak` with month-view calendar (`SlotCalendar.jsx`)
- Calendar shows full month grid with green dot indicators for available days, Dutch day/month names, mobile-first 44px touch targets
- Clicking a day shows time slot pills; selecting a time activates the confirm button
- Month navigation forward only (no past months), Dutch labels throughout
- Dashboard `WeekCalendar.jsx` enhanced: clicking a booked lead opens a popover with "Open lead" and "Verplaatsen" buttons
- Reschedule mode: blue banner + pulsing open slot targets → click target → AlertDialog confirmation → API call → auto-email
- New `POST /api/leads/[id]/reschedule`: auth-based reschedule with atomic slot swap, event logging, confirmation email to customer
- Open slot popover now includes "Nieuwe aanvraag" button to create leads from phone calls
- New `QuickLeadDialog.jsx`: form with name, phone, email, address, type probleem, toelichting → creates lead as `bevestigd`
- New `POST /api/leads/create-with-booking`: combined lead creation + slot booking (source: `telefoon`, generates tokens, sends confirmation email)
- Planning page passes `onLeadsChange` to WeekCalendar for data refresh after reschedule/create operations
- Added "Nieuwe aanvraag" button to Kanban pipeline page for manual lead creation without appointment
- New `POST /api/leads`: auth-protected, creates lead as `nieuw` with generated tokens and event logging
- New `NewLeadDialog.jsx`: form dialog (name, phone, email, address, type, toelichting) accessible from pipeline page

### 2026-02-10 — Quote Wizard & PDF Overhaul
- Converted logo from 4MB SVG to 60KB PNG (`public/logo/logo.png`); `assets.js` tries PNG first, SVG fallback, then null
- Fixed AAN card text overlap in PDF: added `marginBottom` spacing, split address into `customerStreet`/`customerCity` fields
- Fixed BETREFT card overlap: increased `styles.intro.marginTop` from 2 → 8
- Added `getDefaultIntroText(oplossing)` helper: solution-specific intro text for kelderafdichting, injectie/DPC, gevelimpregnatie, and default
- Quote PDF now uses `quote.introText` from `inspection_data_v2.offerte_inleiding` or auto-generated from solution type
- Updated default payment terms to "Op de eerste werkdag bij aanvang, restant binnen 2 weken na oplevering"
- Added editable "Offertevoorwaarden" section to InspectionForm Step 4: garantie (jaren), doorlooptijd, geldigheid (dagen), betalingsvoorwaarden, inleidende tekst
- New `inspection_data_v2` fields: `geldigheid_dagen` (number), `offerte_inleiding` (string, empty = auto)
- All new fields hydrate from saved data in edit mode and persist via `buildDraftPayload()`
- Adjusted logo image style for square PNG (52x52px in PDF)

### 2026-02-10 — Self-Service Booking & Appointment Management
- Simplified contact form: removed address fields (straat, postcode, plaats), form now sends name/email/phone/type/toelichting
- Contact form auto-sends "Plan uw inspectie" email with booking CTA (replaces generic "bedankt" auto-reply)
- Lead auto-advances to `uitgenodigd` when planning email is sent successfully
- New email template: `plan-inspection.js` with overrides support
- `/bevestig` page now has 2-step flow: Step 1 collects address, Step 2 picks slot
- `/api/customer/confirm` accepts and saves `plaatsnaam`, `postcode`, `straat` from request body
- Confirmation email now includes "Verzetten of annuleren" link to `/afspraak?token=...`
- New `/afspraak` page for customer appointment management (view/reschedule/cancel)
- New API: `GET /api/customer/appointment` — fetch appointment details by token
- New API: `POST /api/customer/reschedule` — reschedule (book new slot, release old, notify admin)
- New API: `POST /api/customer/cancel` — cancel appointment (release slot, status → uitgenodigd, notify admin)
- No hard cutoff on reschedule/cancel — soft 24h warning shown, action always allowed
- Admin always notified by email on reschedule or cancel
- `plaatsnaam` column now nullable (address collected at booking, not contact form)
- Admin notification email handles null plaatsnaam gracefully

### 2026-02-10 — Sprint C++ Quote Generator Refactor
- Added draft PDF preview endpoint (`/api/pdf/quote/preview`) for unsaved quote changes
- Refactored quote PDF styling with light green branding and improved table/totals alignment
- Added quick m² price controls to inspection step 4 and apply-to-all m²-line workflow
- Added optional SF Pro Display font registration with automatic fallback to Helvetica
- Added direct lead-card menu action to open inspectie/offerte and exposed lead ID on lead detail header

### 2026-02-10 — Interactive Calendar Slot Management
- Replaced read-only `WeekCalendar` with fully interactive version: per-cell slot mapping (green=open, amber=full, red=closed)
- Click empty cell to create a single availability slot; drag vertically within a day column to create multiple slots at once
- Click existing slot → shadcn Popover with "Sluiten"/"Openen" toggle and "Verwijderen" (disabled when booked)
- Removed flat "Beschikbaarheid" card and "Genereer 4 weken" button from planning page
- WeekCalendar now receives `onSlotsChange` callback and `interactive` prop; all slot CRUD happens inside the calendar
- Booked leads still render as blue clickable blocks at correct time positions

### 2026-02-10 — Sprint C+ UX Overhaul
- Added `getAvailableActions(lead, communication)` in `lead-workflow.js` for context-aware action buttons
- Lead detail panel now renders dynamic action buttons based on stage + lead state (replaces hardcoded buttons)
- `send-availability` API no longer forces status regression when re-sending from later stages
- Added discount support to inspection form: percentage or fixed amount, recalculated BTW on discounted subtotal
- Inspection form accepts `mode="edit"` — won't regress pipeline status, shows "Opslaan & opnieuw versturen"
- Added PDF preview dialog (iframe) in inspection form step 4
- Added discount row to quote PDF between subtotal and BTW totals
- `send-quote` API skips redundant status/timestamp update when already `offerte_verzonden`
- Added `WeekCalendar.jsx` with CSS Grid week view (09:00–16:00), interactive per-cell slot management, clickable booked leads
- Planning page now uses interactive `WeekCalendar` for all slot CRUD (flat slot list removed)
- Added `EmailTemplateEditor.jsx` with per-template tabs, editable fields (subject, greeting, body, CTA, closing), live preview
- All 4 email templates (`availability`, `confirmation`, `quote`, `follow_up`) accept `overrides` parameter
- All 4 API routes load template overrides from `settings` table before sending emails
- Email template editor added to settings page below existing `SettingsForm`
- Fixed CSS theme: shadcn tokens now use explicit hex values to prevent marketing `prefers-color-scheme: dark` from leaking into dashboard badges

### 2026-02-09 — v2 UX + Insight Finalization
- Added drag-and-drop route ordering on planning page with immediate persistence
- Added persistent dashboard lead filters using local storage
- Improved timeline readability with business labels and actor humanization
- Added lead-header communication chips for "what customer already received"

### 2026-02-09 — v2 Quote Professionalization
- Rebuilt quote PDF into branded 2-page document with summary, pricing, terms, and optional photo section
- Added `quote_number` support with `next_quote_number()` database sequence helper
- Updated quote send flow to generate/validate PDF before email send
- Quote email now includes attached PDF and tokenized public PDF link
- Added PDF render fallback path (without photos) + ops alerting when remote image rendering fails

### 2026-02-09 — v2 Availability + Reliability + Routing
- Added dynamic `availability_slots` model and public slot-based confirmation flow
- Availability email now sends first 4 open moments only
- Added guard to skip availability email when no open slots
- Added `lead_events` audit trail and timeline based on real events
- Added `followup_paused` and follow-up cron guards
- Added ops alerting helper and wired critical API paths
- Added route optimization API (OSRM + fallback)
- Enhanced planning page with day-route optimization, 1/hour scheduling, and persistent route order
- Added inspection v2 4-step wizard with line-item quote builder and `inspection_data_v2` persistence

### 2026-02-09 — Initial Build
- Built full CRM in existing Next.js project
- Implemented pipeline, lead flows, email templates, cron, planning map, inspection and quote flow
