import type { ApplicationInput } from "../../shared/types/applicationInput.js";
import type { Program, ProgramBank } from "../../shared/types/program.js";
import type { Offer } from "../../shared/types/offer.js";
import type { CompareOffersResult, RankedOffer, RejectedOffer } from "../../shared/types/compareResult.js";
import type { EvaluationContext } from "../types/context.js";

import { evaluateApplication } from "../evaluation/evaluateApplication.js";
import { runPolicyEngine } from "../evaluation/policyEngine.js";
import { getRulesByProgramAndScope } from "../../services/getRules.js";
import { generateOffer } from "./offerGenerator.js";
import { rankOffers } from "./Ranking.js";

const MAX_RESULT_OFFERS = 10;

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

function resolveMaxLTV(program: Program, bankTerms: ProgramBank, condition: 'new' | 'used'): number {
    if (bankTerms.maxLtvPercent !== undefined && bankTerms.maxLtvPercent !== null) return bankTerms.maxLtvPercent;
    if (program.maxLtvPercent !== undefined && program.maxLtvPercent !== null) return program.maxLtvPercent;
    return condition === 'new' ? 80 : 70;
}

function getEffectiveTerms(program: Program, bankId: number): ProgramBank {
    const bankTerms = program.banks?.find(b => b.bankId === bankId);
    if (bankTerms) return bankTerms;
    return {
        programId: program.id,
        bankId,
        interestRate: program.interestRate,
        profitRate: program.profitRate,
        minMonths: program.minMonths,
        maxMonths: program.maxMonths,
        minDownPaymentPercent: program.minDownPaymentPercent,
        maxDownPaymentPercent: program.maxDownPaymentPercent,
        maxFinanceAmount: program.maxFinanceAmount,
        adminFeesPercent: program.adminFeesPercent,
        maxCarAge: program.maxCarAge,
        maxVehiclePrice: program.maxVehiclePrice,
        active: true,
    };
}

