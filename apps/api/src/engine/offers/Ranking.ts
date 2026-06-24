import type { Offer } from "../../shared/types/offer.js";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

type ScoreWeights = {
  affordability: number;
  approvalProbability: number;
  totalFinanceCost: number;
  downPaymentImpact: number;
  customerProgramMatch: number;
};

const DEFAULT_WEIGHTS: ScoreWeights = {
  affordability: 0.40,
  approvalProbability: 0.25,
  totalFinanceCost: 0.15,
  downPaymentImpact: 0.10,
  customerProgramMatch: 0.10,
};

function scoreFinanceCost(totalPayment: number, price: number): number {
  if (price <= 0) return 50;
  const costRatio = (totalPayment - price) / price;
  return clamp(100 - costRatio * 100, 0, 100);
}

function scoreDownPayment(downPayment: number, price: number): number {
  if (price <= 0) return 50;
  const pct = (downPayment / price) * 100;
  if (pct >= 40) return 100;
  if (pct >= 30) return 80;
  if (pct >= 20) return 60;
  if (pct >= 10) return 30;
  return 10;
}

function scoreCustomerMatch(o: Offer): number {
  let score = 50;
  if (o.dti <= 30) score += 25;
  else if (o.dti <= 45) score += 10;
  else score -= 15;
  if (o.affordabilityScore >= 70) score += 15;
  else if (o.affordabilityScore >= 50) score += 5;
  else score -= 10;
  if (o.riskLevel === "LOW") score += 10;
  else if (o.riskLevel === "HIGH") score -= 20;
  return clamp(score, 0, 100);
}

export function calculateProgramScore(
  o: Offer,
  weights?: Partial<ScoreWeights>
): number {
  const w = { ...DEFAULT_WEIGHTS, ...weights };

  const affordability = clamp(o.affordabilityScore, 0, 100);
  const approval = clamp(o.approvalProbability, 0, 100);
  const financeCost = scoreFinanceCost(o.totalPayment, o.financeAmount > 0 ? o.financeAmount + o.downPayment : 1);
  const downPayment = scoreDownPayment(o.downPayment, o.financeAmount > 0 ? o.financeAmount + o.downPayment : 1);
  const match = scoreCustomerMatch(o);

  return (
    affordability * w.affordability +
    approval * w.approvalProbability +
    financeCost * w.totalFinanceCost +
    downPayment * w.downPaymentImpact +
    match * w.customerProgramMatch
  );
}

export function rankOffers(offers: Offer[]): Offer[] {
  return [...offers]
    .map((o) => ({ ...o, programScore: calculateProgramScore(o) }))
    .sort((a, b) => (b.programScore ?? 0) - (a.programScore ?? 0));
}