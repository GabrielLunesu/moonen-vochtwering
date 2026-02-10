# Moonen Vochtwering — CRM & Quoting Webapp

> **Living document** — last updated: 10 Feb 2026

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
- ✅ Flexible stage actions: `getAvailableActions(lead, communication)` returns context-aware buttons per stage
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
- ✅ Faster quote navigation: each lead card menu includes "Open inspectie / offerte", and lead detail now shows visible lead ID

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

### Operational Setup Still Needed
- [ ] Resend domain verification (`moonenvochtwering.nl`) + working `RESEND_API_KEY`
- [ ] Supabase Storage bucket `inspection-photos` (public)
- [ ] Vercel deployment with all env vars
- [ ] End-to-end production flow test
- [ ] Ensure latest migrations are applied in Supabase (including `2026-02-09-quote-numbering.sql`)

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
| Hosting/Cron | Vercel | Free tier | Free |

---

## Architecture

### Route Groups

```
src/app/
├── (marketing)/                 # Public website
├── (dashboard)/dashboard/       # Authenticated CRM
│   ├── page.js                  # Kanban
│   ├── lead/[id]/page.js        # Lead detail + event timeline
│   ├── planning/page.js         # Week calendar + day route planner + availability management
│   ├── inspectie/[id]/page.js   # On-site inspection form (create/edit mode)
│   └── instellingen/page.js     # Settings + email template editor
├── (public)/                    # Token-based customer actions
│   ├── bevestig/page.js         # Address form → pick slot → confirm
│   ├── afspraak/page.js         # View/reschedule/cancel appointment
│   └── reactie/page.js          # Quote response
├── api/                         # CRM APIs
└── middleware.js                # Protect /dashboard/*
```

### Key Library Modules

```
src/lib/
├── supabase/{client,server,admin}.js
├── email/{resend.js,templates/*}    # Templates: plan-inspection, availability, confirmation, quote, follow-up, admin-notification
├── pdf/{quote-template.js,assets.js,fonts.js}
├── ops/alerts.js                # Ops notifications (email/webhook)
└── utils/
    ├── events.js                # lead_events logger
    ├── lead-workflow.js         # getAvailableActions, getPrimaryAction, stage aging, communication snapshot
    ├── tokens.js
    ├── pipeline.js
    ├── pricing.js
    └── whatsapp.js
```

---

## API Routes

| Method | Route | Auth | Purpose |
|-------|-------|------|---------|
| POST | `/api/contact` | Public | Contact form → lead + emails |
| GET | `/api/leads` | Auth | List leads |
| GET | `/api/leads/[id]` | Auth | Get lead |
| PATCH | `/api/leads/[id]` | Auth | Update lead (status, notes, follow-up pause, route/time) |
| GET | `/api/leads/[id]/events` | Auth | Lead event history |
| POST | `/api/leads/[id]/send-availability` | Auth | Send availability email (first 4 open slots) |
| POST | `/api/leads/[id]/send-quote` | Auth | Send quote email |
| GET | `/api/pdf/quote/[id]` | Auth or quote token | Render quote PDF |
| POST | `/api/pdf/quote/preview` | Auth | Render draft quote PDF preview |
| GET/POST | `/api/availability` | Auth | List/create availability slots |
| PATCH/DELETE | `/api/availability/[id]` | Auth | Update/remove slot |
| POST | `/api/availability/generate` | Auth | Generate future slots from settings |
| GET | `/api/availability/public` | Public | Public list of open future slots |
| POST | `/api/customer/confirm` | Public token | Confirm inspection slot (atomic booking) + save address |
| GET | `/api/customer/appointment` | Public token | Fetch lead appointment details by token |
| POST | `/api/customer/reschedule` | Public token | Reschedule appointment (book new slot, release old) |
| POST | `/api/customer/cancel` | Public token | Cancel appointment (release slot, status → uitgenodigd) |
| POST | `/api/customer/quote-response` | Public token | Customer quote response |
| GET/PATCH | `/api/settings` | Auth | CRM settings |
| POST | `/api/route/optimize` | Auth | OSRM route optimize + fallback |
| GET | `/api/cron/follow-ups` | `CRON_SECRET` | Follow-up engine |
| POST | `/api/upload` | Auth | Upload inspection photos |
| GET | `/api/geocode` | Public | Nominatim proxy |

---

## Database Schema (Current)

### `leads` additions relevant to v2
- `plaatsnaam TEXT NULL` (nullable — address collected at booking, not form submit)
- `postcode TEXT` (saved from /bevestig address step)
- `availability_slot_id UUID` → linked booked slot
- `followup_paused BOOLEAN DEFAULT false`
- `route_position INT`
- `inspection_data_v2 JSONB` (includes `discount_type`, `discount_value`, `discount_amount`, `m2_unit_price` when applicable)
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

### Existing core tables
- `leads`
- `email_log`
- `settings`

### RLS
- `leads`, `email_log`, `settings`, `availability_slots`, `lead_events` all have authenticated access policies
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
8. Inspection + quote flow continues as before
9. Follow-up cron runs with strict guards and pause support

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

# Ops alerts
OPS_ALERT_EMAIL=info@moonenvochtwering.nl
OPS_ALERT_WEBHOOK_URL=
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

---

## Roadmap (From Here)

### Sprint A — UX + Insight Finalization (Completed)
- Added drag-to-reorder for day route list with immediate `route_position` persistence
- Added richer timeline labels (humanized stage/email events + actor display)
- Added lead detail "klant ontvangen" chips in the main header
- Added saved dashboard filters: `Needs action`, `Geen reactie >3d`, `Wacht op offerte reactie`

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

### Sprint D — Operator Simplicity (Next)
- Add settings UI for `line_item_templates` and quote defaults (BTW, guarantee, validity)
- Add route start/end anchor support (home base) for more accurate OSRM planning

### Sprint E — Production Hardening
- Move runtime to Node 20+ in deployment
- Add smoke checks (contact -> availability -> confirm -> inspectie -> quote -> response)
- Add scheduled health checks for cron and ops alert delivery
- Run final UAT checklist on mobile for on-site quoting flow

---

## Known Limitations / Next Work

- Settings UI for editing `line_item_templates` is not yet implemented (defaults + API support are in place)
- Email template overrides stored in `settings` table as `email_template_{type}` JSONB keys (no migration needed)
- OSRM public endpoint may rate-limit; fallback exists but is less accurate
- Node 18 warning appears in builds via Supabase SDK; upgrade runtime to Node 20+
- Availability slot management is fully interactive in the week calendar (flat list removed)
- SF Pro Display in PDFs requires adding font files to `public/fonts/`; otherwise Helvetica is used

---

## Changelog

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
