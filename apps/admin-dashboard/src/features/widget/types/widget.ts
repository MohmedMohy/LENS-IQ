import type { EvaluateResponse, Offer, Reason } from "@/types";

export type WidgetStatus = "idle" | "loading" | "success" | "error";

export type WidgetState = {
  status: WidgetStatus;
  result: EvaluateResponse | null;
  error: string | null;
  executionTimeMs: number | null;
};

export type MockEvaluation = {
  bestOffer: Offer;
  offers: Offer[];
};

export type { EvaluateResponse, Offer, Reason };
