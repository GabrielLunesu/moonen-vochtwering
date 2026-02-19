-- Inspection v2: structured quote data + default line-item templates

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS inspection_data_v2 JSONB;

INSERT INTO settings (key, value)
VALUES
  (
    'line_item_templates',
    '{
      "kelderafdichting": [
        {"description": "Kelderwanden waterdicht maken", "unit": "m²", "unit_price": 280},
        {"description": "Vloer/wandovergangen afdichten", "unit": "stuk", "unit_price": 650},
        {"description": "Afwerking stucwerk", "unit": "m²", "unit_price": 40}
      ],
      "muurinjectie": [
        {"description": "Muurinjectie tegen opstijgend vocht", "unit": "m¹", "unit_price": 95},
        {"description": "Boor- en injectiewerkzaamheden", "unit": "stuk", "unit_price": 350},
        {"description": "Nabehandeling en afwerking", "unit": "m²", "unit_price": 35}
      ]
    }'::jsonb
  ),
  (
    'quote_defaults',
    '{
      "btw_percentage": 21,
      "garantie_jaren": 5,
      "doorlooptijd": "3 werkdagen",
      "betaling": "40% bij opdracht, 60% na oplevering"
    }'::jsonb
  )
ON CONFLICT (key) DO NOTHING;
