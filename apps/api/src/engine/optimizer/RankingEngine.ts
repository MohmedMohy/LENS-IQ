import type { Offer } from "../../shared/types/offer.js";
import type { ApplicationInput } from "../../shared/types/applicationInput.js";
import type { SmartOffer } from "./types.js";

export interface RankingWeights {
  approvalProbability: number;
  customerPreference: number;
  lowestInstallment: number;
  shortestTenure: number;
  lowestInterest: number;
}

export const DEFAULT_RANKING_WEIGHTS: RankingWeights = {
  approvalProbability: 0.40,
  customerPreference: 0.20,
  lowestInstallment: 0.20,
  shortestTenure: 0.10,
  lowestInterest: 0.10,
};

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function computeCustomerPreferenceScore(
  offer: Offer,
  input: ApplicationInput
): number {
  let score = 100;
  const penalty = 10;

  const offerTenure = offer.tenor ?? offer.months;
  const tenureDiff = Math.abs(offerTenure - input.requestedMonths);
  if (tenureDiff > 0) {
    score -= Math.min(40, tenureDiff / 3 * penalty);
  }

  const offerDP = offer.downPaymentPct ?? 0;
  const requestedDPPct = input.price > 0 ? (input.requestedDownPayment / input.price) * 100 : 0;
  const dpDiff = Math.abs(offerDP - requestedDPPct);
  if (dpDiff > 0) {
    score -= Math.min(30, dpDiff / 2 * penalty);
  }

  const financeDiff = Math.abs((offer.financeAmount ?? 0) - (input.price - input.requestedDownPayment));
  if (financeDiff > 0) {
    score -= Math.min(20, financeDiff / 10000 * penalty);
  }

  return clamp(Math.round(score), 0, 100);
}

export function computeDeviationScore(
  offer: Offer,
  input: ApplicationInput
): number {
  let totalDeviation = 0;
  let count = 0;

  const offerTenure = offer.tenor ?? offer.months;
  const tenureDiff = Math.abs(offerTenure - input.requestedMonths);
  if (input.requestedMonths > 0) {
    totalDeviation += tenureDiff / input.requestedMonths;
    count++;
  }

  const offerDP = offer.downPaymentPct ?? 0;
  const requestedDPPct = input.price > 0 ? (input.requestedDownPayment / input.price) * 100 : 0;
  if (requestedDPPct > 0) {
    totalDeviation += Math.abs(offerDP - requestedDPPct) / requestedDPPct;
    count++;
  }

  const origFinanceAmount = input.price - input.requestedDownPayment;
  if (origFinanceAmount > 0) {
    totalDeviation += Math.abs((offer.financeAmount ?? 0) - origFinanceAmount) / origFinanceAmount;
    count++;
  }

  if (count === 0) return 0;
  const avgDeviation = totalDeviation / count;
  return clamp(Math.round((1 - Math.min(avgDeviation, 1)) * 100), 0, 100);
}

export function rankOffersSmart(
  offers: Offer[],
  input: ApplicationInput,
  weights?: Partial<RankingWeights>
): SmartOffer[] {
  if (offers.length === 0) return [];

  const w = { ...DEFAULT_RANKING_WEIGHTS, ...weights };

  const maxInstallment = Math.max(...offers.map(o => o.installment));
  const maxTenure = Math.max(...offers.map(o => o.tenor ?? o.months));
  const maxInterest = Math.max(...offers.map(o => o.interestRate));
  const maxApproval = Math.max(...offers.map(o => o.approvalProbability));

  const scored = offers.map((offer) => {
    const customerPreferenceScore = computeCustomerPreferenceScore(offer, input);
    const deviationScore = computeDeviationScore(offer, input);

    const approvalNorm = maxApproval > 0 ? (offer.approvalProbability / maxApproval) * 100 : 0;
    const installmentNorm = maxInstallment > 0 ? (1 - offer.installment / maxInstallment) * 100 : 100;
    const tenureNorm = maxTenure > 0 ? (1 - (offer.tenor ?? offer.months) / maxTenure) * 100 : 100;
    const interestNorm = maxInterest > 0 ? (1 - offer.interestRate / maxInterest) * 100 : 100;

    const finalScore = Math.round(
      approvalNorm * w.approvalProbability +
      customerPreferenceScore * w.customerPreference +
      installmentNorm * w.lowestInstallment +
      tenureNorm * w.shortestTenure +
      interestNorm * w.lowestInterest
    );

    return {
      ...offer,
      programScore: finalScore,
      customerPreferenceScore,
      deviationScore,
    } as SmartOffer;
  });

  return scored.sort((a, b) => (b.programScore ?? 0) - (a.programScore ?? 0));
}
