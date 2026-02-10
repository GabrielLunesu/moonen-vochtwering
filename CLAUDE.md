# CLAUDE.md — Moonen Vochtwering

> This file is the single source of truth for any AI assistant working on this codebase.
> Read it fully before writing a single line of code.

---

## What This Is

A Next.js application for **Moonen Vochtwering**, a family-run moisture remediation company in Zuid-Limburg, Netherlands. The app serves two purposes:

1. **Marketing website** — public-facing pages at moonenvochtwering.nl
2. **CRM dashboard** — internal tool at /dashboard for managing leads, inspections, quotes, and follow-ups

The owner is Gabriel (technical, runs the business side). His father does all inspections and field work. The father never touches the dashboard. He receives WhatsApp messages with his daily route and uses a simplified mobile inspection form.

---

## Tech Stack

| Layer | Tool | Notes |
|-------|------|-------|
| Framework | Next.js 15 | App Router, Server Components |
| Styling (marketing) | Tailwind CSS 4 | Marketing pages only |
| Styling (dashboard) | shadcn/ui + Radix UI | New York style, all dashboard UI |
| Database | Supabase (Postgres) | Free tier. RLS enabled. Realtime on `leads` table |
| Auth | Supabase Auth | Magic link or password. Single user (Gabriel) |
| Storage | Supabase Storage | Bucket: `inspection-photos` (public) |
| Email | Resend | Transactional emails. Free tier (3k/month, 100/day) |
| PDF | @react-pdf/renderer | Server-side quote PDF generation |
| Maps | Leaflet + react-leaflet | Dashboard route planning |
| Drag & Drop | @hello-pangea/dnd | Kanban board |
| Hosting | Vercel | Free tier. Cron for daily follow-ups |

**Total infrastructure cost: €0/month**

---

## Project Structure

```
src/
├── app/
│   ├── (marketing)/        # Public website — DO NOT TOUCH without explicit request
│   ├── (dashboard)/        # CRM — requires auth
│   │   └── dashboard/
│   │       ├── page.js             # Kanban pipeline
│   │       ├── lead/[id]/page.js   # Lead detail + timeline
│   │       ├── planning/page.js    # Calendar + route planner
│   │       ├── inspectie/[id]/page.js  # Mobile inspection form
│   │       └── instellingen/page.js    # Settings
│   ├── (public)/           # No auth — customer-facing actions
│   │   ├── bevestig/       # Customer confirms inspection slot
│   │   └── reactie/        # Customer responds to quote
│   ├── login/
│   └── api/                # All API routes
├── lib/
│   ├── supabase/           # client.js, server.js, admin.js
│   ├── email/
│   │   ├── resend.js
│   │   └── templates/      # All email templates (Dutch)
│   ├── pdf/
│   │   └── quote-template.js
│   └── utils/
│       ├── tokens.js       # HMAC for customer action links
│       ├── pipeline.js     # Stage constants, problem types
│       ├── pricing.js      # Quote calculation logic
│       └── whatsapp.js     # WhatsApp deeplink + route formatting
docs/
├── CRM.md                  # Living doc — current state of the CRM (see rules below)
└── schema.sql              # Supabase SQL schema
```

---

## The Rules

### 1. CRM.md Is a Living Document

`docs/CRM.md` describes the current state of the entire CRM system: database schema, API routes, components, pipeline stages, email templates, and deployment config.

**Every time you make a change to the CRM, you must update CRM.md to reflect it.**

This means:
- Add a new API route → add it to the API routes table in CRM.md
- Add a database column → update the schema section in CRM.md
- Add a new component → add it to the component list in CRM.md
- Change a pipeline stage → update the pipeline section in CRM.md
- Change the lead lifecycle → update the lifecycle section in CRM.md

If CRM.md says one thing and the code says another, the code is wrong. Fix the code or update the doc. There is no "I'll update it later."

### 2. No Silent Failures

This is a business that runs on this system. If something fails, someone must know.

**Email failures:** Every Resend API call must be wrapped in try/catch. If an email fails to send, the system must:
1. Log the error to console with full context (lead ID, email type, error message)
2. Send an error notification email to `info@moonenvochtwering.nl` with subject line starting with `[ERROR]`
3. NOT crash the request — return a response indicating partial failure

