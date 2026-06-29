import { describe, it, expect } from "vitest";
import { ExplanationBuilder } from "../explanation/ExplanationBuilder.js";
import type { Offer } from "../../shared/types/offer.js";
import type { ApplicationInput } from "../../shared/types/applicationInput.js";
import type { Program } from "../../shared/types/program.js";
import type { EvaluationResult } from "../../shared/types/result.js";

const baseInput: ApplicationInput = {
  id: 1, age: 30, salary: 15000, price: 500000,
  current_liabilities: 2000, owns_property: true, owns_car: false,
  club_membership: null, insurance_number: null,
  requestedDownPayment: 100000, requestedMonths: 48,
  job_type: "government", car_age: 3,
  salary_transfer: true, iScore: 700,
};

const baseProgram: Program = {
  id: 1, tenantId: 1, name: "Test Program", code: null,
  description: null, customerTypes: ["salary_transfer"],
  priority: 0, requiredDocuments: [],
  defaultRiskRules: null, financingType: "conventional",
  calculationMethod: "reducing", minSalary: 5000,
  maxCustomerAge: 65, maxCarAge: 10,
  allowedConditions: "both", maxVehiclePrice: null,
  interestRate: 12, profitRate: null,
  maxMonths: 60, minMonths: 12,
  minDownPaymentPercent: 20, maxDownPaymentPercent: 50,
  maxFinanceAmount: null, adminFeesPercent: 1,
  salaryTransferRequired: false, active: true,
};

const baseEvaluation: EvaluationResult = {
  programId: 1, status: "APPROVED", installment: 5000, reasons: [],
  riskScore: 20, riskLevel: "LOW", calculationMethod: "reducing",
};

function makeOffer(overrides: Partial<Offer>): Offer {
  return {
    programId: 1, bankId: 0, status: "APPROVED",
    installment: 5000, totalPayment: 300000, interestRate: 12,
    months: 48, financeAmount: 400000, downPayment: 100000,
    dti: 25, riskScore: 20, riskLevel: "LOW",
    affordabilityScore: 85, approvalProbability: 85,
    programName: "Test Program",
    ...overrides,
  };
}

describe("ExplanationBuilder", () => {
  describe("buildOfferExplanation", () => {
    it("should include risk factors", () => {
      const offer = makeOffer({});
      const explanation = ExplanationBuilder.buildOfferExplanation(
        offer, baseInput, baseProgram, baseEvaluation,
        [], [], [], [],
      );
      expect(explanation.riskFactors.length).toBeGreaterThan(0);
    });

    it("should include advantages for approved offers", () => {
      const offer = makeOffer({ status: "APPROVED" });
      const explanation = ExplanationBuilder.buildOfferExplanation(
        offer, baseInput, baseProgram, baseEvaluation,
        [], [], [], [],
      );
      expect(explanation.advantages.length).toBeGreaterThan(0);
    });

    it("should have recommendation text", () => {
      const offer = makeOffer({ status: "APPROVED" });
      const explanation = ExplanationBuilder.buildOfferExplanation(
        offer, baseInput, baseProgram, baseEvaluation,
        [], [], [], [],
      );
      expect(explanation.recommendation.length).toBeGreaterThan(0);
    });

    it("should compute customer match score", () => {
      const offer = makeOffer({ months: 48, tenor: 48 });
      const explanation = ExplanationBuilder.buildOfferExplanation(
        offer, baseInput, baseProgram, baseEvaluation,
        [], [], [], [],
      );
      expect(explanation.customerMatchScore).toBeGreaterThan(0);
    });

    it("should penalize mismatched tenor", () => {
      const offer = makeOffer({ months: 12, tenor: 12 });
      const mismatchedInput: ApplicationInput = { ...baseInput, requestedMonths: 60 };
      const explanation = ExplanationBuilder.buildOfferExplanation(
        offer, mismatchedInput, baseProgram, baseEvaluation,
        [], [], [], [],
      );
      expect(explanation.customerMatchScore).toBeLessThan(100);
    });
  });

  describe("buildSummary", () => {
    it("should count offers by status", () => {
      const offers = [
        makeOffer({ status: "APPROVED" }),
        makeOffer({ status: "CONDITIONAL" }),
        makeOffer({ status: "REJECTED" }),
      ];
      const summary = ExplanationBuilder.buildSummary(offers, new Map());
      expect(summary.totalOffers).toBe(3);
      expect(summary.approvedCount).toBe(1);
      expect(summary.conditionalCount).toBe(1);
      expect(summary.rejectedCount).toBe(1);
    });
  });
});
