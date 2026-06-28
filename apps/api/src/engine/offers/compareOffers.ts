import type { ApplicationInput } from "../../shared/types/applicationInput.js";
import type { Program } from "../../shared/types/program.js";
import type { Offer } from "../../shared/types/offer.js";
import type { CompareOffersResult, RankedOffer, RejectedOffer } from "../../shared/types/compareResult.js";

import { evaluateApplication } from "../evaluation/evaluateApplication.js";
import { generateOffer } from "./offerGenerator.js";
import { rankOffers } from "./Ranking.js";

const MAX_RESULT_OFFERS = 10;

const NEW_CAR_MAX_LTV = 80;
const USED_CAR_MAX_LTV = 70;
const NEW_CAR_MAX_AGE_YEARS = 7;
const USED_CAR_MAX_AGE_YEARS = 5;

function clamp(v: number, lo: number, hi: number): number {
    return Math.max(lo, Math.min(hi, v));
}

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

function resolveCarAge(input: ApplicationInput): number {
    if (input.car_age !== undefined && input.car_age !== null) {
        return input.car_age;
    }
    if (input.carYear && input.carYear > 0) {
        return new Date().getFullYear() - input.carYear;
    }
    return 0;
}

function generateScenarios(
    input: ApplicationInput,
    program: Program
): { months: number; downPaymentPct: number }[] {
    const scenarios: { months: number; downPaymentPct: number }[] = [];

    const clientMonths = input.requestedMonths || program.maxMonths;
    const clientDP = input.price > 0
        ? Math.round((input.requestedDownPayment / input.price) * 100)
        : program.minDownPaymentPercent;

    const monthsSet = new Set<number>();

    monthsSet.add(clamp(clientMonths, program.minMonths, program.maxMonths));

    for (let m = Math.min(program.maxMonths, clientMonths + 12); m <= program.maxMonths; m += 12) {
        monthsSet.add(m);
    }
    for (let m = clientMonths - 12; m >= program.minMonths; m -= 12) {
        monthsSet.add(m);
    }

    for (const m of [12, 24, 36, 48, 60, 72, 84, 96]) {
        if (m >= program.minMonths && m <= program.maxMonths) {
            monthsSet.add(m);
        }
    }

    const validMonths = [...monthsSet]
        .filter(m => m >= program.minMonths && m <= program.maxMonths)
        .sort((a, b) => b - a);

    const dpSet = new Set<number>();

    for (const dp of [20, 25, 30, 35, 40, 45, 50]) {
        if (dp >= program.minDownPaymentPercent && dp <= program.maxDownPaymentPercent) {
            dpSet.add(dp);
        }
    }

    if (clientDP >= program.minDownPaymentPercent && clientDP <= program.maxDownPaymentPercent) {
        dpSet.add(clientDP);
    }

    for (let step = 5; step <= 25; step += 5) {
        const higher = clientDP + step;
        const lower = clientDP - step;
        if (higher >= program.minDownPaymentPercent && higher <= program.maxDownPaymentPercent) {
            dpSet.add(higher);
        }
        if (lower >= program.minDownPaymentPercent && lower <= program.maxDownPaymentPercent) {
            dpSet.add(lower);
        }
    }

    const validDPs = [...dpSet].sort((a, b) => a - b);

    for (const months of validMonths) {
        for (const dp of validDPs) {
            scenarios.push({ months, downPaymentPct: dp });
        }
    }

    return scenarios;
}

function categorizeRejection(offer: Offer): 'tenure' | 'dti' | 'risk' | 'other' {
    const reasons = offer.reasons ?? [];
    for (const r of reasons) {
        const msg = r.message.toLowerCase();
        if (msg.includes('tenor') || msg.includes('months') || msg.includes('max age') || msg.includes('car age')) {
            return 'tenure';
        }
        if (msg.includes('dti') || msg.includes('debt-to-income') || msg.includes('debt')) {
            return 'dti';
        }
        if (msg.includes('risk') || msg.includes('risk profile') || msg.includes('high risk')) {
            return 'risk';
        }
    }
    return 'other';
}

function addSuggestedAlternatives(allOffers: Offer[]): void {
    const programOffers = new Map<number, Offer[]>();

    for (const offer of allOffers) {
        const pid = offer.programId;
        if (!programOffers.has(pid)) {
            programOffers.set(pid, []);
        }
        programOffers.get(pid)!.push(offer);
    }

    for (const offer of allOffers) {
        if (offer.status !== 'REJECTED') continue;

        const rejectionType = categorizeRejection(offer);
        const sameProgram = programOffers.get(offer.programId) ?? [];
        const candidates: Offer[] = [];

        if (rejectionType === 'tenure') {
            for (const o of sameProgram) {
                if (o.status === 'APPROVED' || o.status === 'CONDITIONAL') {
                    const oTenor = o.tenor ?? o.months;
                    const offerTenor = offer.tenor ?? offer.months;
                    if (oTenor < offerTenor) {
                        candidates.push(o);
                    }
                }
            }
        } else if (rejectionType === 'dti') {
            for (const o of sameProgram) {
                if (o.status === 'APPROVED' || o.status === 'CONDITIONAL') {
                    const oDP = o.downPaymentPct ?? 0;
                    const offerDP = offer.downPaymentPct ?? 0;
                    if (oDP > offerDP) {
                        candidates.push(o);
                    }
                }
            }
        } else {
            for (const o of sameProgram) {
                if (o.status === 'APPROVED' || o.status === 'CONDITIONAL') {
                    candidates.push(o);
                }
            }
        }

        candidates.sort((a, b) => b.approvalProbability - a.approvalProbability);

        offer.suggestedAlternatives = candidates.slice(0, 3);
    }
}

