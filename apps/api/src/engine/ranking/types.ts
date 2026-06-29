import type { Offer } from "../../shared/types/offer.js";
import type { ApplicationInput } from "../../shared/types/applicationInput.js";

export interface RankingWeights {
  financingCost: number;
  financialFitness: number;
  approvalProbability: number;
  downPaymentImpact: number;
  customerMatch: number;
}

export const DEFAULT_WEIGHTS: RankingWeights = {
  financingCost: 0.30,
  financialFitness: 0.30,
  approvalProbability: 0.20,
  downPaymentImpact: 0.10,
  customerMatch: 0.10,
};

export interface RankingProfile {
  id: string;
  name: string;
  weights: RankingWeights;
  description?: string;
}

export interface RankedOffer extends Offer {
  programScore: number;
  rank: number;
  rankingBreakdown?: {
    costScore: number;
    fitnessScore: number;
    probabilityScore: number;
    dpScore: number;
    matchScore: number;
    weightedTotal: number;
  };
}

export interface RankingStrategy {
  name: string;
  score(offer: Offer, context: RankingContext): number;
}

export interface RankingContext {
  requestedMonths?: number;
  requestedDownPayment?: number;
  vehiclePrice?: number;
  maxInstallment?: number;
  maxScore?: number;
}
