ALTER TABLE availability_slots
  ADD COLUMN IF NOT EXISTS visibility_scope TEXT NOT NULL DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS center_place_name TEXT,
  ADD COLUMN IF NOT EXISTS center_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS center_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS radius_km NUMERIC(6,1);

UPDATE availability_slots
SET
  visibility_scope = 'all',
  center_place_name = NULL,
  center_lat = NULL,
  center_lng = NULL,
  radius_km = NULL
WHERE visibility_scope IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'availability_slots_visibility_scope_check'
  ) THEN
    ALTER TABLE availability_slots
      ADD CONSTRAINT availability_slots_visibility_scope_check
      CHECK (visibility_scope IN ('all', 'radius'));
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_availability_slots_visibility_scope
  ON availability_slots (visibility_scope, center_place_name);
