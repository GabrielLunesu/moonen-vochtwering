ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS quote_number TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_quote_number_unique
  ON leads (quote_number)
  WHERE quote_number IS NOT NULL;

CREATE TABLE IF NOT EXISTS quote_sequences (
  quote_year INT PRIMARY KEY,
  last_value INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION next_quote_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_year INT := EXTRACT(YEAR FROM now() AT TIME ZONE 'Europe/Amsterdam');
  next_value INT;
BEGIN
  INSERT INTO quote_sequences (quote_year, last_value)
  VALUES (current_year, 1)
  ON CONFLICT (quote_year)
  DO UPDATE
    SET last_value = quote_sequences.last_value + 1,
        updated_at = now()
  RETURNING last_value INTO next_value;

  RETURN format('MV-%s-%s', current_year, lpad(next_value::text, 4, '0'));
END;
$$;

GRANT EXECUTE ON FUNCTION next_quote_number() TO authenticated;
GRANT EXECUTE ON FUNCTION next_quote_number() TO service_role;