function generateScenarios(
    input: ApplicationInput,
    program: Program,
    bankTerms: ProgramBank
): { months: number; downPaymentPct: number }[] {
    const scenarios: { months: number; downPaymentPct: number }[] = [];

    const clientMonths = input.requestedMonths || bankTerms.maxMonths;
    const clientDP = input.price > 0
        ? Math.round((input.requestedDownPayment / input.price) * 100)
        : bankTerms.minDownPaymentPercent;

    const monthsSet = new Set<number>();

    monthsSet.add(clamp(clientMonths, bankTerms.minMonths, bankTerms.maxMonths));

    for (let m = Math.min(bankTerms.maxMonths, clientMonths + 12); m <= bankTerms.maxMonths; m += 12) {
        monthsSet.add(m);
    }
    for (let m = clientMonths - 12; m >= bankTerms.minMonths; m -= 12) {
        monthsSet.add(m);
    }

    for (const m of [12, 24, 36, 48, 60, 72, 84, 96]) {
        if (m >= bankTerms.minMonths && m <= bankTerms.maxMonths) {
            monthsSet.add(m);
        }
    }

    const validMonths = [...monthsSet]
        .filter(m => m >= bankTerms.minMonths && m <= bankTerms.maxMonths)
        .sort((a, b) => b - a);

    const dpSet = new Set<number>();

    for (const dp of [20, 25, 30, 35, 40, 45, 50]) {
        if (dp >= bankTerms.minDownPaymentPercent && dp <= bankTerms.maxDownPaymentPercent) {
            dpSet.add(dp);
        }
    }

    if (clientDP >= bankTerms.minDownPaymentPercent && clientDP <= bankTerms.maxDownPaymentPercent) {
        dpSet.add(clientDP);
    }

    for (let step = 5; step <= 25; step += 5) {
        const higher = clientDP + step;
        const lower = clientDP - step;
        if (higher >= bankTerms.minDownPaymentPercent && higher <= bankTerms.maxDownPaymentPercent) {
            dpSet.add(higher);
        }
        if (lower >= bankTerms.minDownPaymentPercent && lower <= bankTerms.maxDownPaymentPercent) {
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
    const conditionMaxCarAge = condition === 'new' ? NEW_CAR_MAX_AGE_YEARS : USED_CAR_MAX_AGE_YEARS;

    if (programs.length === 0) {
        errors.push("No financing programs configured for this tenant");
        return { approved: [], conditional: [], rejected: [], errors, allOffers: [] };
    }

    const allOffers: Offer[] = [];

    for (const program of programs) {
        const evaluation = await evaluateApplication(input, program, tenantId);

        if (evaluation.status === "REJECTED") {
            const bankTerms = getEffectiveTerms(program, 0);
            const offer = await generateOffer(input, program, evaluation, bankTerms, 0, undefined, undefined, tenantId);
            allOffers.push(offer);
            continue;
        }

        const activeBanks = (program.banks || []).filter(b => b.active);
        const bankIdsToEvaluate = activeBanks.length > 0
            ? activeBanks.map(b => b.bankId)
            : [0];

        const bankRules = await getRulesByProgramAndScope(program.id, "BANK", tenantId);

        for (const bankId of bankIdsToEvaluate) {
            const bankTerms = getEffectiveTerms(program, bankId);

            if (!bankTerms.active) continue;

            if (bankTerms.maxVehiclePrice !== null && input.price > bankTerms.maxVehiclePrice) continue;

            const effectiveMaxCarAge = Math.min(conditionMaxCarAge, bankTerms.maxCarAge);
            if (carAge > effectiveMaxCarAge) continue;

            if (bankRules.length > 0) {
                const bankCtx: EvaluationContext = {
                    input,
                    program,
                    rules: bankRules,
                    baseDTI: 0,
                    reasons: [],
                };
                const bankPolicy = runPolicyEngine(bankCtx);
                if (bankPolicy) {
                    const rejectedOffer = await generateOffer(input, program, evaluation, bankTerms, bankId, bankTerms.bankName, undefined, tenantId);
                    rejectedOffer.status = "REJECTED";
                    rejectedOffer.reasons = bankCtx.reasons.length > 0
                        ? bankCtx.reasons
                        : [{ type: "RULE", message: `Bank rule: ${bankPolicy.reason.message}`, impact: "HIGH" }];
                    allOffers.push(rejectedOffer);
                    continue;
                }
            }

            const scenarios = generateScenarios(input, program, bankTerms);

            for (const scen of scenarios) {
                if (scen.months < bankTerms.minMonths || scen.months > bankTerms.maxMonths) continue;
                if (scen.downPaymentPct < bankTerms.minDownPaymentPercent) continue;
                if (scen.downPaymentPct > bankTerms.maxDownPaymentPercent) continue;

                const downPaymentAmount = input.price * (scen.downPaymentPct / 100);
                const loanAmount = input.price - downPaymentAmount;
                const ltvRatio = (loanAmount / input.price) * 100;
                const effectiveMaxLTV = resolveMaxLTV(program, bankTerms, condition);

                if (ltvRatio > effectiveMaxLTV) continue;

                if (bankTerms.maxFinanceAmount !== null && loanAmount > bankTerms.maxFinanceAmount) continue;

                const offer = await generateOffer(input, program, evaluation, bankTerms, bankId, bankTerms.bankName, {
                    overrideMonths: scen.months,
                    overrideDownPaymentPercent: scen.downPaymentPct,
                }, tenantId);

                allOffers.push(offer);
            }
        }
    }

    if (preferredTenors && preferredTenors.length > 0) {
        for (const t of preferredTenors) {
            const hasScenario = allOffers.some(o => (o.tenor ?? o.months) === t);
            if (!hasScenario) {
                for (const program of programs) {
                    const evaluation = await evaluateApplication(input, program, tenantId);
                    const activeBanks = (program.banks || []).filter(b => b.active);
                    for (const bankTerms of activeBanks) {
                        if (t >= bankTerms.minMonths && t <= bankTerms.maxMonths) {
                            const defaultDP = Math.max(bankTerms.minDownPaymentPercent, 25);
                            const offer = await generateOffer(input, program, evaluation, bankTerms, bankTerms.bankId, bankTerms.bankName, {
                                overrideMonths: t,
                                overrideDownPaymentPercent: defaultDP,
                            }, tenantId);
                            allOffers.push(offer);
                            break;
                        }
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
