ALTER TABLE invoices
  ALTER COLUMN betaling SET DEFAULT 'Binnen 30 dagen na factuurdatum';

UPDATE invoices
SET betaling = 'Binnen 30 dagen na factuurdatum'
WHERE betaling = 'Binnen 14 dagen na factuurdatum';

UPDATE invoices
SET due_date = (issue_date + INTERVAL '30 days')::date
WHERE issue_date IS NOT NULL
  AND (
    due_date IS NULL
    OR due_date <> (issue_date + INTERVAL '30 days')::date
  );
