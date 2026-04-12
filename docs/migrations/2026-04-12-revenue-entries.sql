-- Revenue entries: tracks actual amounts received and external jobs
-- For CRM jobs: stores the actual_amount override (vs quoted amount)
-- For external jobs: stores the full revenue entry (not linked to a lead/quote)

CREATE TABLE revenue_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Optional link to CRM lead (for overriding actual amount)
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,

  -- For external jobs or display
  customer_name TEXT NOT NULL,
  description TEXT,

  -- The quoted/expected amount (for reference)
  quoted_amount NUMERIC(10,2) DEFAULT 0,

  -- What was actually received
  actual_amount NUMERIC(10,2) NOT NULL,

  -- When the revenue should be counted (execution month)
  revenue_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Is this an external job (not from CRM)?
  is_external BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-update updated_at
CREATE TRIGGER set_revenue_entries_updated_at
  BEFORE UPDATE ON revenue_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE revenue_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage revenue_entries" ON revenue_entries
  FOR ALL USING (auth.role() = 'authenticated');
