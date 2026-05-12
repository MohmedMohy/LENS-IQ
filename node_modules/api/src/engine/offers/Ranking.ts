import type { Offer } from "../../shared/types/offer.js";

/**
 * Normalize helpers
 */
function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Safe score normalization
 */
function normalizeRisk(riskScore: number): number {
  return clamp(riskScore, 0, 100);
}

/**
 * DTI normalization (lower is better)
 * assumes 0 → 100+ range
 */
function normalizeDTI(dti: number): number {
  return clamp(dti, 0, 100);
}

/**
 * Core scoring function
 */
function scoreOffer(o: Offer): number {
  const risk = normalizeRisk(o.riskScore);
  const dti = normalizeDTI(o.dti);

  const affordability = clamp(o.affordabilityScore, 0, 100);

  return (
    affordability * 0.4 +
    (100 - risk) * 0.4 +
    (100 - dti) * 0.2
  );
}

/**
 * Rank offers (PURE function)
 */
export function rankOffers(offers: Offer[]): Offer[] {
  return [...offers] //  avoid mutation
    .sort((a, b) => scoreOffer(b) - scoreOffer(a));
}