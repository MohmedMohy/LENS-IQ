import type { Offer } from "./offer.js";

export type RankedOffer = Offer & {
  programScore: number;
  rank: number;
};

export type RejectedOffer = {
  programId: number;
  bankId: number;
  programName?: string;
  status: "REJECTED";
  reasons: Array<{ type: string; message: string; impact: string }>;
  dti: number;
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
};

export type CompareOffersResult = {
  approved: RankedOffer[];
  conditional: RankedOffer[];
  rejected: RejectedOffer[];
  bestAlternative?: RankedOffer;
  errors: string[];
};
