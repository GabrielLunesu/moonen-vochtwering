-- Moonen Vochtwering CRM Database Schema
-- Run this in Supabase SQL Editor

-- ===== LEADS TABLE =====
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Contact (from form)
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  straat TEXT,
  plaatsnaam TEXT NOT NULL,
  postcode TEXT,
  message TEXT,
  type_probleem TEXT,

  -- Pipeline
  status TEXT DEFAULT 'nieuw'
    CHECK (status IN ('nieuw','uitgenodigd','bevestigd','bezocht','offerte_verzonden','akkoord','verloren')),
  stage_changed_at TIMESTAMPTZ DEFAULT now(),
  verloren_reden TEXT,

  -- Scheduling
  inspection_date DATE,
  inspection_time TEXT,
  route_position INT,

  -- Inspection data (filled on-site)
  diagnose TEXT,
  oplossing TEXT,
  oppervlakte_m2 NUMERIC(8,2),
  photos TEXT[],
  inspection_notes TEXT,
  inspection_data_v2 JSONB,

  -- Quote
  quote_number TEXT,
  quote_amount NUMERIC(10,2),
  quote_pdf_url TEXT,
  quote_sent_at TIMESTAMPTZ,
  quote_response TEXT CHECK (quote_response IN ('akkoord','vraag','nee')),
  quote_response_at TIMESTAMPTZ,

  -- Follow-up
  follow_up_count INT DEFAULT 0,
  last_email_at TIMESTAMPTZ,
  followup_paused BOOLEAN DEFAULT false,

  -- Tokens (for customer email action links)
  availability_token TEXT UNIQUE,
  quote_token TEXT UNIQUE,

  -- Geo (for map view)
  lat NUMERIC(10,7),
  lng NUMERIC(10,7),

  -- Meta
  source TEXT DEFAULT 'website'
);

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_inspection_date ON leads(inspection_date);

-- ===== EMAIL LOG =====
CREATE TABLE email_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  resend_id TEXT
);

-- ===== LEAD EVENTS (AUDIT TRAIL) =====
CREATE TABLE lead_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  metadata JSONB,
  actor TEXT DEFAULT 'system'
);

CREATE INDEX idx_lead_events_lead_created ON lead_events(lead_id, created_at DESC);

-- ===== SETTINGS =====
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO settings (key, value) VALUES
  ('inspection_days', '["woensdag", "donderdag"]'),
  ('pricing', '{"base_rate": 280, "min_charge": 1500}'),
  ('follow_up_days', '[2, 5, 10]');

-- ===== AVAILABILITY SLOTS =====
CREATE TABLE availability_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_date DATE NOT NULL,
  slot_time TEXT NOT NULL,
  max_visits INT NOT NULL DEFAULT 1,
  booked_count INT NOT NULL DEFAULT 0,
  is_open BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (slot_date, slot_time)
);

CREATE INDEX idx_availability_slots_lookup ON availability_slots(slot_date, slot_time, is_open);

ALTER TABLE leads
  ADD COLUMN availability_slot_id UUID REFERENCES availability_slots(id);

-- ===== ROW LEVEL SECURITY =====

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_events ENABLE ROW LEVEL SECURITY;

-- Anon can insert leads (website contact form)
CREATE POLICY "anon_insert_leads" ON leads
  FOR INSERT TO anon
  WITH CHECK (true);

-- Authenticated users get full access
CREATE POLICY "auth_all_leads" ON leads
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "auth_all_email_log" ON email_log
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "auth_all_lead_events" ON lead_events
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "auth_all_settings" ON settings
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "auth_all_availability_slots" ON availability_slots
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon_read_open_availability_slots" ON availability_slots
  FOR SELECT TO anon
  USING (is_open = true AND booked_count < max_visits);

-- ===== REALTIME =====
ALTER PUBLICATION supabase_realtime ADD TABLE leads;
ALTER PUBLICATION supabase_realtime ADD TABLE availability_slots;

-- ===== AVAILABILITY HELPERS =====
CREATE OR REPLACE FUNCTION book_availability_slot(p_slot_id UUID)
RETURNS TABLE(slot_date DATE, slot_time TEXT)
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE availability_slots
  SET booked_count = booked_count + 1,
      updated_at = now()
  WHERE id = p_slot_id
    AND is_open = true
    AND booked_count < max_visits
  RETURNING availability_slots.slot_date, availability_slots.slot_time;
$$;

CREATE OR REPLACE FUNCTION release_availability_slot(p_slot_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE availability_slots
  SET booked_count = CASE WHEN booked_count > 0 THEN booked_count - 1 ELSE 0 END,
      updated_at = now()
  WHERE id = p_slot_id;
$$;

-- ===== AUTO-UPDATE updated_at =====
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
