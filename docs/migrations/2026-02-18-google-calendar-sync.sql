-- Google Calendar Sync Migration
-- Run in Supabase SQL Editor

-- ===== GOOGLE CALENDAR EVENTS =====
-- Stores synced events from Google Calendar (personal + CRM-created)
CREATE TABLE google_calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  google_event_id TEXT NOT NULL UNIQUE,
  summary TEXT NOT NULL DEFAULT '(Geen titel)',
  description TEXT,
  location TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_all_day BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'tentative')),
  source TEXT NOT NULL DEFAULT 'google' CHECK (source IN ('google', 'crm')),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_gcal_events_time ON google_calendar_events(start_time, end_time);
CREATE INDEX idx_gcal_events_status ON google_calendar_events(status);
CREATE INDEX idx_gcal_events_lead ON google_calendar_events(lead_id);

-- ===== GCAL SYNC STATE =====
-- Key-value store for sync tokens, channel info, etc.
CREATE TABLE gcal_sync_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== ADD google_event_id TO LEADS =====
ALTER TABLE leads ADD COLUMN IF NOT EXISTS google_event_id TEXT;

-- ===== ROW LEVEL SECURITY =====
ALTER TABLE google_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE gcal_sync_state ENABLE ROW LEVEL SECURITY;

-- Authenticated users get full access
CREATE POLICY "auth_all_gcal_events" ON google_calendar_events
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "auth_all_gcal_sync_state" ON gcal_sync_state
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
