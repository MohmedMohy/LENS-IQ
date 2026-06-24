import type { ApplicationInput } from "../../shared/types/applicationInput.js";
import type { Program } from "../../shared/types/program.js";
import type { Offer } from "../../shared/types/offer.js";

import { evaluateApplication } from "../evaluation/evaluateApplication.js";
import { generateOffer } from "./offerGenerator.js";

const MONTH_STEP = 12;
const DOWN_PAYMENT_STEP = 10;

function generateMonthSteps(min: number, max: number): number[] {
    const steps: number[] = [];
    for (let m = max; m >= min; m -= MONTH_STEP) {
        steps.push(m);
    }
    if (steps.length === 0 || steps[steps.length - 1] !== min) {
        steps.push(min);
    }
    return steps;
}

function generateDownPaymentSteps(min: number, max: number): number[] {
    const steps: number[] = [];
    for (let d = min; d < max; d += DOWN_PAYMENT_STEP) {
        steps.push(d);
    }
    if (steps.length === 0 || steps[steps.length - 1] !== max) {
        steps.push(max);
    }
    return steps;
}

export async function compareOffers(
    input: ApplicationInput,
    programs: Program[],
    tenantId: number
): Promise<Offer[]> {

    const offers: Offer[] = [];

    for (const program of programs) {
        const evaluation = await evaluateApplication(
            input,
            program,
            tenantId
        );

        if (evaluation.status === "REJECTED") {
            let foundApproval = false;
            const monthSteps = generateMonthSteps(program.minMonths, program.maxMonths);
            const downPaymentSteps = generateDownPaymentSteps(
                program.minDownPaymentPercent,
                program.maxDownPaymentPercent
            );

            for (const months of monthSteps) {
                if (foundApproval) break;
                for (const downPct of downPaymentSteps) {
                    const offer = generateOffer(input, program, evaluation, {
                        overrideMonths: months,
                        overrideDownPaymentPercent: downPct,
                    });
                    if (offer.status !== "REJECTED") {
                        offers.push(offer);
                        foundApproval = true;
                        break;
                    }
                }
            }

            if (!foundApproval) {
                offers.push(generateOffer(input, program, evaluation));
            }
        } else {
            const monthSteps = generateMonthSteps(program.minMonths, program.maxMonths);
            const downPaymentSteps = generateDownPaymentSteps(
                program.minDownPaymentPercent,
                program.maxDownPaymentPercent
            );

            for (const months of monthSteps) {
                for (const downPct of downPaymentSteps) {
                    const offer = generateOffer(input, program, evaluation, {
                        overrideMonths: months,
                        overrideDownPaymentPercent: downPct,
                    });
                    offers.push(offer);
                }
            }
        }
    }

    // Sorting is delegated to rankOffers() — no inline sort here
    return offers;
}
