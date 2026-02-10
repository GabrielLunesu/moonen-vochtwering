# Moonen Vochtwering — CRM & Quoting Webapp

> **Living document** — last updated: 9 Feb 2026

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
│   ├── planning/page.js         # Availability + day route planner
│   ├── inspectie/[id]/page.js   # On-site inspection form
│   └── instellingen/page.js     # Settings
├── (public)/                    # Token-based customer actions
│   ├── bevestig/page.js         # Pick slot + confirm
│   └── reactie/page.js          # Quote response
├── api/                         # CRM APIs
└── middleware.js                # Protect /dashboard/*
```

### Key Library Modules

```
src/lib/
├── supabase/{client,server,admin}.js
├── email/{resend.js,templates/*}
├── pdf/quote-template.js
├── ops/alerts.js                # Ops notifications (email/webhook)
└── utils/
    ├── events.js                # lead_events logger
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
| GET/POST | `/api/availability` | Auth | List/create availability slots |
| PATCH/DELETE | `/api/availability/[id]` | Auth | Update/remove slot |
| POST | `/api/availability/generate` | Auth | Generate future slots from settings |
| GET | `/api/availability/public` | Public | Public list of open future slots |
| POST | `/api/customer/confirm` | Public token | Confirm inspection slot (atomic booking) |
| POST | `/api/customer/quote-response` | Public token | Customer quote response |
| GET/PATCH | `/api/settings` | Auth | CRM settings |
| POST | `/api/route/optimize` | Auth | OSRM route optimize + fallback |
| GET | `/api/cron/follow-ups` | `CRON_SECRET` | Follow-up engine |
| POST | `/api/upload` | Auth | Upload inspection photos |
| GET | `/api/geocode` | Public | Nominatim proxy |

---

## Database Schema (Current)

### `leads` additions relevant to v2
- `availability_slot_id UUID` → linked booked slot
- `followup_paused BOOLEAN DEFAULT false`
- `route_position INT`
- `inspection_data_v2 JSONB`
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

1. Lead enters via contact form (`status = nieuw`)
2. Gabriel sends availability email:
   - backend selects first 4 future open slots
   - if none exist: API returns conflict and email is not sent
3. Customer opens `/bevestig` and picks a real slot
4. Backend books slot atomically; if full in the meantime, customer gets retry state
5. Lead becomes `bevestigd`, confirmation emails/log/events created
6. Inspection + quote flow continues as before
7. Follow-up cron runs with strict guards and pause support

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

### Sprint C — Operator Simplicity
- Add settings UI for `line_item_templates` and quote defaults (BTW, guarantee, validity)
- Add one-click weekly slot generator presets (e.g. next 4 Wednesdays/Thursdays)
- Add route start/end anchor support (home base) for more accurate OSRM planning

### Sprint D — Production Hardening
- Move runtime to Node 20+ in deployment
- Add smoke checks (contact -> availability -> confirm -> inspectie -> quote -> response)
- Add scheduled health checks for cron and ops alert delivery
- Run final UAT checklist on mobile for on-site quoting flow

---

## Known Limitations / Next Work

- Settings UI for editing line-item templates is not implemented yet (defaults + API support are in place)
- OSRM public endpoint may rate-limit; fallback exists but is less accurate
- Node 18 warning appears in builds via Supabase SDK; upgrade runtime to Node 20+

---

## Changelog

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
