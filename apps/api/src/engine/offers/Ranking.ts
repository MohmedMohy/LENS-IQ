import type { Offer } from "../../shared/types/offer.js";

const STATUS_ORDER: Record<string, number> = {
  APPROVED: 0,
  CONDITIONAL: 1,
  REJECTED: 2,
};

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

function scoreFinanceCostByInstallment(installment: number, maxInstallment: number): number {
  if (maxInstallment <= 0) return 100;
  return clamp(100 - (installment / maxInstallment * 100), 0, 100);
}

function scoreCustomerMatchTenor(tenor: number, requestedMonths: number): number {
  const diff = Math.abs(tenor - requestedMonths);
  return diff <= 12 ? 100 : 50;
}

function computeMaxInstallment(offers: Offer[]): number {
  let max = 0;
  for (const o of offers) {
    if (o.installment > max) max = o.installment;
  }
  return max;
}

export function calculateProgramScore(
  o: Offer,
  weights?: Partial<ScoreWeights>,
  contextMaxInstallment?: number,
  requestedMonths?: number
): number {
  const w = { ...DEFAULT_WEIGHTS, ...weights };

  const maxInstallment = contextMaxInstallment ?? 0;
  const costScore = scoreFinanceCostByInstallment(o.installment, maxInstallment);

  const fitnessScore = clamp(o.affordabilityScore, 0, 100);

  const probabilityScore = clamp(o.approvalProbability, 0, 100);

  const downPaymentPct = o.downPaymentPct ?? 0;
  const dpScore = clamp(100 - downPaymentPct * 2, 0, 100);

  const tenor = o.tenor ?? o.months;
  const matchScore = requestedMonths ? scoreCustomerMatchTenor(tenor, requestedMonths) : 50;

  return (
    costScore * w.financingCost +
    fitnessScore * w.financialFitness +
    probabilityScore * w.approvalProbability +
    dpScore * w.downPaymentImpact +
    matchScore * w.customerMatch
  );
}

export function rankOffers(offers: Offer[], requestedMonths?: number): Offer[] {
  const maxInstallment = computeMaxInstallment(offers);

  const scored = offers.map((o) => ({
    ...o,
    programScore: calculateProgramScore(o, undefined, maxInstallment, requestedMonths),
  }));

  return scored.sort((a, b) => {
    const statusDiff = (STATUS_ORDER[a.status] ?? 2) - (STATUS_ORDER[b.status] ?? 2);
    if (statusDiff !== 0) return statusDiff;

    const scoreDiff = (b.programScore ?? 0) - (a.programScore ?? 0);
    if (scoreDiff !== 0) return scoreDiff;

    return a.installment - b.installment;
  });
}
