function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function buildLeadSearchText(lead = {}) {
  return normalizeText([
    lead.name,
    lead.email,
    lead.phone,
    lead.straat,
    lead.postcode,
    lead.plaatsnaam,
    lead.message,
    lead.type_probleem,
    lead.quote_number,
  ].filter(Boolean).join(' '));
}

export function matchesLeadSearch(lead, query) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return true;
  return buildLeadSearchText(lead).includes(normalizedQuery);
}
