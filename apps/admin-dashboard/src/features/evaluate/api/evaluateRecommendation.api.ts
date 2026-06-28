import { apiClient } from "@/api/client";
import type { RankedOffer } from "@/types";

export type EvaluateRecommendationPayload = {
  applicationId: number;
  recommendationType: "SHORTEN_TENOR" | "INCREASE_DOWN_PAYMENT" | "SWITCH_METHOD" | "BEST_BANK_ALTERNATIVE";
  suggestedParams: {
    tenor?: number;
    downPaymentPct?: number;
    method?: "reducing" | "flat" | "murabaha";
    bankId?: number;
  };
};

export type EvaluateRecommendationResponse = {
  originalOffer: RankedOffer | null;
  recommendedOffer: RankedOffer | null;
  improvement: {
    monthlySaving: number;
    totalSaving: number;
    dtiChange: number;
    approvalChance: number;
  };
  recommendation: {
    type: string;
    message: string;
    suggestedParams: Record<string, unknown>;
  };
};

export const evaluateRecommendationApi = {
  evaluate: async (payload: EvaluateRecommendationPayload): Promise<EvaluateRecommendationResponse> => {
    const { data } = await apiClient.post("/engine/evaluate-recommendation", payload, { timeout: 120000 });
    return data as EvaluateRecommendationResponse;
  },
};