```javascript
// Pattern for every email send:
try {
  const { data, error } = await resend.emails.send({ /* ... */ });
  if (error) throw error;
  // Log to email_log table
} catch (err) {
  console.error(`[EMAIL_FAIL] ${emailType} to ${recipient}:`, err);
  
  // Notify admin — but don't let THIS fail crash the request either
  try {
    await resend.emails.send({
      from: 'Moonen CRM <info@moonenvochtwering.nl>',
      to: 'info@moonenvochtwering.nl',
      subject: `[ERROR] Email niet verzonden: ${emailType}`,
      text: `Lead: ${leadId}\nType: ${emailType}\nOntvanger: ${recipient}\nFout: ${err.message}\nTijdstip: ${new Date().toISOString()}`
    });
  } catch (notifyErr) {
    console.error('[CRITICAL] Could not send error notification:', notifyErr);
  }
}
```

**Database failures:** Same principle. Log, notify, don't crash. Every Supabase call should check for errors:

```javascript
const { data, error } = await supabase.from('leads').select('*');
if (error) {
  console.error('[DB_FAIL]', error);
  // Handle gracefully — show user-friendly message, not a blank screen
}
```

**Cron failures:** The daily follow-up cron at `/api/cron/follow-ups` must send an error email if it fails partway through. It should process all eligible leads and report: X sent successfully, Y failed, with details on failures.

### 3. The 60-Year-Old Test

The dashboard must be usable by someone who has never seen the system before and is not technical. That means:

**Visual clarity over density.** Every screen answers one question at a glance:
- Pipeline page: "Where do my leads stand?"
- Lead detail: "What happened with this customer and what do I do next?"
- Planning page: "Who am I visiting tomorrow and in what order?"
- Inspection form: "What do I fill in and how much does it cost?"

**Dutch labels everywhere.** No English in the UI. Not "status" but "Status." Not "leads" but "Aanvragen." Not "pipeline" but "Overzicht." Buttons say what they do: "Verstuur beschikbaarheid", "Genereer offerte", "Stuur naar papa."

**Color = meaning.** Pipeline stages use consistent colors:
- Nieuw = blue
- Uitgenodigd = purple
- Bevestigd = indigo
- Bezocht = yellow
- Offerte verzonden = orange
- Akkoord = green
- Verloren = red

**No dead ends.** Every screen has a clear next action. Lead detail always shows the next logical step as a prominent button. After saving an inspection, the obvious action is "Genereer offerte." After generating a quote, it's "Verstuur naar klant."

**Forgiving.** Undo where possible. Confirm before destructive actions. Show "Weet u het zeker?" before marking a lead as lost.

**The customer journey is visible.** On the lead detail page, anyone looking at a lead should immediately understand:
- When this lead came in
- Every email they received (and when)
- Every action the customer took
- What stage they're in and how long they've been there
- What the next step is

This is the timeline. It must be complete, chronological, and human-readable.

### 4. The Marketing Site Is Sacred

The marketing pages in `(marketing)/` are the public face of the business. Do not modify marketing components unless explicitly asked. The marketing site uses its own CSS and layout. The dashboard uses shadcn/ui. They coexist through Next.js route groups but should never bleed into each other.

### 5. Customer-Facing Pages Must Be Bulletproof

`/bevestig` and `/reactie` are pages real customers land on from email links. They must:
- Work on every device (phone, tablet, desktop)
- Load fast (no heavy JS bundles)
- Handle expired/invalid tokens gracefully ("Deze link is niet meer geldig")
- Show clear confirmation ("Uw inspectie is bevestigd voor woensdag ochtend")
- Never show an error screen or blank page
- Never require login

### 6. Email Content Is in Dutch

All automated emails are in Dutch. Tone: warm, professional, personal. Not corporate. Not casual. Like a letter from a trusted local craftsman.

Emails always come from: `Moonen Vochtwering <info@moonenvochtwering.nl>`
Reply-to: `info@moonenvochtwering.nl`

### 7. Supabase Key Format

Supabase uses the new key format (Feb 2026):
- `sb_publishable_` replaces the legacy `anon` key (client-safe, respects RLS)
- `sb_secret_` replaces the legacy `service_role` key (server-only, bypasses RLS)

Use the admin client (`lib/supabase/admin.js`) with the secret key only for:
- Cron jobs
- Customer token verification (no auth context)
- Server-side operations that need to bypass RLS

Everything else uses the server client (`lib/supabase/server.js`) with the publishable key + cookies.

---

## Pipeline Stages

```
nieuw → uitgenodigd → bevestigd → bezocht → offerte_verzonden → akkoord
                                                                  ↓
                                                              verloren
```

