-- Sprint 1: follow-up controls + audit trail

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS followup_paused BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS lead_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  metadata JSONB,
  actor TEXT DEFAULT 'system'
);

CREATE INDEX IF NOT EXISTS idx_lead_events_lead_created
  ON lead_events(lead_id, created_at DESC);

ALTER TABLE lead_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'lead_events'
      AND policyname = 'lead_events_auth_all'
  ) THEN
    CREATE POLICY lead_events_auth_all ON lead_events
      FOR ALL TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END
$$;
