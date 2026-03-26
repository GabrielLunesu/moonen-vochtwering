-- Add editable voorwaarden (terms) column to quotes table
-- Each quote can have custom terms; NULL falls back to hardcoded defaults in PDF
ALTER TABLE quotes ADD COLUMN voorwaarden TEXT[];
