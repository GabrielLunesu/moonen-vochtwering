/**
 * Staffel pricing utilities for Moonen Vochtwering CRM.
 *
 * Staffels are volume-based price breaks:
 *   [{ vanaf: 20, prijs: 130 }, { vanaf: 30, prijs: 110 }]
 *
 * The highest qualifying threshold wins.
 */

/**
 * Get the effective unit price after applying staffel (volume discount).
 * @param {number} basePrijs - Default unit price when no staffel applies
 * @param {Array<{vanaf: number, prijs: number}>|null} staffels - Volume thresholds
 * @param {number} hoeveelheid - The quantity being quoted
 * @returns {number} The applicable unit price
 */
export function getStaffelPrijs(basePrijs, staffels, hoeveelheid) {
  if (!staffels?.length) return basePrijs;
  const sorted = [...staffels].sort((a, b) => b.vanaf - a.vanaf);
  for (const s of sorted) {
    if (hoeveelheid >= s.vanaf) return s.prijs;
  }
  return basePrijs;
}

/**
 * Get the staffel label that was applied (e.g. "staffel ≥20m²"), or null.
 * @param {Array<{vanaf: number, prijs: number}>|null} staffels
 * @param {number} hoeveelheid
 * @returns {string|null}
 */
export function getStaffelLabel(staffels, hoeveelheid) {
  if (!staffels?.length) return null;
  const sorted = [...staffels].sort((a, b) => b.vanaf - a.vanaf);
  for (const s of sorted) {
    if (hoeveelheid >= s.vanaf) return `staffel \u2265${s.vanaf}`;
  }
  return null;
}

/**
 * Enforce a minimum total amount by adjusting the unit price upward.
 * Returns the original unit price if the total already meets the minimum.
 * @param {number} unitPrice
 * @param {number} quantity
 * @param {number|null} minimum - Minimum total amount (e.g. 1500)
 * @returns {{ price: number, minimumApplied: boolean }}
 */
export function applyMinimum(unitPrice, quantity, minimum) {
  if (!minimum || quantity <= 0) return { price: unitPrice, minimumApplied: false };
  const total = unitPrice * quantity;
  if (total >= minimum) return { price: unitPrice, minimumApplied: false };
  return {
    price: Math.ceil((minimum / quantity) * 100) / 100,
    minimumApplied: true,
  };
}
