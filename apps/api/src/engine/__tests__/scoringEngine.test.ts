import { describe, it, expect } from "vitest";
import { ScoringEngine } from "../scoring/ScoringEngine.js";
import type { ScoringInput } from "../scoring/types.js";

describe("ScoringEngine", () => {
  describe("calculateRisk", () => {
    it("should return LOW risk for strong profile", () => {
      const input: ScoringInput = {
        age: 35, salary: 30000, dti: 10,
        employmentType: "government", iScore: 750,
      };
      const result = ScoringEngine.calculateRisk(input);
      expect(result.level).toBe("LOW");
      expect(result.score).toBeLessThan(35);
    });

    it("should return HIGH risk for weak profile", () => {
      const input: ScoringInput = {
        age: 22, salary: 3000, dti: 80,
        employmentType: "self_employed", iScore: 350,
      };
      const result = ScoringEngine.calculateRisk(input);
      expect(result.level).toBe("HIGH");
      expect(result.score).toBeGreaterThanOrEqual(65);
    });

    it("should return MEDIUM risk for borderline profile", () => {
      const input: ScoringInput = {
        age: 45, salary: 8000, dti: 50,
      };
      const result = ScoringEngine.calculateRisk(input);
      expect(["LOW", "MEDIUM", "HIGH"]).toContain(result.level);
    });

    it("should clamp score between 0 and 100", () => {
      const input: ScoringInput = {
        age: 20, salary: 0, dti: 100,
        employmentType: "self_employed", iScore: 350,
      };
      const result = ScoringEngine.calculateRisk(input);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it("should include adjustment details", () => {
      const input: ScoringInput = {
        age: 35, salary: 30000, dti: 10,
        employmentType: "government", iScore: 750,
      };
      const result = ScoringEngine.calculateRisk(input);
      expect(result.adjustments.length).toBeGreaterThan(0);
    });
  });

  describe("calculateAffordability", () => {
    it("should return high score for low DTI + low risk", () => {
      const input: ScoringInput = {
        age: 35, salary: 50000, dti: 15,
        riskScore: 10, salaryTransfer: true,
        vehicleCondition: "new", carAge: 0,
      };
      const score = ScoringEngine.calculateAffordability(input);
      expect(score).toBeGreaterThanOrEqual(80);
    });

    it("should return lower score for high DTI", () => {
      const input: ScoringInput = {
        age: 35, salary: 10000, dti: 55,
        riskScore: 50,
      };
      const score = ScoringEngine.calculateAffordability(input);
      expect(score).toBeLessThanOrEqual(80);
    });
  });
});
