import type { EvaluateResponse, Offer } from "@/types";

const mockReasons = [
  { type: "RULE" as const, message: "Good affordability ratio", impact: "LOW" as const },
  { type: "RULE" as const, message: "DTI within acceptable range", impact: "LOW" as const },
  { type: "RULE" as const, message: "Stable employment history", impact: "LOW" as const },
  { type: "RISK" as const, message: "Salary transfer confirmed", impact: "LOW" as const },
  { type: "RULE" as const, message: "Vehicle age within policy limits", impact: "LOW" as const },
];

function createMockOffer(
  overrides: Partial<Offer> & { programId: number; bankId: number }
): Offer {
  return {
    programName: `Program ${overrides.programId}`,
    bankName: `Bank ${overrides.bankId}`,
    status: "APPROVED",
    installment: 8500,
    totalPayment: 510000,
    financeAmount: 350000,
    downPayment: 150000,
    interestRate: 12.5,
    months: 60,
    dti: 32,
    riskScore: 25,
    riskLevel: "LOW",
    affordabilityScore: 78,
    approvalProbability: 92,
    reasons: mockReasons,
    ...overrides,
  };
}

export function generateMockEvaluation(): EvaluateResponse {
  return {
    bestOffer: createMockOffer({
      programId: 1,
      bankId: 1,
      bankName: "CIB",
      programName: "Premium Auto",
      installment: 7340,
      downPayment: 150000,
      financeAmount: 350000,
      interestRate: 10.5,
      months: 60,
      status: "APPROVED",
    }),
    offers: [
      createMockOffer({
        programId: 1,
        bankId: 1,
        bankName: "CIB",
        programName: "Premium Auto",
        installment: 7340,
        downPayment: 150000,
        financeAmount: 350000,
        interestRate: 10.5,
        months: 60,
        status: "APPROVED",
      }),
      createMockOffer({
        programId: 2,
        bankId: 2,
        bankName: "QNB",
        programName: "Express Auto",
        installment: 8210,
        downPayment: 180000,
        financeAmount: 320000,
        interestRate: 13.0,
        months: 48,
        status: "CONDITIONAL",
        riskLevel: "MEDIUM",
        approvalProbability: 65,
      }),
      createMockOffer({
        programId: 3,
        bankId: 3,
        bankName: "HSBC",
        programName: "Green Finance",
        installment: 9600,
        downPayment: 200000,
        financeAmount: 300000,
        interestRate: 15.0,
        months: 36,
        status: "REJECTED",
        riskLevel: "HIGH",
        approvalProbability: 18,
      }),
    ],
  };
}
