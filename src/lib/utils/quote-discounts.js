const VALID_DISCOUNT_TYPES = new Set(['percentage', 'fixed']);

export function normalizeDiscountType(type) {
  if (type == null || type === '') return null;
  if (type === 'amount') return 'fixed';
  return VALID_DISCOUNT_TYPES.has(type) ? type : null;
}
