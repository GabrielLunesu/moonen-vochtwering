/**
 * Google Calendar API client using Service Account JWT auth.
 *
 * Graceful degradation: if GOOGLE_SERVICE_ACCOUNT_EMAIL is not set,
 * every export becomes a no-op so the app works without Google Calendar.
 */

import { GoogleAuth } from 'google-auth-library';
import { createAdminClient } from '@/lib/supabase/admin';
import { notifyOpsAlert } from '@/lib/ops/alerts';

const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const TIMEZONE = 'Europe/Amsterdam';

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

function isConfigured() {
  return !!(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY &&
    process.env.GOOGLE_CALENDAR_ID
  );
}

let _auth = null;

/**
 * Normalize a private key that may be stored in various formats:
 * - With or without PEM header/footer
 * - With literal \n or real newlines
 * - With leading/trailing whitespace or stray characters
 */
function normalizePrivateKey(raw) {
  let key = raw.replace(/\\n/g, '\n').trim();

  // Strip PEM header/footer if present, then re-add them
  key = key
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');

  // Fix common copy-paste artifact: leading 'n' from '\n' in JSON
  if (key.startsWith('nMIIE')) {
    key = key.slice(1);
  }

  // Re-wrap in PEM format with 64-char lines
  const lines = key.match(/.{1,64}/g) || [];
  return `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----\n`;
}

function getAuth() {
  if (!isConfigured()) return null;
  if (_auth) return _auth;

  _auth = new GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: normalizePrivateKey(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY),
    },
    scopes: SCOPES,
  });

  return _auth;
}

async function getAccessToken() {
  const auth = getAuth();
  if (!auth) return null;
  const client = await auth.getClient();
  const { token } = await client.getAccessToken();
  return token;
}

function calendarId() {
  return encodeURIComponent(process.env.GOOGLE_CALENDAR_ID);
}

// ---------------------------------------------------------------------------
// Low-level fetch helper
// ---------------------------------------------------------------------------

