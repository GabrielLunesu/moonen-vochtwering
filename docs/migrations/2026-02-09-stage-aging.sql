ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS stage_changed_at TIMESTAMPTZ DEFAULT now();

UPDATE leads
SET stage_changed_at = COALESCE(stage_changed_at, updated_at, created_at, now())
WHERE stage_changed_at IS NULL;
