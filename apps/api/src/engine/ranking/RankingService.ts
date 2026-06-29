import type { Offer } from "../../shared/types/offer.js";
import type { ApplicationInput } from "../../shared/types/applicationInput.js";
import type { RankingWeights, RankingContext, RankedOffer, RankingProfile, RankingStrategy } from "./types.js";
import { DEFAULT_WEIGHTS } from "./types.js";

const STATUS_ORDER: Record<string, number> = {
  APPROVED: 0,
  CONDITIONAL: 1,
  REJECTED: 2,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export class RankingService {
  private strategies: RankingStrategy[] = [];

  constructor(private weights: RankingWeights = { ...DEFAULT_WEIGHTS }) {}

  addStrategy(strategy: RankingStrategy): this {
    this.strategies.push(strategy);
    return this;
  }

  setWeights(weights: Partial<RankingWeights>): this {
    this.weights = { ...this.weights, ...weights };
    return this;
  }

  setProfile(profile: RankingProfile): this {
    this.weights = { ...profile.weights };
    return this;
  }

  rank(offers: Offer[], context?: RankingContext): RankedOffer[] {
    if (offers.length === 0) return [];

    const maxInstallment = context?.maxInstallment ?? this.computeMaxInstallment(offers);

    const ctx: RankingContext = {
      ...context,
      maxInstallment,
      maxScore: this.computeMaxScore(offers),
    };

    const ranked: RankedOffer[] = offers.map((offer, index) => {
      const programScore = this.computeScore(offer, ctx);
      const breakdown = this.computeBreakdown(offer, ctx);

      return {
        ...offer,
        programScore,
        rank: index + 1,
        rankingBreakdown: breakdown,
      } as RankedOffer;
    });

    ranked.sort((a, b) => {
      const statusDiff = (STATUS_ORDER[a.status] ?? 2) - (STATUS_ORDER[b.status] ?? 2);
      if (statusDiff !== 0) return statusDiff;

      const scoreDiff = (b.programScore ?? 0) - (a.programScore ?? 0);
      if (scoreDiff !== 0) return scoreDiff;

      return a.installment - b.installment;
    });

    return ranked.map((o, i) => ({ ...o, rank: i + 1 }));
  }

  computeScore(offer: Offer, ctx: RankingContext): number {
    const w = this.weights;
    const maxInstallment = ctx.maxInstallment ?? 0;

    const costScore = this.scoreFinanceCost(offer.installment, maxInstallment);
    const fitnessScore = clamp(offer.affordabilityScore, 0, 100);
    const probabilityScore = clamp(offer.approvalProbability, 0, 100);
    const dpPct = offer.downPaymentPct ?? 0;
    const dpScore = clamp(100 - dpPct * 2, 0, 100);
    const tenor = offer.tenor ?? offer.months;
    const matchScore = ctx.requestedMonths
      ? this.scoreTenorMatch(tenor, ctx.requestedMonths)
      : 50;

    const strategyScore = this.applyStrategies(offer, ctx);

    return (
      costScore * w.financingCost +
      fitnessScore * w.financialFitness +
      probabilityScore * w.approvalProbability +
      dpScore * w.downPaymentImpact +
      matchScore * w.customerMatch +
      strategyScore
    );
  }

  private scoreFinanceCost(installment: number, maxInstallment: number): number {
    if (maxInstallment <= 0) return 100;
    return clamp(100 - (installment / maxInstallment) * 100, 0, 100);
  }

  private scoreTenorMatch(tenor: number, requestedMonths: number): number {
    const diff = Math.abs(tenor - requestedMonths);
    if (diff <= 12) return 100;
    if (diff <= 24) return 75;
    if (diff <= 36) return 50;
    return 25;
  }

  private applyStrategies(offer: Offer, ctx: RankingContext): number {
    if (this.strategies.length === 0) return 0;
    let total = 0;
    for (const strategy of this.strategies) {
      total += strategy.score(offer, ctx);
    }
    return total / this.strategies.length;
  }

  private computeBreakdown(offer: Offer, ctx: RankingContext) {
    const w = this.weights;
    const maxInstallment = ctx.maxInstallment ?? 0;
    const costScore = this.scoreFinanceCost(offer.installment, maxInstallment);
    const fitnessScore = clamp(offer.affordabilityScore, 0, 100);
    const probabilityScore = clamp(offer.approvalProbability, 0, 100);
    const dpPct = offer.downPaymentPct ?? 0;
    const dpScore = clamp(100 - dpPct * 2, 0, 100);
    const tenor = offer.tenor ?? offer.months;
    const matchScore = ctx.requestedMonths ? this.scoreTenorMatch(tenor, ctx.requestedMonths) : 50;

    return {
      costScore,
      fitnessScore,
      probabilityScore,
      dpScore,
      matchScore,
      weightedTotal: costScore * w.financingCost + fitnessScore * w.financialFitness + probabilityScore * w.approvalProbability + dpScore * w.downPaymentImpact + matchScore * w.customerMatch,
    };
  }

  private computeMaxInstallment(offers: Offer[]): number {
    let max = 0;
    for (const o of offers) {
      if (o.installment > max) max = o.installment;
    }
    return max;
  }

  private computeMaxScore(offers: Offer[]): number {
    let max = 0;
    for (const o of offers) {
      if ((o.approvalProbability ?? 0) > max) max = o.approvalProbability ?? 0;
    }
    return max;
  }

  static rankByLowestInstallment(offers: Offer[]): Offer[] {
    return [...offers].sort(
      (a, b) =>
        (STATUS_ORDER[a.status] ?? 2) - (STATUS_ORDER[b.status] ?? 2) ||
        a.installment - b.installment,
    );
  }

  static rankByLowestTotalCost(offers: Offer[]): Offer[] {
    return [...offers].sort(
      (a, b) =>
        (STATUS_ORDER[a.status] ?? 2) - (STATUS_ORDER[b.status] ?? 2) ||
        a.totalPayment - b.totalPayment,
    );
  }

  static rankByHighestApprovalProbability(offers: Offer[]): Offer[] {
    return [...offers].sort(
      (a, b) =>
        (STATUS_ORDER[a.status] ?? 2) - (STATUS_ORDER[b.status] ?? 2) ||
        (b.approvalProbability ?? 0) - (a.approvalProbability ?? 0),
    );
  }
}
