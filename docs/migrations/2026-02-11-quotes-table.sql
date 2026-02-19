-- Quotes table for standalone quote generator
-- Run this in Supabase SQL Editor

CREATE TABLE quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Link to lead (optional — auto-created if new customer)
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,

  -- Customer snapshot (denormalized for PDF + standalone use)
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  customer_straat TEXT,
  customer_postcode TEXT,
  customer_plaatsnaam TEXT,

  -- Inspection context
  diagnose TEXT[],
  diagnose_details TEXT,
  oplossingen TEXT[],
  kelder_sub_areas JSONB,
  oppervlakte_m2 NUMERIC(8,2),
  injectie_depth INT,
  notes TEXT,
  photos TEXT[],

  -- Line items (all prices stored INCL. BTW)
  line_items JSONB NOT NULL DEFAULT '[]',

  -- Totals (all incl. BTW)
  subtotal_incl NUMERIC(10,2) DEFAULT 0,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10,2),
  discount_amount NUMERIC(10,2) DEFAULT 0,
  btw_percentage NUMERIC(5,2) DEFAULT 21,
  btw_amount NUMERIC(10,2) DEFAULT 0,
  total_incl NUMERIC(10,2) DEFAULT 0,

  -- Terms
  garantie_jaren INT DEFAULT 5,
  doorlooptijd TEXT DEFAULT '3 werkdagen',
  betaling TEXT DEFAULT 'Op de eerste werkdag bij aanvang, restant binnen 2 weken na oplevering',
  geldigheid_dagen INT DEFAULT 30,
  offerte_inleiding TEXT,

  -- Status & sending
  label TEXT,
  quote_number TEXT,
  status TEXT DEFAULT 'concept' CHECK (status IN ('concept', 'verzonden', 'akkoord', 'afgewezen', 'verlopen')),
  sent_at TIMESTAMPTZ,
  response TEXT CHECK (response IN ('akkoord', 'vraag', 'nee')),
  response_at TIMESTAMPTZ,
  quote_token TEXT UNIQUE
);

CREATE INDEX idx_quotes_lead_id ON quotes(lead_id);
CREATE INDEX idx_quotes_status ON quotes(status);

-- RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all_quotes" ON quotes
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE quotes;

-- Auto-update updated_at trigger
CREATE TRIGGER quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
