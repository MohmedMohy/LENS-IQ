import type { Program, ProgramBank } from "../../shared/types/program.js";
import type { ApplicationInput } from "../../shared/types/applicationInput.js";
import type { EvaluationResult, EvaluationStatus } from "../../shared/types/result.js";
import type { Offer } from "../../shared/types/offer.js";
import type { EmploymentType } from "../../shared/types/scoring.js";
import type { ScoringProfile } from "../scoring/types.js";

import { calculateLoan } from "../pricing/loanCalculator.js";
import { analyze } from "../scoring/scoring.js";
import { MAX_DTI_STANDARD, MAX_DTI_GOVERNMENT } from "../scoring/dti.js";
import { ScoringProfileResolver } from "../../services/ScoringProfileResolver.js";

export type GenerateOfferOverrides = {
    overrideMonths?: number;
    overrideDownPaymentPercent?: number;
};

function mapJobType(jobType?: string): EmploymentType | undefined {
    if (!jobType) return undefined;
    const map: Record<string, EmploymentType> = {
        government: 'government',
        gov: 'government',
        public: 'government',
        corporate: 'listed_private',
        private: 'unlisted_private',
        listed: 'listed_private',
        listed_private: 'listed_private',
        self_employed: 'self_employed',
        self: 'self_employed',
        freelance: 'self_employed',
        freelancer: 'self_employed',
        retired: 'retired',
    };
    return map[jobType.toLowerCase()] ?? undefined;
}

function computeApprovalProbability(score: {
    riskScore: number;
    affordabilityScore: number;
    dti: number;
}, status: EvaluationStatus): number {
    if (status === "REJECTED") {
        const dtiPenalty = Math.min(100, Math.max(0, score.dti));
        const riskPenalty = Math.min(100, Math.max(0, score.riskScore));
        let prob = Math.round(Math.max(5, 50 - (dtiPenalty * 0.3 + riskPenalty * 0.4)));
        if (prob >= 50) prob = 49;
        return prob;
    }

    if (status === "CONDITIONAL") {
        const dtiPenalty = Math.min(100, Math.max(0, score.dti));
        const riskPenalty = Math.min(100, Math.max(0, score.riskScore));
        let prob = Math.round(Math.max(30, Math.min(65, 50 - (dtiPenalty * 0.15 + riskPenalty * 0.2))));
        if (prob === 50) prob = 49;
        return prob;
    }

    const base = Math.min(100, Math.max(0, score.affordabilityScore)) * 0.5;
    const riskBonus = Math.max(0, 100 - Math.min(100, Math.max(0, score.riskScore))) * 0.3;
    const dtiBonus = Math.max(0, 100 - Math.min(100, Math.max(0, score.dti))) * 0.2;
    let prob = Math.round(Math.min(99, base + riskBonus + dtiBonus));
    if (prob < 50) prob = 50;
    if (prob === 50) prob = 51;
    return prob;
}

