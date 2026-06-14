import type { Offer } from "./offer";

export interface EvaluateRequest {
  application_id: number;
}

export interface EvaluateResponse {
  bestOffer: Offer | null;
  offers: Offer[];
  error?: string;
}
