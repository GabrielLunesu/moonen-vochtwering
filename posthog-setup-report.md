<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into Moonen Vochtwering. Both client-side and server-side tracking are set up, covering the full customer journey from first website visit through to a signed quote. A reverse proxy routes PostHog traffic through the app itself to minimise ad-blocker interference. User identification is wired up on login so all CRM activity is attributed to Gabriel.

## New files created

| File | Purpose |
|------|---------|
| `instrumentation-client.js` | Client-side PostHog initialisation (Next.js 15.3+ pattern). Loads on every page. Includes exception capture and EU reverse proxy. |
| `src/lib/posthog-server.js` | Lightweight server-side PostHog client factory (`posthog-node`). Used in API routes for server-side event capture. |

## Files modified

| File | Change |
|------|--------|
| `next.config.mjs` | Added EU reverse proxy rewrites (`/ingest/*` → `eu.i.posthog.com`) and `skipTrailingSlashRedirect: true` |
| `src/app/login/page.js` | `posthog.identify()` + `posthog.capture('user_logged_in')` on successful login |
| `src/app/components/marketing/InspectionWizard.js` | 4 capture calls covering the full wizard funnel + `captureException` on errors |
| `src/app/api/contact/route.js` | Server-side `website_lead_received` event after lead insert |
| `src/app/api/leads/route.js` | Server-side `lead_created` event after manual CRM lead creation |
| `src/app/api/customer/confirm/route.js` | Server-side `inspection_confirmed` event after customer confirms slot |
| `src/app/api/customer/quote-response/route.js` | Server-side `quote_response_received` event with response value |
| `src/app/api/quotes/[id]/send/route.js` | Server-side `quote_sent` event after quote email is dispatched |

## Event tracking table

| Event name | Description | File |
|-----------|-------------|------|
| `inspection_wizard_contact_submitted` | Visitor completes step 1 of the inspection wizard (contactgegevens ingevuld) | `src/app/components/marketing/InspectionWizard.js` |
| `inspection_wizard_path_chosen` | Visitor chooses "Direct inplannen" (booking) or "Bericht versturen" (contact_only) | `src/app/components/marketing/InspectionWizard.js` |
| `inspection_booking_completed` | Visitor successfully books a free inspection slot — top marketing conversion event | `src/app/components/marketing/InspectionWizard.js` |
| `contact_form_submitted` | Visitor chose contact-only path and submitted successfully | `src/app/components/marketing/InspectionWizard.js` |
| `user_logged_in` | Gabriel logs into the CRM — triggers PostHog user identification | `src/app/login/page.js` |
| `website_lead_received` | New lead arrives via the website form (server-side) | `src/app/api/contact/route.js` |
| `lead_created` | New lead manually created in the CRM via phone (server-side) | `src/app/api/leads/route.js` |
| `inspection_confirmed` | Customer confirms their inspection slot via the /bevestig page (server-side) | `src/app/api/customer/confirm/route.js` |
| `quote_sent` | Quote PDF emailed to a customer — major pipeline milestone (server-side) | `src/app/api/quotes/[id]/send/route.js` |
| `quote_response_received` | Customer responds to a quote: akkoord / vraag / nee (server-side) | `src/app/api/customer/quote-response/route.js` |

## Next steps

We've built a pinned dashboard and five insights to track the business:

- **Dashboard**: [Analytics basics](https://eu.posthog.com/project/130363/dashboard/536153)

### Insights

1. [Inspectie wizard conversietrechter](https://eu.posthog.com/project/130363/insights/nUBWou9T) — Funnel: contactgegevens → keuze → inspectie geboekt
2. [Aanvragen en boekingen per week](https://eu.posthog.com/project/130363/insights/XQwJEsXD) — Weekly trend of website leads, bookings and manual CRM entries
3. [CRM verkooptrechter (inspectie → offerte → akkoord)](https://eu.posthog.com/project/130363/insights/u8ZaatDO) — Pipeline funnel from confirmed inspection to quote response
4. [Offerteresultaten (akkoord / vraag / afgewezen)](https://eu.posthog.com/project/130363/insights/C633KJHQ) — Monthly breakdown of quote outcomes
5. [Wizard padkeuze: direct boeken vs bericht](https://eu.posthog.com/project/130363/insights/No6w7SKC) — Pie chart: how visitors split between booking directly vs sending a message

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/posthog-integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
