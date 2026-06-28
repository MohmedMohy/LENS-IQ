import type { Offer } from "../../shared/types/offer.js";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

type ScoreWeights = {
  financingCost: number;
  financialFitness: number;
  approvalProbability: number;
  downPaymentImpact: number;
  customerMatch: number;
};

const DEFAULT_WEIGHTS: ScoreWeights = {
  financingCost: 0.30,
  financialFitness: 0.30,
  approvalProbability: 0.20,
  downPaymentImpact: 0.10,
  customerMatch: 0.10,
};

function scoreFinanceCostByAPR(apr: number, minAPR: number, maxAPR: number): number {
  if (maxAPR <= minAPR) return 100;
  return clamp(100 * (1 - (apr - minAPR) / (maxAPR - minAPR)), 0, 100);
}

function scoreFinancialFitness(dti: number): number {
  if (dti <= 20) return 100;
  if (dti <= 30) return 90;
  if (dti <= 40) return 70;
  if (dti <= 50) return 40;
  if (dti <= 60) return 10;
  return 0;
}

function scoreDownPayment(downPayment: number, price: number): number {
  if (price <= 0) return 50;
  const pct = (downPayment / price) * 100;
  if (pct >= 50) return 100;
  if (pct >= 40) return 90;
  if (pct >= 35) return 75;
  if (pct >= 30) return 60;
  if (pct >= 25) return 40;
  if (pct >= 20) return 20;
  return 0;
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

function computeMinMaxAPR(offers: Offer[]): { minAPR: number; maxAPR: number } {
  let minAPR = Infinity;
  let maxAPR = -Infinity;
  for (const o of offers) {
    const apr = o.effectiveAnnualRate ?? o.interestRate;
    if (apr < minAPR) minAPR = apr;
    if (apr > maxAPR) maxAPR = apr;
  }
  if (!isFinite(minAPR)) minAPR = 0;
  if (!isFinite(maxAPR)) maxAPR = 0;
  return { minAPR, maxAPR };
}

export function calculateProgramScore(
  o: Offer,
  weights?: Partial<ScoreWeights>,
  contextMinMax?: { minAPR: number; maxAPR: number }
): number {
  const w = { ...DEFAULT_WEIGHTS, ...weights };

  const { minAPR, maxAPR } = contextMinMax ?? { minAPR: 0, maxAPR: 0 };

  const apr = o.effectiveAnnualRate ?? o.interestRate;
  const financeCost = scoreFinanceCostByAPR(apr, minAPR, maxAPR);

  const financialFitness = scoreFinancialFitness(o.dti);

  const approval = clamp(o.approvalProbability, 0, 100);

  const downPayment = scoreDownPayment(o.downPayment, o.financeAmount > 0 ? o.financeAmount + o.downPayment : 1);

  const match = scoreCustomerMatch(o);

  return (
    financeCost * w.financingCost +
    financialFitness * w.financialFitness +
    approval * w.approvalProbability +
    downPayment * w.downPaymentImpact +
    match * w.customerMatch
  );
}

export function rankOffers(offers: Offer[]): Offer[] {
  const { minAPR, maxAPR } = computeMinMaxAPR(offers);

  return [...offers]
    .map((o) => ({
      ...o,
      programScore: calculateProgramScore(o, undefined, { minAPR, maxAPR }),
    }))
    .sort((a, b) => (b.programScore ?? 0) - (a.programScore ?? 0));
}