These are defined in `lib/utils/pipeline.js`. If you add or change a stage, update that file AND CRM.md.

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
RESEND_API_KEY
TOKEN_SECRET                    # HMAC signing for customer action links
CRON_SECRET                     # Vercel cron authentication
NEXT_PUBLIC_SITE_URL            # https://moonenvochtwering.nl
```

Never commit these. They live in `.env.local` and Vercel environment settings.

---

## Common Patterns

### Creating a new API route

```javascript
// src/app/api/example/route.js
import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const supabase = await createServerClient();
  
  // Check auth for dashboard routes
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { data, error } = await supabase.from('leads').select('*');
  if (error) {
    console.error('[API_ERROR] /api/example:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(data);
}
```

### Sending an email with error handling

```javascript
import { resend } from '@/lib/email/resend';

async function sendEmailSafe({ to, subject, html, leadId, emailType }) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Moonen Vochtwering <info@moonenvochtwering.nl>',
      replyTo: 'info@moonenvochtwering.nl',
      to,
      subject,
      html,
    });
    
    if (error) throw error;
    
    // Log success
    await supabaseAdmin.from('email_log').insert({
      lead_id: leadId,
      type: emailType,
      to_email: to,
      subject,
      resend_id: data?.id,
    });
    
    return { success: true, id: data?.id };
  } catch (err) {
    console.error(`[EMAIL_FAIL] ${emailType} to ${to}:`, err);
    
    // Send error notification
    try {
      await resend.emails.send({
        from: 'Moonen CRM <info@moonenvochtwering.nl>',
        to: 'info@moonenvochtwering.nl',
        subject: `[ERROR] Email niet verzonden: ${emailType}`,
        text: [
          `Lead ID: ${leadId}`,
          `Type: ${emailType}`,
          `Ontvanger: ${to}`,
          `Fout: ${err.message}`,
          `Tijdstip: ${new Date().toISOString()}`,
        ].join('\n'),
      });
    } catch (notifyErr) {
      console.error('[CRITICAL] Error notification also failed:', notifyErr);
    }
    
    return { success: false, error: err.message };
  }
}
```

### Logging a pipeline event

```javascript
// Every status change, email send, or customer action gets logged
async function logEvent(leadId, eventType, { oldValue, newValue, metadata, actor } = {}) {
  const { error } = await supabaseAdmin.from('lead_events').insert({
    lead_id: leadId,
    event_type: eventType,
    old_value: oldValue || null,
    new_value: newValue || null,
    metadata: metadata || null,
    actor: actor || 'system',
  });
  
  if (error) {
    console.error(`[EVENT_LOG_FAIL] ${eventType} for lead ${leadId}:`, error);
    // Don't throw — event logging failure should never block the main operation
  }
}

// Usage:
await logEvent(lead.id, 'status_change', {
  oldValue: 'nieuw',
  newValue: 'uitgenodigd',
  actor: 'gabriel',
});

await logEvent(lead.id, 'email_sent', {
  metadata: { type: 'availability', subject: 'Uw gratis inspectie' },
});

await logEvent(lead.id, 'customer_response', {
  newValue: 'akkoord',
  actor: 'customer',
});
```

---

## What Not To Do

- **Don't use `console.log` for errors.** Use `console.error` with a tag: `[EMAIL_FAIL]`, `[DB_FAIL]`, `[API_ERROR]`, `[CRON_ERROR]`.
- **Don't swallow errors silently.** Every catch block must log and (where applicable) notify.
- **Don't add npm packages without justification.** The bundle is lean. Keep it that way.
- **Don't put English in the UI.** All user-facing text is Dutch.
- **Don't modify marketing components** unless the request is specifically about the marketing site.
- **Don't hardcode business logic.** Pricing, follow-up days, inspection capacity — these go in the `settings` table, not in code.
- **Don't forget CRM.md.** If you changed the CRM and didn't update the doc, you're not done.

---

## About the Business

Moonen Vochtwering is een familiebedrijf uit Heerlen dat al meer dan vijftien jaar vochtproblemen oplost in Zuid-Limburg. Van Maastricht tot Echt, van Kerkrade tot Valkenburg — wij kennen de woningen in deze regio. De mergelbouw, de oude kelders, de specifieke grondwaterstanden per wijk.

Onze specialisatie: kelders waterdicht maken, opstijgend vocht behandelen door middel van muurinjectie, schimmel definitief verwijderen, en gevels beschermen tegen doorslaand vocht. Geen halve maatregelen. Wij pakken de oorzaak aan, niet het symptoom.

De eigenaar komt persoonlijk bij u langs voor een gratis inspectie, beoordeelt de situatie ter plekke, en geeft eerlijk advies. Soms is dat minder dan u verwacht. Wij verdienen liever uw vertrouwen dan een opdracht die u niet nodig heeft.

Met meer dan duizend droge kelders achter onze naam werken wij uitsluitend met materialen die wij zelf zouden gebruiken in ons eigen huis. Op al onze werkzaamheden geven wij garantie. Niet omdat het moet, maar omdat wij weten dat het werkt.

Moonen Vochtwering. Droog is ons vak.