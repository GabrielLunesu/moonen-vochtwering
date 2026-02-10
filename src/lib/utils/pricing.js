const DEFAULT_PRICING = {
  base_rate: 280, // per m²
  min_charge: 1500,
};

export function calculateQuote(oppervlakteM2, pricing = DEFAULT_PRICING) {
  const calculated = oppervlakteM2 * pricing.base_rate;
  const amount = Math.max(calculated, pricing.min_charge);

  return {
    oppervlakte: oppervlakteM2,
    rate: pricing.base_rate,
    calculated,
    min_charge: pricing.min_charge,
    amount: Math.round(amount * 100) / 100,
    btw: Math.round(amount * 0.21 * 100) / 100,
    total: Math.round(amount * 1.21 * 100) / 100,
  };
}
