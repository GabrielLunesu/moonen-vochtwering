-- Financial system: invoices, job costs, and business costs
-- Run this in Supabase SQL Editor
--
-- This migration adds:
--   1. invoices table — mirrors quotes structure, tracks payment status
--   2. invoice_sequences table + next_invoice_number() — auto-incrementing MV-F-YYYY-NNNN
--   3. job_costs table — per-job material/labour/subcontractor costs
--   4. business_costs table — general business expenses (fuel, tools, insurance, etc.)
--   5. planned_execution_date column on quotes
--   6. RLS policies for all new tables

-- ============================================================================
-- 1. INVOICES TABLE
-- ============================================================================

CREATE TABLE invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  invoice_number TEXT,

  -- Customer snapshot (denormalized for PDF generation)
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  customer_straat TEXT,
  customer_postcode TEXT,
  customer_plaatsnaam TEXT,

  -- Line items (same JSONB structure as quotes)
  line_items JSONB DEFAULT '[]',

  -- Pricing (all amounts incl. BTW unless noted)
  subtotal_incl NUMERIC(10,2) DEFAULT 0,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10,2),
  discount_amount NUMERIC(10,2) DEFAULT 0,
  btw_percentage INTEGER DEFAULT 21,
  btw_amount NUMERIC(10,2) DEFAULT 0,
  total_incl NUMERIC(10,2) DEFAULT 0,

  -- Status & payment tracking
  status TEXT DEFAULT 'concept' CHECK (status IN ('concept', 'verzonden', 'betaald', 'deels_betaald', 'vervallen')),
  issue_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  paid_amount NUMERIC(10,2) DEFAULT 0,
  paid_at TIMESTAMPTZ,
  payment_notes TEXT,

  -- Invoice terms & notes
  betaling TEXT DEFAULT 'Binnen 14 dagen na factuurdatum',
  notes TEXT,

  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-update updated_at on row change (uses existing trigger function)
CREATE TRIGGER set_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 2. INVOICE SEQUENCES + next_invoice_number()
-- ============================================================================
-- Format: MV-F-YYYY-NNNN (the F distinguishes from quote numbers MV-YYYY-NNNN)

CREATE TABLE invoice_sequences (
  year INTEGER NOT NULL PRIMARY KEY,
  last_number INTEGER NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION next_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;
  next_num INTEGER;
BEGIN
  INSERT INTO invoice_sequences (year, last_number)
  VALUES (current_year, 1)
  ON CONFLICT (year) DO UPDATE SET last_number = invoice_sequences.last_number + 1
  RETURNING last_number INTO next_num;
  RETURN 'MV-F-' || current_year || '-' || LPAD(next_num::TEXT, 4, '0');
END;
$$;

-- ============================================================================
-- 3. JOB COSTS TABLE
-- ============================================================================
-- Per-job costs linked to a quote/lead for profit margin tracking

CREATE TABLE job_costs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('materiaal', 'arbeid', 'onderaannemer', 'overig')),
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 4. BUSINESS COSTS TABLE
-- ============================================================================
-- General business expenses not tied to a specific job

CREATE TABLE business_costs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('brandstof', 'gereedschap', 'verzekering', 'huur', 'marketing', 'administratie', 'overig')),
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 5. ALTER QUOTES TABLE
-- ============================================================================

ALTER TABLE quotes ADD COLUMN IF NOT EXISTS planned_execution_date DATE;

-- ============================================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage invoices" ON invoices
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage job_costs" ON job_costs
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage business_costs" ON business_costs
  FOR ALL USING (auth.role() = 'authenticated');
