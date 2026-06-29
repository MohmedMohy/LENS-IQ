import { describe, it, expect, beforeEach } from "vitest";
import { DecisionTrace } from "../audit/DecisionTrace.js";
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
  requiredDocuments: [],
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
};

beforeEach(() => {
  DecisionTrace.clearStore();
});

describe("DecisionTrace", () => {
  it("should record pipeline steps", () => {
    const trace = new DecisionTrace(1, 1);
    trace.beginStep("Validation");
    trace.completeStep("Validation", "PASS", { validated: true });
    trace.beginStep("Scoring");
    trace.completeStep("Scoring", "PASS", { score: 20 });

    const entry = trace.finalize(baseInput, baseProgram, baseEvaluation, "APPROVED");
    expect(entry.pipelineSteps).toHaveLength(2);
    expect(entry.pipelineSteps[0].stepName).toBe("Validation");
    expect(entry.finalDecision).toBe("APPROVED");
  });

  it("should track step duration", async () => {
    const trace = new DecisionTrace(1, 1);
    trace.beginStep("SlowStep");
    await new Promise((r) => setTimeout(r, 10));
    trace.completeStep("SlowStep", "PASS");

    const entry = trace.finalize(baseInput, baseProgram, baseEvaluation, "APPROVED");
    expect(entry.pipelineSteps[0].durationMs).toBeGreaterThanOrEqual(5);
  });

  it("should support failStep", () => {
    const trace = new DecisionTrace(1, 1);
    trace.beginStep("Validation");
    trace.failStep("Validation", { reason: "Invalid salary" });

    const entry = trace.finalize(baseInput, baseProgram, baseEvaluation, "REJECTED");
    expect(entry.pipelineSteps[0].status).toBe("FAIL");
    expect(entry.finalDecision).toBe("REJECTED");
  });

  it("should support skipStep", () => {
    const trace = new DecisionTrace(1, 1);
    trace.beginStep("OptionalStep");
    trace.skipStep("OptionalStep");

    const entry = trace.finalize(baseInput, baseProgram, baseEvaluation, "CONDITIONAL");
    expect(entry.pipelineSteps[0].status).toBe("SKIPPED");
  });

  it("should store in memory and support retrieval", () => {
    const trace = new DecisionTrace(1, 1);
    trace.beginStep("Step1");
    trace.completeStep("Step1", "PASS");
    trace.finalize(baseInput, baseProgram, baseEvaluation, "APPROVED");

    const history = DecisionTrace.getHistory();
    expect(history.length).toBe(1);
    expect(history[0].applicationId).toBe(1);
  });

  it("should retrieve by application ID", () => {
    const trace1 = new DecisionTrace(42, 1);
    trace1.beginStep("S1");
    trace1.completeStep("S1", "PASS");
    trace1.finalize(baseInput, baseProgram, baseEvaluation, "APPROVED");

    const found = DecisionTrace.getByApplicationId(42);
    expect(found).toBeDefined();
    expect(found!.applicationId).toBe(42);
  });

  it("should retrieve by tenant ID", () => {
    const trace = new DecisionTrace(1, 100);
    trace.beginStep("S1");
    trace.completeStep("S1", "PASS");
    trace.finalize(baseInput, baseProgram, baseEvaluation, "APPROVED");

    const forTenant = DecisionTrace.getByTenantId(100);
    expect(forTenant).toHaveLength(1);
  });

  it("should build a short trace", () => {
    const trace = new DecisionTrace(1, 1);
    trace.beginStep("S1");
    trace.completeStep("S1", "PASS");
    const entry = trace.finalize(baseInput, baseProgram, baseEvaluation, "APPROVED");

    const short = DecisionTrace.buildShortTrace(entry);
    expect(short.applicationId).toBe(1);
    expect(short.decision).toBe("APPROVED");
  });

  it("should limit in-memory store to 1000 entries", () => {
    for (let i = 0; i < 1010; i++) {
      const t = new DecisionTrace(i, 1);
      t.beginStep("S");
      t.completeStep("S", "PASS");
      t.finalize(baseInput, baseProgram, baseEvaluation, "APPROVED");
    }
    expect(DecisionTrace.getHistory().length).toBeLessThanOrEqual(50);
  });
});
