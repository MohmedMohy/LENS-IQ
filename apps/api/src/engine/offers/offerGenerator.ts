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

export function generateOffer(
    input: ApplicationInput,
    program: Program,
    evaluation: EvaluationResult,
    overrides?: GenerateOfferOverrides
): Offer {

    const employmentType = mapJobType(input.job_type);
    const maxAllowedDTI = employmentType === 'government' ? MAX_DTI_GOVERNMENT : MAX_DTI_STANDARD;
    const bankName = (program as any).bankName ?? undefined;
    const programName = program.name;

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
            bankName,
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

    const carAge = input.car_age ?? (input.carYear ? new Date().getFullYear() - input.carYear : 0);

    const finalScore = analyze({
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
    });

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
        bankId: program.bankId,
        bankName,
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
