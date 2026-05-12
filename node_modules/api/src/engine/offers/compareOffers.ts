import type { ApplicationInput } from "../../shared/types/applicationInput.js";
import type { Program } from "../../shared/types/program.js";
import type { Offer } from "../../shared/types/offer.js";

import { evaluateApplication } from "../evaluation/evaluateApplication.js";
import { generateOffer } from "./offerGenerator.js";

/**
 * Compare all available loan programs
 * and return ranked offers
 */
export async function compareOffers(
  input: ApplicationInput,
  programs: Program[],
  tenantId: number
): Promise<Offer[]> {

  const offers: Offer[] = [];

  for (const program of programs) {

    // 1. Evaluate application per program
    const evaluation = await evaluateApplication(
      input,
      program,
      tenantId
    );

    // 2. Generate offer from evaluation result
    const offer = generateOffer(input, program, evaluation);

    offers.push(offer);
  }

  // 3. Sort offers (BEST FIRST)
  return offers.sort((a, b) => {

    // Priority 1: status
    const statusWeight = {
      APPROVED: 3,
      CONDITIONAL: 2,
      REJECTED: 1,
    };

    // Priority 2: installment (lower is better)
    const scoreA =
      statusWeight[a.status] - a.installment * 0.001;

    const scoreB =
      statusWeight[b.status] - b.installment * 0.001;

    return scoreB - scoreA;
  });
}