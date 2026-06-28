import { describe, it } from "node:test";
import assert from "node:assert";

import { analyzeConstraints } from "../ConstraintAnalyzer.js";
import { generateCandidates } from "../CandidateGenerator.js";
import { rankOffersSmart, computeCustomerPreferenceScore, computeDeviationScore } from "../RankingEngine.js";
import { DEFAULT_OPTIMIZER_CONFIG } from "../config.js";
import { createCandidateKey } from "../types.js";
import type { Offer } from "../../../shared/types/offer.js";
import type { ApplicationInput } from "../../../shared/types/applicationInput.js";
import type { Program } from "../../../shared/types/program.js";
import type { CandidateRequest } from "../types.js";

const mockInput: ApplicationInput = {
  id: 0,
  age: 30,
  salary: 15000,
  price: 500000,
  current_liabilities: 2000,
  owns_property: false,
  owns_car: false,
  club_membership: null,
  insurance_number: null,
  requestedDownPayment: 100000,
  requestedMonths: 48,
  job_type: "government",
  car_age: 3,
  salary_transfer: true,
};

const mockProgram: Program = {
  id: 1,
  tenantId: 1,
  bankId: 1,
  name: "Test Program",
  financingType: "conventional",
  calculationMethod: "reducing",
  minSalary: 5000,
  maxCustomerAge: 65,
  maxCarAge: 10,
  allowedConditions: "both",
  maxVehiclePrice: 2000000,
  interestRate: 14,
  profitRate: null,
  maxMonths: 96,
  minMonths: 12,
  minDownPaymentPercent: 20,
  maxDownPaymentPercent: 50,
  maxFinanceAmount: 1000000,
  adminFeesPercent: 1,
  salaryTransferRequired: false,
  active: true,
};

const mockRejectedOffer: Offer = {
  programId: 1,
  bankId: 1,
  programName: "Test Program",
  bankName: "Test Bank",
  status: "REJECTED",
  installment: 15000,
  totalPayment: 720000,
  interestRate: 14,
  months: 48,
  financeAmount: 400000,
  downPayment: 100000,
  dti: 58,
  riskScore: 45,
  riskLevel: "HIGH",
  affordabilityScore: 35,
  approvalProbability: 25,
  reasons: [
    { type: "RISK", message: "DTI exceeds maximum limit", impact: "HIGH" },
    { type: "RISK", message: "High risk profile", impact: "HIGH" },
  ],
  effectiveAnnualRate: 14,
  tenor: 48,
  downPaymentPct: 20,
  downPaymentAmount: 100000,
  loanAmount: 400000,
  LTV: 80,
  calculationMethod: "reducing",
  suggestedAlternatives: [],
};

const mockApprovedOffer: Offer = {
  programId: 1,
  bankId: 1,
  programName: "Test Program",
  bankName: "Test Bank",
  status: "APPROVED",
  installment: 8000,
  totalPayment: 576000,
  interestRate: 12,
  months: 72,
  financeAmount: 350000,
  downPayment: 150000,
  dti: 38,
  riskScore: 25,
  riskLevel: "LOW",
  affordabilityScore: 80,
  approvalProbability: 85,
  reasons: [{ type: "SYSTEM", message: "Application approved", impact: "LOW" }],
  effectiveAnnualRate: 12,
  tenor: 72,
  downPaymentPct: 30,
  downPaymentAmount: 150000,
  loanAmount: 350000,
  LTV: 70,
  calculationMethod: "reducing",
  suggestedAlternatives: [],
};

void describe("ConstraintAnalyzer", () => {
  void it("should detect DTI failure", () => {
    const analysis = analyzeConstraints(mockRejectedOffer, mockInput, mockProgram);
    assert.ok(analysis.failedRules.includes("MAX_DTI"));
    assert.ok(analysis.reasons.some(r => r.includes("DTI")));
    assert.ok(analysis.severity >= 1);
  });

  void it("should detect max finance amount failure", () => {
    const highFinanceOffer = { ...mockApprovedOffer, financeAmount: 1500000 };
    const analysis = analyzeConstraints(highFinanceOffer, mockInput, mockProgram);
    assert.ok(analysis.failedRules.includes("MAX_FINANCE_AMOUNT"));
  });

  void it("should return suggestions for DTI failure", () => {
    const analysis = analyzeConstraints(mockRejectedOffer, mockInput, mockProgram);
    assert.ok(analysis.suggestions.length > 0);
    const tenureSuggestion = analysis.suggestions.find(s => s.type === "INCREASE_TENURE");
    assert.ok(tenureSuggestion);
  });

  void it("should return severity 0 for no failures", () => {
    const analysis = analyzeConstraints(mockApprovedOffer, mockInput, mockProgram);
    assert.strictEqual(analysis.severity, 0);
  });

  void it("should detect age failure", () => {
    const oldInput = { ...mockInput, age: 70 };
    const analysis = analyzeConstraints(mockApprovedOffer, oldInput, mockProgram);
    assert.ok(analysis.failedRules.includes("AGE"));
  });
});

