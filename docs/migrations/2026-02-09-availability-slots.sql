-- Availability slots (hourly) + safe booking helpers

CREATE TABLE IF NOT EXISTS availability_slots (
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

CREATE INDEX IF NOT EXISTS idx_availability_slots_lookup
  ON availability_slots (slot_date, slot_time, is_open);

ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'availability_slots'
      AND policyname = 'availability_slots_auth_all'
  ) THEN
    CREATE POLICY availability_slots_auth_all ON availability_slots
      FOR ALL TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'availability_slots'
      AND policyname = 'availability_slots_anon_read_open'
  ) THEN
    CREATE POLICY availability_slots_anon_read_open ON availability_slots
      FOR SELECT TO anon
      USING (is_open = true AND booked_count < max_visits);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'leads'
      AND column_name = 'availability_slot_id'
  ) THEN
    ALTER TABLE leads
      ADD COLUMN availability_slot_id UUID REFERENCES availability_slots(id);
  END IF;
END
$$;

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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE schemaname = 'public'
      AND pubname = 'supabase_realtime'
      AND tablename = 'availability_slots'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE availability_slots;
  END IF;
END
$$;
