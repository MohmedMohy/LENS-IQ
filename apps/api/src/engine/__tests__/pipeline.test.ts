import { describe, it, expect } from "vitest";
import { PipelineEngine } from "../pipeline/PipelineEngine.js";
import { ValidationStep } from "../pipeline/steps/ValidationStep.js";
import type { PipelineInput, PipelineStep, PipelineState } from "../pipeline/types.js";
import type { ApplicationInput } from "../../shared/types/applicationInput.js";

const validInput: PipelineInput = {
  applicationInput: {
    id: 1, age: 30, salary: 15000, price: 500000,
    current_liabilities: 2000, owns_property: true, owns_car: false,
    club_membership: null, insurance_number: null,
    requestedDownPayment: 100000, requestedMonths: 48,
    job_type: "government", car_age: 3,
    salary_transfer: true, iScore: 700,
  },
  programs: [],
  tenantId: 1,
};

describe("PipelineEngine", () => {
  it("should execute empty pipeline without errors", async () => {
    const pipeline = new PipelineEngine();
    const result = await pipeline.execute(validInput);
    expect(result.offers).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it("should execute ValidationStep without errors for valid input", async () => {
    const pipeline = new PipelineEngine();
    pipeline.addStep(new ValidationStep());
    const result = await pipeline.execute(validInput);
    expect(result.errors).toEqual([]);
  });

  it("should fail validation for invalid tenant ID", async () => {
    const pipeline = new PipelineEngine();
    pipeline.addStep(new ValidationStep());
    const result = await pipeline.execute({ ...validInput, tenantId: 0 });
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("should fail validation for negative salary", async () => {
    const pipeline = new PipelineEngine();
    pipeline.addStep(new ValidationStep());
    const result = await pipeline.execute({
      ...validInput,
      applicationInput: { ...validInput.applicationInput, salary: -1 },
    });
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("should fail validation for zero price", async () => {
    const pipeline = new PipelineEngine();
    pipeline.addStep(new ValidationStep());
    const result = await pipeline.execute({
      ...validInput,
      applicationInput: { ...validInput.applicationInput, price: 0 },
    });
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("should fail validation when down payment >= price", async () => {
    const pipeline = new PipelineEngine();
    pipeline.addStep(new ValidationStep());
    const result = await pipeline.execute({
      ...validInput,
      applicationInput: { ...validInput.applicationInput, requestedDownPayment: 500000, price: 500000 },
    });
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("should stop on first error", async () => {
    const pipeline = new PipelineEngine();
    pipeline.addStep(new ValidationStep());
    pipeline.addStep({
      name: "ShouldNotRun",
      execute(state: PipelineState) {
        throw new Error("This should not execute");
      },
    });
    const result = await pipeline.execute({
      ...validInput,
      applicationInput: { ...validInput.applicationInput, salary: 0 },
    });
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("should handle step exception gracefully", async () => {
    const pipeline = new PipelineEngine();
    pipeline.addStep({
      name: "CrashStep",
      execute() {
        throw new Error("Boom");
      },
    });
    const result = await pipeline.execute(validInput);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain("CrashStep");
  });

  it("should report duration", async () => {
    const pipeline = new PipelineEngine();
    const result = await pipeline.execute(validInput);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("should support adding multiple steps", async () => {
    const pipeline = new PipelineEngine();
    pipeline.addSteps([new ValidationStep()]);
    const result = await pipeline.execute(validInput);
    expect(result.errors).toEqual([]);
  });

  it("should support insertStep at position", async () => {
    const pipeline = new PipelineEngine();
    pipeline.addStep(new ValidationStep());
    const step: PipelineStep = {
      name: "InjectedStep",
      execute(state: PipelineState) {
        return { ...state, offers: [{ programId: 1, bankId: 0, status: "APPROVED", installment: 0, totalPayment: 0, interestRate: 0, months: 0, financeAmount: 0, downPayment: 0, dti: 0, riskScore: 0, riskLevel: "LOW", affordabilityScore: 0, approvalProbability: 0 }] };
      },
    };
    pipeline.insertStep(0, step);
    const result = await pipeline.execute(validInput);
    expect(result.offers.length).toBe(1);
  });
});