void describe("CandidateGenerator", () => {
  const baseRequest: CandidateRequest = {
    months: 48,
    downPaymentPercent: 20,
    downPaymentAmount: 100000,
    financeAmount: 400000,
    programId: 1,
    bankId: 1,
    calculationMethod: "reducing",
  };

  void it("should generate tenure increase candidates for DTI failure", () => {
    const analysis = { failedRules: ["MAX_DTI"], suggestions: [{ type: "INCREASE_TENURE" as const, label: "", currentValue: "", suggestedValue: "", impact: "HIGH" as const }] };
    const candidates = generateCandidates(mockInput, baseRequest, analysis, [mockProgram], DEFAULT_OPTIMIZER_CONFIG);
    assert.ok(candidates.length > 0);
    assert.ok(candidates.every(c => c.months >= 60));
  });

  void it("should generate down payment increase candidates", () => {
    const analysis = { failedRules: ["MIN_DOWN_PAYMENT"], suggestions: [{ type: "INCREASE_DOWN_PAYMENT" as const, label: "", currentValue: "", suggestedValue: "", impact: "HIGH" as const }] };
    const candidates = generateCandidates(mockInput, baseRequest, analysis, [mockProgram], DEFAULT_OPTIMIZER_CONFIG);
    assert.ok(candidates.length > 0);
    assert.ok(candidates.every(c => c.downPaymentPercent > baseRequest.downPaymentPercent));
  });

  void it("should generate program switch candidates", () => {
    const altProgram = { ...mockProgram, id: 2, name: "Alt Program", bankId: 2 };
    const analysis = { failedRules: ["MIN_INCOME"], suggestions: [{ type: "SWITCH_PROGRAM" as const, label: "", currentValue: "", suggestedValue: "", impact: "HIGH" as const }] };
    const candidates = generateCandidates(mockInput, baseRequest, analysis, [mockProgram, altProgram], DEFAULT_OPTIMIZER_CONFIG);
    assert.ok(candidates.length > 0);
    assert.ok(candidates.some(c => c.programId === 2));
  });

  void it("should not modify the original request", () => {
    const originalMonths = baseRequest.months;
    const analysis = { failedRules: ["MAX_DTI"], suggestions: [{ type: "INCREASE_TENURE" as const, label: "", currentValue: "", suggestedValue: "", impact: "HIGH" as const }] };
    generateCandidates(mockInput, baseRequest, analysis, [mockProgram], DEFAULT_OPTIMIZER_CONFIG);
    assert.strictEqual(baseRequest.months, originalMonths);
  });
});

void describe("RankingEngine", () => {
  void it("should rank approved offers higher", () => {
    const offers = [mockRejectedOffer, mockApprovedOffer];
    const ranked = rankOffersSmart(offers, mockInput);
    assert.ok(ranked.length === 2);
    assert.strictEqual(ranked[0].status, "APPROVED");
  });

  void it("should compute customer preference score", () => {
    const score = computeCustomerPreferenceScore(mockApprovedOffer, mockInput);
    assert.ok(score >= 0 && score <= 100);
  });

  void it("should penalize large deviations", () => {
    const farOffer = { ...mockApprovedOffer, months: 12, tenor: 12, downPaymentPct: 50 };
    const closeOffer = { ...mockApprovedOffer, months: 48, tenor: 48, downPaymentPct: 20 };
    const farScore = computeCustomerPreferenceScore(farOffer, mockInput);
    const closeScore = computeCustomerPreferenceScore(closeOffer, mockInput);
    assert.ok(closeScore > farScore);
  });

  void it("should compute deviation score", () => {
    const score = computeDeviationScore(mockApprovedOffer, mockInput);
    assert.ok(score >= 0 && score <= 100);
  });

  void it("should sort descending by score", () => {
    const lowScore = { ...mockApprovedOffer, approvalProbability: 10 };
    const highScore = { ...mockApprovedOffer, approvalProbability: 90 };
    const ranked = rankOffersSmart([lowScore, highScore], mockInput);
    assert.ok((ranked[0].programScore ?? 0) >= (ranked[1].programScore ?? 0));
  });
});

void describe("Deduplication", () => {
  void it("should create unique keys for different candidates", () => {
    const a: CandidateRequest = { months: 48, downPaymentPercent: 20, downPaymentAmount: 100000, financeAmount: 400000, programId: 1, bankId: 1, calculationMethod: "reducing" };
    const b: CandidateRequest = { months: 60, downPaymentPercent: 20, downPaymentAmount: 100000, financeAmount: 400000, programId: 1, bankId: 1, calculationMethod: "reducing" };
    assert.notStrictEqual(createCandidateKey(a), createCandidateKey(b));
  });

  void it("should create same keys for identical candidates", () => {
    const a: CandidateRequest = { months: 48, downPaymentPercent: 20, downPaymentAmount: 100000, financeAmount: 400000, programId: 1, bankId: 1, calculationMethod: "reducing" };
    const b: CandidateRequest = { months: 48, downPaymentPercent: 20, downPaymentAmount: 100000, financeAmount: 400000, programId: 1, bankId: 1, calculationMethod: "reducing" };
    assert.strictEqual(createCandidateKey(a), createCandidateKey(b));
  });
});

void describe("NearMiss", () => {
  void it("should detect near miss when DTI is slightly above threshold", () => {
    const nearMissOffer: Offer = {
      ...mockRejectedOffer,
      dti: 53,
    };
    const maxAllowed = 50;
    const dtiDiff = nearMissOffer.dti - maxAllowed;
    assert.ok(dtiDiff > 0);
    assert.ok(dtiDiff <= DEFAULT_OPTIMIZER_CONFIG.nearMissDtiThreshold);
  });
});
