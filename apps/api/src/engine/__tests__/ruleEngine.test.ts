import { describe, it, expect } from "vitest";
import { RuleEngine } from "../rules/RuleEngine.js";
import { applyExtendedOperator } from "../rules/operators.js";
import type { Rule } from "../../shared/types/rule.js";
import type { ApplicationInput } from "../../shared/types/applicationInput.js";

const baseInput: ApplicationInput = {
  id: 1, age: 30, salary: 15000, price: 500000,
  current_liabilities: 2000, owns_property: true, owns_car: false,
  club_membership: null, insurance_number: null,
  requestedDownPayment: 100000, requestedMonths: 48,
  job_type: "government", car_age: 3,
  salary_transfer: true, iScore: 700,
};

function makeRule(overrides: Partial<Rule>): Rule {
  return {
    id: 1, program_id: 1, scope: "PROGRAM",
    field: "salary", operator: ">=", value: "5000",
    action: "REQUIRED", priority: 0,
    ...overrides,
  };
}

describe("RuleEngine", () => {
  describe("evaluate", () => {
    it("should PASS when salary >= 5000", () => {
      const rule = makeRule({ field: "salary", operator: ">=", value: "5000" });
      const result = RuleEngine.evaluate(rule, baseInput);
      expect(result.status).toBe("PASS");
    });

    it("should FAIL when salary < 5000", () => {
      const rule = makeRule({ field: "salary", operator: "<", value: "5000" });
      const result = RuleEngine.evaluate(rule, baseInput);
      expect(result.status).toBe("FAIL");
    });

    it("should handle boolean fields (owns_property)", () => {
      const rule = makeRule({ field: "owns_property", operator: "=", value: "true" });
      const result = RuleEngine.evaluate(rule, baseInput);
      expect(result.status).toBe("PASS");
    });

    it("should handle string fields (job_type)", () => {
      const rule = makeRule({ field: "job_type", operator: "=", value: "government" });
      const result = RuleEngine.evaluate(rule, baseInput);
      expect(result.status).toBe("PASS");
    });

    it("should return UNKNOWN for non-numeric field with no match", () => {
      const rule = makeRule({ field: "job_type", operator: ">", value: "government" });
      const result = RuleEngine.evaluate(rule, baseInput);
      expect(result.status).toBe("UNKNOWN");
    });

    it("should return FAIL for != when values match", () => {
      const rule = makeRule({ field: "salary", operator: "!=", value: "15000" });
      const result = RuleEngine.evaluate(rule, baseInput);
      expect(result.status).toBe("FAIL");
    });
  });

  describe("evaluateWithExtendedOperator", () => {
    it("should support 'between' operator", () => {
      const rule = makeRule({ field: "age", operator: ">=", value: "25,40" });
      const result = RuleEngine.evaluateWithExtendedOperator(rule, baseInput, "between");
      expect(result.status).toBe("PASS");
    });

    it("should support 'in' operator", () => {
      const rule = makeRule({ field: "job_type", operator: "=", value: "government,private" });
      const result = RuleEngine.evaluateWithExtendedOperator(rule, baseInput, "in");
      expect(result.status).toBe("PASS");
    });

    it("should support 'notIn' operator", () => {
      const rule = makeRule({ field: "job_type", operator: "!=", value: "freelancer,retired" });
      const result = RuleEngine.evaluateWithExtendedOperator(rule, baseInput, "notIn");
      expect(result.status).toBe("PASS");
    });

    it("should support 'exists' operator", () => {
      const rule = makeRule({ field: "iScore", operator: "=", value: "true" });
      const result = RuleEngine.evaluateWithExtendedOperator(rule, baseInput, "exists");
      expect(result.status).toBe("PASS");
    });

    it("should support 'notExists' operator", () => {
      const rule = makeRule({ field: "insurance_number", operator: "=", value: "true" });
      const result = RuleEngine.evaluateWithExtendedOperator(rule, baseInput, "notExists");
      expect(result.status).toBe("PASS");
    });

    it("should support 'regex' operator", () => {
      const rule = makeRule({ field: "job_type", operator: "=", value: "^gov" });
      const result = RuleEngine.evaluateWithExtendedOperator(rule, baseInput, "regex");
      expect(result.status).toBe("PASS");
    });
  });

  describe("evaluateBatch", () => {
    it("should evaluate multiple rules", () => {
      const rules = [
        makeRule({ field: "salary", operator: ">=", value: "5000" }),
        makeRule({ field: "age", operator: ">=", value: "18" }),
        makeRule({ field: "owns_property", operator: "=", value: "true" }),
      ];
      const results = RuleEngine.evaluateBatch(rules, baseInput);
      expect(results).toHaveLength(3);
      expect(results.every((r) => r.status === "PASS")).toBe(true);
    });
  });

  describe("partitionResults", () => {
    it("should partition results by status", () => {
      const rules = [
        makeRule({ field: "salary", operator: ">=", value: "5000" }),
        makeRule({ field: "salary", operator: ">", value: "100000" }),
      ];
      const results = RuleEngine.evaluateBatch(rules, baseInput);
      const { passed, failed } = RuleEngine.partitionResults(results);
      expect(passed).toHaveLength(1);
      expect(failed).toHaveLength(1);
    });
  });
});

describe("applyExtendedOperator", () => {
  it("should return PASS for == match", () => {
    expect(applyExtendedOperator({ field: "x", operator: "==", ruleValue: "5", fieldValue: 5 })).toBe("PASS");
  });

  it("should return FAIL for == mismatch", () => {
    expect(applyExtendedOperator({ field: "x", operator: "==", ruleValue: "5", fieldValue: 6 })).toBe("FAIL");
  });

  it("should return PASS for in match", () => {
    expect(applyExtendedOperator({ field: "x", operator: "in", ruleValue: "a,b,c", fieldValue: "b" })).toBe("PASS");
  });

  it("should return PASS for notIn when value absent", () => {
    expect(applyExtendedOperator({ field: "x", operator: "notIn", ruleValue: "a,b", fieldValue: "c" })).toBe("PASS");
  });

  it("should return PASS for contains", () => {
    expect(applyExtendedOperator({ field: "x", operator: "contains", ruleValue: "test", fieldValue: "this is a test" })).toBe("PASS");
  });

  it("should return PASS for regex match", () => {
    expect(applyExtendedOperator({ field: "x", operator: "regex", ruleValue: "\\d+", fieldValue: "123" })).toBe("PASS");
  });

  it("should return UNKNOWN for bad regex", () => {
    expect(applyExtendedOperator({ field: "x", operator: "regex", ruleValue: "[invalid", fieldValue: "test" })).toBe("UNKNOWN");
  });

  it("should return PASS for exists with value", () => {
    expect(applyExtendedOperator({ field: "x", operator: "exists", ruleValue: "true", fieldValue: "hello" })).toBe("PASS");
  });

  it("should return FAIL for exists with null", () => {
    expect(applyExtendedOperator({ field: "x", operator: "exists", ruleValue: "true", fieldValue: null })).toBe("FAIL");
  });
});
