import type { ApplicationInput } from "../../shared/types/applicationInput.js";
import type { Program } from "../../shared/types/program.js";
import type { Offer } from "../../shared/types/offer.js";
import type { CompareOffersResult, RankedOffer, RejectedOffer } from "../../shared/types/compareResult.js";

import { evaluateApplication } from "../evaluation/evaluateApplication.js";
import { generateOffer } from "./offerGenerator.js";
import { rankOffers } from "./Ranking.js";

const PRESET_TENORS = [36, 48, 60, 72, 84, 96];
const DOWN_PAYMENT_PCTS = [20, 25, 30, 35, 40, 50];

const NEW_CAR_MAX_LTV = 80;
const USED_CAR_MAX_LTV = 70;

const NEW_CAR_MAX_AGE_YEARS = 10;
const USED_CAR_MAX_AGE_YEARS = 7;

function resolveCondition(input: ApplicationInput): 'new' | 'used' {
    if (input.vehicleCondition === 'new' || input.vehicleCondition === 'used') {
        return input.vehicleCondition;
    }
    if (input.carYear && input.carYear > 0) {
        const currentYear = new Date().getFullYear();
        return (currentYear - input.carYear) <= 1 ? 'new' : 'used';
    }
    if (input.car_age !== undefined && input.car_age !== null) {
        return input.car_age <= 1 ? 'new' : 'used';
    }
    return 'used';
}

function computeValidTenors(carYear: number | undefined, condition: 'new' | 'used'): { tenors: number[]; error?: string } {
    const currentYear = new Date().getFullYear();
    const maxAgeYears = condition === 'new' ? NEW_CAR_MAX_AGE_YEARS : USED_CAR_MAX_AGE_YEARS;

    if (!carYear || carYear <= 0) {
        return { tenors: PRESET_TENORS };
    }

    const financeEndYear = carYear + maxAgeYears;
    const remainingYears = financeEndYear - currentYear;
    const maxTenorMonths = remainingYears * 12;

    if (maxTenorMonths < PRESET_TENORS[0]) {
        return {
            tenors: [],
            error: `Car does not qualify for any available financing tenor (max ${Math.max(0, remainingYears)} year(s) remaining)`,
        };
    }

    const valid = PRESET_TENORS.filter(t => t <= maxTenorMonths);
    return { tenors: valid.length > 0 ? valid : [PRESET_TENORS[0]] };
}

export async function compareOffers(
    input: ApplicationInput,
    programs: Program[],
    tenantId: number
): Promise<Offer[]> {
    const result = await compareOffersDetailed(input, programs, tenantId);
    const allOffers: Offer[] = [
        ...result.approved,
        ...result.conditional,
    ];
    result.rejected.forEach((r: RejectedOffer) => {
        allOffers.push({
            programId: r.programId,
            bankId: r.bankId,
            programName: r.programName,
            status: "REJECTED",
            installment: 0,
            totalPayment: 0,
            interestRate: 0,
            months: 0,
            financeAmount: 0,
            downPayment: 0,
            dti: r.dti,
            riskScore: r.riskScore,
            riskLevel: r.riskLevel,
            affordabilityScore: 0,
            approvalProbability: 0,
            reasons: r.reasons,
        });
    });
    return allOffers;
}

export async function compareOffersDetailed(
    input: ApplicationInput,
    programs: Program[],
    tenantId: number
): Promise<CompareOffersResult> {
    const errors: string[] = [];
    const approved: RankedOffer[] = [];
    const conditional: RankedOffer[] = [];
    const rejected: RejectedOffer[] = [];

    const condition = resolveCondition(input);
    const maxLTV = condition === 'new' ? NEW_CAR_MAX_LTV : USED_CAR_MAX_LTV;

    const { tenors: effectiveTenors, error: tenorError } = computeValidTenors(input.carYear, condition);
    if (tenorError) {
        errors.push(tenorError);
        return { approved, conditional, rejected, errors };
    }

    if (programs.length === 0) {
        errors.push("No financing programs configured for this tenant");
        return { approved, conditional, rejected, errors };
    }

    for (const program of programs) {
        let programHadApproved = false;

        for (const months of effectiveTenors) {
            if (programHadApproved) break;

            for (const downPct of DOWN_PAYMENT_PCTS) {
                const downPaymentAmount = input.price * (downPct / 100);
                const loanAmount = input.price - downPaymentAmount;
                const ltvRatio = (loanAmount / input.price) * 100;

                if (ltvRatio > maxLTV) continue;

                const evaluation = await evaluateApplication(input, program, tenantId);
                const offer = generateOffer(input, program, evaluation, {
                    overrideMonths: months,
                    overrideDownPaymentPercent: downPct,
                });

                if (offer.status === "APPROVED") {
                    programHadApproved = true;
                    approved.push({
                        ...offer,
                        programScore: 0,
                        rank: 0,
                    } as RankedOffer);
                    break;
                } else if (offer.status === "CONDITIONAL") {
                    conditional.push({
                        ...offer,
                        programScore: 0,
                        rank: 0,
                    } as RankedOffer);
                }
            }
        }

        if (!programHadApproved) {
            const baseEvaluation = await evaluateApplication(input, program, tenantId);
            rejected.push({
                programId: program.id,
                bankId: program.bankId,
                programName: program.name,
                status: "REJECTED",
                reasons: baseEvaluation.reasons,
                dti: 0,
                riskScore: baseEvaluation.riskScore ?? 100,
                riskLevel: baseEvaluation.riskLevel ?? "HIGH",
            });
        }
    }

    const allRankable = [...approved, ...conditional];
    const ranked = rankOffers(allRankable as Offer[]);

    const rankedApproved: RankedOffer[] = ranked
        .filter((o): o is RankedOffer => o.status === "APPROVED" && "programScore" in o)
        .map((o, i) => ({ ...o, rank: i + 1 } as RankedOffer));

    const rankedConditional: RankedOffer[] = ranked
        .filter((o): o is RankedOffer => o.status === "CONDITIONAL" && "programScore" in o)
        .map((o, i) => ({ ...o, rank: approved.length + i + 1 } as RankedOffer));

    const bestAlternative = rankedApproved.length > 0
        ? rankedApproved[0]
        : rankedConditional.length > 0
            ? rankedConditional[0]
            : undefined;

    if (approved.length === 0 && conditional.length === 0 && errors.length === 0) {
        errors.push("No qualifying offers found for the given parameters");
    }

    return {
        approved: rankedApproved,
        conditional: rankedConditional,
        rejected,
        bestAlternative,
        errors,
    };
}
