import type { Program } from "../../shared/types/program.js";
import type { ApplicationInput } from "../../shared/types/applicationInput.js";
import type { EvaluationResult, EvaluationStatus } from "../../shared/types/result.js";
import type { Offer } from "../../shared/types/offer.js";
import type { EmploymentType } from "../../shared/types/scoring.js";

import { calculateLoan } from "../pricing/loanCalculator.js";
import { analyze } from "../scoring/scoring.js";
import { MAX_DTI_STANDARD, MAX_DTI_GOVERNMENT } from "../scoring/dti.js";

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
        private: 'unlisted_private',
        listed: 'listed_private',
        listed_private: 'listed_private',
        self_employed: 'self_employed',
        self: 'self_employed',
        freelance: 'self_employed',
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
        const dtiPenalty = Math.min(100, score.dti);
        const riskPenalty = score.riskScore;
        return Math.round(Math.max(5, 50 - (dtiPenalty * 0.3 + riskPenalty * 0.4)));
    }
    const base = score.affordabilityScore * 0.5;
    const riskBonus = Math.max(0, 100 - score.riskScore) * 0.3;
    const dtiBonus = Math.max(0, 100 - score.dti) * 0.2;
    return Math.round(Math.min(99, base + riskBonus + dtiBonus));
}

export function generateOffer(
    input: ApplicationInput,
    program: Program,
    evaluation: EvaluationResult,
    overrides?: GenerateOfferOverrides
): Offer {

    const employmentType = mapJobType(input.job_type);
    const maxAllowedDTI = employmentType === 'government' ? MAX_DTI_GOVERNMENT : MAX_DTI_STANDARD;

    if (evaluation.status === "REJECTED") {
        return {
            programId: program.id,
            bankId: program.bankId,
            programName: program.name,
            financeAmount: 0,
            downPayment: 0,
            status: "REJECTED",
            installment: 0,
            totalPayment: 0,
            interestRate: program.interestRate,
            months: overrides?.overrideMonths ?? program.maxMonths,
            dti: 0,
            riskScore: 100,
            riskLevel: "HIGH",
            affordabilityScore: 0,
            approvalProbability: computeApprovalProbability(
                { riskScore: 100, affordabilityScore: 0, dti: 0 },
                "REJECTED"
            ),
            reasons: evaluation.reasons,
            effectiveAnnualRate: 0,
            tenor: overrides?.overrideMonths ?? program.maxMonths,
            downPaymentPct: overrides?.overrideDownPaymentPercent ?? program.minDownPaymentPercent,
            downPaymentAmount: 0,
            loanAmount: 0,
            LTV: 0,
            calculationMethod: program.calculationMethod,
        };
    }

    const finalMonths = Math.max(1,
        (overrides?.overrideMonths ?? program.maxMonths) + (evaluation.maxMonthsModifier || 0)
    );

    const finalInterestRate =
        program.interestRate + (evaluation.interestModifier || 0);

    const downPaymentPercent = overrides?.overrideDownPaymentPercent ?? program.minDownPaymentPercent;

    const minBankDownPayment =
        input.price * (program.minDownPaymentPercent / 100);

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
            bankId: program.bankId,
            programName: program.name,
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
        };
    }

    const adminFeesAmount = loanAmount * (program.adminFeesPercent / 100);

    const calcMethod = program.calculationMethod ?? "reducing";

    const calc = calculateLoan(
        {
            loanAmount,
            annualRate: finalInterestRate,
            months: finalMonths,
            adminFees: adminFeesAmount,
            costPrice: program.financingType === "islamic" ? loanAmount : undefined,
            profitMarginPercent: program.profitRate ?? undefined,
        },
        calcMethod
    );

    const finalScore = analyze({
        age: input.age,
        salary: input.salary,
        installment: calc.installment,
        current_liabilities: input.current_liabilities,
        employmentType,
        iScore: input.iScore,
    });

    let finalStatus: EvaluationStatus =
        finalScore.riskLevel === "HIGH"
            ? "REJECTED"
            : evaluation.status;

    const finalReasons = [...evaluation.reasons];

    if (finalScore.dti > maxAllowedDTI) {
        finalStatus = "REJECTED";
        finalReasons.push({
            type: "RISK",
            message: `Final DTI (${finalScore.dti}%) exceeds max limit (${maxAllowedDTI}%)`,
            impact: "HIGH",
        });
    }

    const approvalProbability = computeApprovalProbability(finalScore, finalStatus);

    const LTV = input.price > 0 ? Math.round((loanAmount / input.price) * 100) : 0;

    return {
        programId: program.id,
        bankId: program.bankId,
        programName: program.name,
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
    };
}