async function gcalFetch(path, { method = 'GET', body, query } = {}) {
  const token = await getAccessToken();
  if (!token) return null;

  let url = `${CALENDAR_API}${path}`;
  if (query) {
    const qs = new URLSearchParams(query).toString();
    url += `?${qs}`;
  }

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (method === 'DELETE' && res.status === 204) return { deleted: true };

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Google Calendar API ${method} ${path} → ${res.status}: ${text}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

// ---------------------------------------------------------------------------
// Event CRUD
// ---------------------------------------------------------------------------

/**
 * Create a Google Calendar event for an inspection.
 * Returns the created event object or null if not configured.
 */
export async function createCalendarEvent({ summary, description, date, startTime, endTime, location }) {
  if (!isConfigured()) return null;

  const startDateTime = `${date}T${startTime || '09:00'}:00`;
  const endDateTime = `${date}T${endTime || '10:00'}:00`;

  const event = await gcalFetch(`/calendars/${calendarId()}/events`, {
    method: 'POST',
    body: {
      summary,
      description: description || '',
      location: location || '',
      start: { dateTime: startDateTime, timeZone: TIMEZONE },
      end: { dateTime: endDateTime, timeZone: TIMEZONE },
    },
  });

  return event;
}

/**
 * Update an existing Google Calendar event.
 */
export async function updateCalendarEvent(googleEventId, { summary, description, date, startTime, endTime, location }) {
  if (!isConfigured() || !googleEventId) return null;

  const body = {};
  if (summary !== undefined) body.summary = summary;
  if (description !== undefined) body.description = description;
  if (location !== undefined) body.location = location;
  if (date && startTime) {
    body.start = { dateTime: `${date}T${startTime}:00`, timeZone: TIMEZONE };
    body.end = { dateTime: `${date}T${endTime || startTime}:00`, timeZone: TIMEZONE };
  }

  const event = await gcalFetch(`/calendars/${calendarId()}/events/${encodeURIComponent(googleEventId)}`, {
    method: 'PATCH',
    body,
  });

  return event;
}

/**
 * Delete a Google Calendar event.
 */
export async function deleteCalendarEvent(googleEventId) {
  if (!isConfigured() || !googleEventId) return null;

  await gcalFetch(`/calendars/${calendarId()}/events/${encodeURIComponent(googleEventId)}`, {
    method: 'DELETE',
  });

  return true;
}

// ---------------------------------------------------------------------------
// Sync: fetch changes from Google
// ---------------------------------------------------------------------------

/**
 * Incremental or full sync from Google Calendar.
 * Uses syncToken if available; otherwise does a full sync from 30 days ago.
 * Returns { events, nextSyncToken }.
 */
export async function fetchCalendarChanges(syncToken = null) {
  if (!isConfigured()) return { events: [], nextSyncToken: null };

  const allEvents = [];
  let pageToken = null;
  let nextSyncToken = null;

  do {
    const query = {
      singleEvents: 'true',
      maxResults: '250',
    };

    if (syncToken && !pageToken) {
      query.syncToken = syncToken;
    } else if (!syncToken) {
      // Full sync: fetch events from 30 days ago to 90 days ahead
      const now = new Date();
      const past = new Date(now);
      past.setDate(past.getDate() - 30);
      const future = new Date(now);
      future.setDate(future.getDate() + 90);
      query.timeMin = past.toISOString();
      query.timeMax = future.toISOString();
    }

    if (pageToken) {
      query.pageToken = pageToken;
    }

    let data;
    try {
      data = await gcalFetch(`/calendars/${calendarId()}/events`, { query });
    } catch (err) {
      // If syncToken is expired/invalid (410 Gone), fall back to full sync
      if (syncToken && err.message?.includes('410')) {
        console.error('[GCAL] Sync token expired, doing full sync');
        return fetchCalendarChanges(null);
      }
      throw err;
    }

    if (!data) return { events: [], nextSyncToken: null };

    const items = data.items || [];
    allEvents.push(...items);

    pageToken = data.nextPageToken || null;
    if (data.nextSyncToken) {
      nextSyncToken = data.nextSyncToken;
    }
  } while (pageToken);

  return { events: allEvents, nextSyncToken };
}

// ---------------------------------------------------------------------------
// Watch (push notifications)
// ---------------------------------------------------------------------------

/**
 * Register a watch channel for push notifications.
 * Returns { channelId, resourceId, expiration }.
 */
export async function registerWatch() {
  if (!isConfigured()) return null;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://moonenvochtwering.nl';
  const channelId = `gcal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const data = await gcalFetch(`/calendars/${calendarId()}/events/watch`, {
    method: 'POST',
    body: {
      id: channelId,
      type: 'web_hook',
      address: `${siteUrl}/api/gcal/webhook`,
      token: process.env.GCAL_WEBHOOK_SECRET || '',
      params: {
        // Request events channel (not just existence)
        ttl: String(7 * 24 * 3600), // 7 days in seconds
      },
    },
  });

  return {
    channelId: data.id,
    resourceId: data.resourceId,
    expiration: data.expiration,
  };
}

/**
 * Stop an existing watch channel.
 */
export async function stopWatch(channelId, resourceId) {
  if (!isConfigured() || !channelId || !resourceId) return null;

  try {
    await gcalFetch('/channels/stop', {
      method: 'POST',
      body: { id: channelId, resourceId },
    });
  } catch (err) {
    // 404 means channel already expired — not an error
    if (!err.message?.includes('404')) {
      throw err;
    }
  }

  return true;
}

// ---------------------------------------------------------------------------
// Sync state persistence (Supabase)
// ---------------------------------------------------------------------------

export async function getSyncState(key) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('gcal_sync_state')
    .select('value')
    .eq('key', key)
    .single();
  return data?.value || null;
}

export async function setSyncState(key, value) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('gcal_sync_state')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (error) {
    console.error(`[GCAL] Failed to save sync state "${key}":`, error);
  }
}

// ---------------------------------------------------------------------------
// Upsert synced events to Supabase
// ---------------------------------------------------------------------------

/**
 * Process a batch of Google Calendar events and upsert them into
 * the `google_calendar_events` table.
 */
export async function upsertSyncedEvents(googleEvents) {
  if (!googleEvents.length) return;

  const supabase = createAdminClient();

  for (const ev of googleEvents) {
    const isAllDay = !!(ev.start?.date);
    const startTime = isAllDay
      ? `${ev.start.date}T00:00:00+01:00`
      : ev.start?.dateTime;
    const endTime = isAllDay
      ? `${ev.end.date}T23:59:59+01:00`
      : ev.end?.dateTime;

    const status = ev.status === 'cancelled' ? 'cancelled' : 'confirmed';

    const row = {
      google_event_id: ev.id,
      summary: ev.summary || '(Geen titel)',
      description: ev.description || null,
      location: ev.location || null,
      start_time: startTime,
      end_time: endTime,
      is_all_day: isAllDay,
      status,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('google_calendar_events')
      .upsert(row, { onConflict: 'google_event_id' });

    if (error) {
      console.error(`[GCAL] Failed to upsert event ${ev.id}:`, error);
    }
  }
}

// ---------------------------------------------------------------------------
// High-level: sync lead inspection to Google Calendar (best-effort)
// ---------------------------------------------------------------------------

/**
 * Create, update, or delete a Google Calendar event for a lead's inspection.
 * Never throws — logs + alerts on failure.
 *
 * @param {object} lead — the lead row (must include id, name, plaatsnaam, etc.)
 * @param {'create'|'update'|'delete'} action
 * @param {object} [overrides] — optional { date, time } for updates
 */
export async function syncLeadToGoogleCalendar(lead, action, overrides = {}) {
  if (!isConfigured()) return;

  const supabase = createAdminClient();

  try {
    const date = overrides.date || lead.inspection_date;
    const time = overrides.time || lead.inspection_time || '09:00';
    const timeParts = time.split(':');
    const endHour = String(Number(timeParts[0]) + 1).padStart(2, '0');
    const endTime = `${endHour}:${timeParts[1] || '00'}`;

    const location = [lead.plaatsnaam, lead.postcode].filter(Boolean).join(' ');
    const summary = `Inspectie: ${lead.name}`;
    const description = [
      `Klant: ${lead.name}`,
      lead.phone ? `Tel: ${lead.phone}` : null,
      lead.email ? `Email: ${lead.email}` : null,
      lead.type_probleem ? `Probleem: ${lead.type_probleem}` : null,
      lead.message ? `\n${lead.message}` : null,
    ].filter(Boolean).join('\n');

    if (action === 'create') {
      const event = await createCalendarEvent({
        summary,
        description,
        date,
        startTime: time,
        endTime,
        location,
      });

      if (event?.id) {
        // Save google_event_id on lead
        await supabase
          .from('leads')
          .update({ google_event_id: event.id })
          .eq('id', lead.id);

        // Also store in synced events table
        await upsertSyncedEvents([event]);
      }
    } else if (action === 'update' && lead.google_event_id) {
      const event = await updateCalendarEvent(lead.google_event_id, {
        summary,
        description,
        date,
        startTime: time,
        endTime,
        location,
      });

      if (event) {
        await upsertSyncedEvents([event]);
      }
    } else if (action === 'delete' && lead.google_event_id) {
      await deleteCalendarEvent(lead.google_event_id);

      // Mark as cancelled in synced events table
      await supabase
        .from('google_calendar_events')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('google_event_id', lead.google_event_id);

      // Clear google_event_id on lead
      await supabase
        .from('leads')
        .update({ google_event_id: null })
        .eq('id', lead.id);
    }
  } catch (err) {
    console.error(`[GCAL] syncLeadToGoogleCalendar ${action} failed for lead ${lead.id}:`, err);
    await notifyOpsAlert({
      source: 'syncLeadToGoogleCalendar',
      message: `Google Calendar ${action} failed`,
      error: err,
      context: { lead_id: lead.id, action },
    });
    // Never throw — best effort only
  }
}