export async function compareOffers(
    input: ApplicationInput,
    programs: Program[],
    tenantId: number
): Promise<Offer[]> {
    const result = await compareOffersDetailed(input, programs, tenantId, undefined, true);
    return result.allOffers ?? [];
}

export async function compareOffersDetailed(
    input: ApplicationInput,
    programs: Program[],
    tenantId: number,
    preferredTenors?: number[],
    returnAll?: boolean
): Promise<CompareOffersResult & { allOffers?: Offer[] }> {
    const errors: string[] = [];

    const condition = resolveCondition(input);
    const carAge = resolveCarAge(input);
    const maxLTV = condition === 'new' ? NEW_CAR_MAX_LTV : USED_CAR_MAX_LTV;
    const conditionMaxCarAge = condition === 'new' ? NEW_CAR_MAX_AGE_YEARS : USED_CAR_MAX_AGE_YEARS;

    if (programs.length === 0) {
        errors.push("No financing programs configured for this tenant");
        return { approved: [], conditional: [], rejected: [], errors, allOffers: [] };
    }

    const allOffers: Offer[] = [];

    for (const program of programs) {
        const evaluation = await evaluateApplication(input, program, tenantId);

        const scenarios = generateScenarios(input, program);

        const effectiveMaxCarAge = Math.min(conditionMaxCarAge, program.maxCarAge);

        for (const scen of scenarios) {
            if (scen.months < program.minMonths || scen.months > program.maxMonths) continue;
            if (scen.downPaymentPct < program.minDownPaymentPercent) continue;
            if (scen.downPaymentPct > program.maxDownPaymentPercent) continue;
            if (carAge > effectiveMaxCarAge) continue;

            const downPaymentAmount = input.price * (scen.downPaymentPct / 100);
            const loanAmount = input.price - downPaymentAmount;
            const ltvRatio = (loanAmount / input.price) * 100;

            if (ltvRatio > maxLTV) continue;

            const offer = generateOffer(input, program, evaluation, {
                overrideMonths: scen.months,
                overrideDownPaymentPercent: scen.downPaymentPct,
            });

            allOffers.push(offer);
        }
    }

    if (preferredTenors && preferredTenors.length > 0) {
        for (const t of preferredTenors) {
            const hasScenario = allOffers.some(o => (o.tenor ?? o.months) === t);
            if (!hasScenario) {
                for (const program of programs) {
                    const existing = allOffers.find(o => o.programId === program.id);
                    if (existing) continue;
                    if (t >= program.minMonths && t <= program.maxMonths) {
                        const evaluation = await evaluateApplication(input, program, tenantId);
                        const defaultDP = Math.max(program.minDownPaymentPercent, 25);
                        const offer = generateOffer(input, program, evaluation, {
                            overrideMonths: t,
                            overrideDownPaymentPercent: defaultDP,
                        });
                        allOffers.push(offer);
                        break;
                    }
                }
            }
        }
    }

    addSuggestedAlternatives(allOffers);

    const rankable = allOffers.filter(o => o.status !== 'REJECTED');
    const ranked = rankOffers(rankable, input.requestedMonths);
    const rejected = allOffers.filter(o => o.status === 'REJECTED');

    const resultApproved = ranked
        .filter(o => o.status === 'APPROVED')
        .map((o, i) => ({ ...o, rank: i + 1 }) as RankedOffer);
    const resultConditional = ranked
        .filter(o => o.status === 'CONDITIONAL')
        .map((o, i) => ({ ...o, rank: resultApproved.length + i + 1 }) as RankedOffer);
    const resultRejected: RejectedOffer[] = rejected.map(o => ({
        programId: o.programId,
        bankId: o.bankId,
        programName: o.programName,
        status: "REJECTED" as const,
        reasons: o.reasons ?? [],
        dti: o.dti,
        riskScore: o.riskScore,
        riskLevel: o.riskLevel,
        months: o.months,
        downPayment: o.downPayment,
        downPaymentPct: o.downPaymentPct ?? 0,
        financeAmount: o.financeAmount ?? 0,
        installment: o.installment ?? 0,
    }));

    const rankedAll = rankOffers(allOffers, input.requestedMonths);
    const topOffers = rankedAll.slice(0, MAX_RESULT_OFFERS);

    const bestAlternative = topOffers.length > 0
        ? { ...topOffers[0], rank: 1 } as RankedOffer
        : undefined;

    if (allOffers.length === 0 && errors.length === 0) {
        errors.push("No qualifying offers found for the given parameters");
    }

    const result: CompareOffersResult & { allOffers?: Offer[] } = {
        approved: resultApproved,
        conditional: resultConditional,
        rejected: resultRejected,
        bestAlternative,
        errors,
        allOffers: returnAll ? topOffers : undefined,
    };

    return result;
}