export async function generateOffer(
    input: ApplicationInput,
    program: Program,
    evaluation: EvaluationResult,
    bankTerms?: ProgramBank,
    bankId?: number,
    bankName?: string,
    overrides?: GenerateOfferOverrides,
    tenantId?: number
): Promise<Offer> {

    const employmentType = mapJobType(input.job_type);
    const maxAllowedDTI = employmentType === 'government' ? MAX_DTI_GOVERNMENT : MAX_DTI_STANDARD;

    const effectiveBankId = bankId ?? (bankTerms?.bankId ?? 0);
    const effectiveBankName = bankName ?? (bankTerms as any)?.bankName ?? undefined;
    const programName = program.name;

    const finalInterestRate = bankTerms
        ? bankTerms.interestRate + (evaluation.interestModifier || 0)
        : program.interestRate + (evaluation.interestModifier || 0);

    const effectiveMinMonths = bankTerms?.minMonths ?? program.minMonths;
    const effectiveMaxMonths = bankTerms?.maxMonths ?? program.maxMonths;
    const effectiveMinDP = bankTerms?.minDownPaymentPercent ?? program.minDownPaymentPercent;
    const effectiveMaxDP = bankTerms?.maxDownPaymentPercent ?? program.maxDownPaymentPercent;
    const effectiveAdminFees = bankTerms?.adminFeesPercent ?? program.adminFeesPercent;
    const effectiveMaxFinance = bankTerms?.maxFinanceAmount ?? program.maxFinanceAmount;
    const effectiveProfitRate = bankTerms?.profitRate ?? program.profitRate;
    const effectiveFinancingType = program.financingType;

    const finalMonths = Math.max(1,
        (overrides?.overrideMonths ?? effectiveMaxMonths) + (evaluation.maxMonthsModifier || 0)
    );

    const downPaymentPercent = overrides?.overrideDownPaymentPercent ?? effectiveMinDP;

    const minBankDownPayment =
        input.price * (effectiveMinDP / 100);

    const requestedDownPayment =
        input.price * (downPaymentPercent / 100);

    const actualDownPayment = Math.max(
        minBankDownPayment,
        requestedDownPayment
    );

    const loanAmount = Math.max(0, input.price - actualDownPayment);

    if (loanAmount <= 0) {
        return {
            programId: program.id,
            bankId: effectiveBankId,
            bankName: effectiveBankName,
            programName,
            financeAmount: 0,
            downPayment: actualDownPayment,
            status: "APPROVED",
            installment: 0,
            totalPayment: actualDownPayment,
            interestRate: finalInterestRate,
            months: finalMonths,
            dti: 0,
            riskScore: 0,
            riskLevel: "LOW",
            affordabilityScore: 100,
            approvalProbability: 99,
            reasons: [{ type: "SYSTEM", message: "Full cash purchase — no financing needed", impact: "LOW" }],
            effectiveAnnualRate: 0,
            tenor: finalMonths,
            downPaymentPct: downPaymentPercent,
            downPaymentAmount: actualDownPayment,
            loanAmount: 0,
            LTV: 0,
            calculationMethod: program.calculationMethod,
            suggestedAlternatives: [],
        };
    }

    const adminFeesAmount = loanAmount * (effectiveAdminFees / 100);

    const calcMethod = program.calculationMethod ?? "reducing";

    const calc = calculateLoan(
        {
            loanAmount,
            annualRate: finalInterestRate,
            months: finalMonths,
            adminFees: adminFeesAmount,
            costPrice: effectiveFinancingType === "islamic" ? loanAmount : undefined,
            profitMarginPercent: effectiveProfitRate ?? undefined,
        },
        calcMethod
    );

    const carAge = input.car_age ?? (input.carYear ? new Date().getFullYear() - input.carYear : 0);

    let scoringProfiles: { riskProfile?: ScoringProfile; affordabilityProfile?: ScoringProfile } = {};
    if (tenantId) {
        const [riskProfile, affordabilityProfile] = await Promise.all([
            ScoringProfileResolver.loadRiskProfile(tenantId),
            ScoringProfileResolver.loadAffordabilityProfile(tenantId),
        ]);
        scoringProfiles = { riskProfile, affordabilityProfile };
    }

    const finalScore = analyze(
        {
            age: input.age,
            salary: input.salary,
            installment: calc.installment,
            current_liabilities: input.current_liabilities,
            employmentType,
            iScore: input.iScore,
            riskScore: evaluation.riskScore,
            salaryTransfer: input.salary_transfer,
            vehicleCondition: input.vehicleCondition,
            carAge,
        },
        scoringProfiles.riskProfile && scoringProfiles.affordabilityProfile
            ? { riskProfile: scoringProfiles.riskProfile, affordabilityProfile: scoringProfiles.affordabilityProfile }
            : undefined
    );

    let finalStatus: EvaluationStatus;
    if (evaluation.status === "REJECTED") {
        finalStatus = "REJECTED";
    } else {
        finalStatus =
            finalScore.riskLevel === "HIGH"
                ? "REJECTED"
                : evaluation.status;
    }

    const finalReasons = [...evaluation.reasons];

    if (finalScore.dti > maxAllowedDTI) {
        finalStatus = "REJECTED";
        if (!finalReasons.some(r => r.message.includes("DTI"))) {
            finalReasons.push({
                type: "RISK",
                message: `Final DTI (${finalScore.dti}%) exceeds max limit (${maxAllowedDTI}%)`,
                impact: "HIGH",
            });
        }
    }

    if (finalScore.dti > 60) {
        finalStatus = "REJECTED";
        if (!finalReasons.some(r => r.message.includes("ceiling") || r.message.includes("60%"))) {
            finalReasons.push({
                type: "RISK",
                message: `DTI (${finalScore.dti}%) exceeds hard ceiling of 60%`,
                impact: "HIGH",
            });
        }
    }

    const approvalProbability = computeApprovalProbability(finalScore, finalStatus);

    const LTV = input.price > 0 ? Math.round((loanAmount / input.price) * 100) : 0;

    return {
        programId: program.id,
        bankId: effectiveBankId,
        bankName: effectiveBankName,
        programName,
        financeAmount: loanAmount,
        downPayment: actualDownPayment,
        status: finalStatus,
        installment: calc.installment,
        totalPayment: calc.totalPayment,
        interestRate: finalInterestRate,
        months: finalMonths,
        dti: finalScore.dti,
        riskScore: finalScore.riskScore,
        riskLevel: finalScore.riskLevel,
        affordabilityScore: finalScore.affordabilityScore,
        approvalProbability,
        reasons: finalReasons,
        effectiveAnnualRate: calc.effectiveAnnualRate ?? calc.effectiveRate,
        tenor: finalMonths,
        downPaymentPct: downPaymentPercent,
        downPaymentAmount: actualDownPayment,
        loanAmount,
        LTV,
        calculationMethod: calcMethod,
        suggestedAlternatives: [],
    };
}
