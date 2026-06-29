import type { ScoringInput, ScoringResult, ScoringProfile } from "./types.js";
import type { ScoringRuleConfig, ScoreAdjustmentResult, ExtendedRuleOperator } from "../rules/types.js";
import { applyExtendedOperator } from "../rules/operators.js";

export class ScoringEngine {
  static calculateRisk(
    input: ScoringInput,
    profile: ScoringProfile = DEFAULT_SCORING_PROFILE,
  ): ScoringResult {
    let score = profile.baseScore;
    const adjustments: ScoreAdjustmentResult[] = [];
    let iScoreForcedHigh = false;

    for (const rule of profile.rules) {
      const adj = this.evaluateAdjustment(rule, input);
      if (adj !== null) {
        if (adj.ruleId === "iscore_forced_high" && Number(input.iScore ?? 0) < 400) {
          iScoreForcedHigh = true;
        }
        score += adj.adjustment;
        adjustments.push(adj);
      }
    }

    if (input.iScore !== undefined && input.iScore !== null && input.iScore < 400) {
      iScoreForcedHigh = true;
    }

    const finalScore = Math.min(100, Math.max(0, Math.round(score)));

    let level: "LOW" | "MEDIUM" | "HIGH";
    if (iScoreForcedHigh || finalScore >= profile.thresholds.high) {
      level = "HIGH";
    } else if (finalScore >= profile.thresholds.medium) {
      level = "MEDIUM";
    } else {
      level = "LOW";
    }

    return { score: finalScore, level, adjustments };
  }

  static calculateAffordability(
    input: ScoringInput,
    profile: ScoringProfile = DEFAULT_AFFORDABILITY_PROFILE,
  ): number {
    let score = profile.baseScore;
    for (const rule of profile.rules) {
      const adj = this.evaluateAdjustment(rule, input);
      if (adj !== null) {
        score += adj.adjustment;
      }
    }
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private static resolveFieldValue(
    field: string,
    input: ScoringInput,
  ): unknown {
    switch (field) {
      case "dti": return input.dti;
      case "salary": return input.salary;
      case "age": return input.age;
      case "employmentType": return input.employmentType;
      case "iScore": return input.iScore;
      case "riskScore": return input.riskScore;
      case "salaryTransfer": return input.salaryTransfer;
      case "vehicleCondition": return input.vehicleCondition;
      case "carAge": return input.carAge;
      default: return undefined;
    }
  }

  private static evaluateAdjustment(
    rule: ScoringRuleConfig,
    input: ScoringInput,
  ): ScoreAdjustmentResult | null {
    if (rule.conditions && rule.conditions.length > 0) {
      const allConditionsMet = rule.conditions.every((c) => {
        const raw = this.resolveFieldValue(c.field, input);
        const ctx = { field: c.field, operator: c.operator as ExtendedRuleOperator, ruleValue: String(c.value), fieldValue: raw };
        return applyExtendedOperator(ctx) === "PASS";
      });
      if (!allConditionsMet) return null;
    }

    const raw = this.resolveFieldValue(rule.field, input);
    const ctx = {
      field: rule.field,
      operator: rule.operator as ExtendedRuleOperator,
      ruleValue: String(rule.value),
      fieldValue: raw,
    };

    const status = applyExtendedOperator(ctx);
    if (status !== "PASS") return null;

    let adj = rule.scoreAdjustment;

    if (rule.field === "dti" && rule.id === "dti_penalty") {
      adj = Number(input.dti) * 0.3;
    }

    if (rule.field === "dti" && rule.id === "dti_over_40") {
      const excess = Math.max(0, Number(input.dti) - 40);
      adj = -excess * Math.abs(rule.scoreAdjustment);
    }

    if (rule.field === "riskScore" && rule.id === "risk_over_40") {
      const excess = Math.max(0, Number(input.riskScore) - 40);
      adj = -excess * Math.abs(rule.scoreAdjustment);
    }

    if (rule.maxAdjustment !== undefined) {
      if (adj < 0) adj = Math.max(adj, rule.maxAdjustment);
      else adj = Math.min(adj, rule.maxAdjustment);
    }

    const sign = adj >= 0 ? "+" : "";
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      adjustment: adj,
      reason: `${rule.name}: ${sign}${adj} pts`,
    };
  }
}

export const DEFAULT_SCORING_PROFILE: ScoringProfile = {
  id: "default",
  name: "Default Risk Scoring",
  baseScore: 20,
  rules: [
    { id: "dti_penalty", name: "DTI Penalty", field: "dti", operator: ">", value: "0", scoreAdjustment: 0.3, maxAdjustment: 30 },
    { id: "salary_30000", name: "Salary >= 30,000", field: "salary", operator: ">=", value: "30000", scoreAdjustment: -15 },
    { id: "salary_15000", name: "Salary >= 15,000", field: "salary", operator: ">=", value: "15000", scoreAdjustment: -5 },
    { id: "salary_8000", name: "Salary >= 8,000", field: "salary", operator: ">=", value: "8000", scoreAdjustment: 0 },
    { id: "salary_5000", name: "Salary >= 5,000", field: "salary", operator: ">=", value: "5000", scoreAdjustment: 10 },
    { id: "salary_low", name: "Salary < 5,000", field: "salary", operator: "<", value: "5000", scoreAdjustment: 20 },
    { id: "age_25_40", name: "Age 25-40 discount", field: "age", operator: "between", value: "25,40", scoreAdjustment: -5 },
    { id: "age_under_25", name: "Age < 25 penalty", field: "age", operator: "<", value: "25", scoreAdjustment: 5 },
    { id: "age_over_50", name: "Age > 50 penalty", field: "age", operator: ">", value: "50", scoreAdjustment: 5 },
    { id: "emp_government", name: "Government employee", field: "employmentType", operator: "==", value: "government", scoreAdjustment: -10 },
    { id: "emp_listed", name: "Listed private", field: "employmentType", operator: "==", value: "listed_private", scoreAdjustment: -5 },
    { id: "emp_self", name: "Self employed", field: "employmentType", operator: "==", value: "self_employed", scoreAdjustment: 10 },
    { id: "emp_retired", name: "Retired", field: "employmentType", operator: "==", value: "retired", scoreAdjustment: 5 },
    { id: "iscore_excellent", name: "i-Score Excellent", field: "iScore", operator: ">=", value: "700", scoreAdjustment: -15 },
    { id: "iscore_good", name: "i-Score Good", field: "iScore", operator: "between", value: "600,699", scoreAdjustment: -5 },
    { id: "iscore_fair", name: "i-Score Fair", field: "iScore", operator: "between", value: "500,599", scoreAdjustment: 10 },
    { id: "iscore_poor", name: "i-Score Poor", field: "iScore", operator: "between", value: "400,499", scoreAdjustment: 20 },
    { id: "iscore_bad", name: "i-Score Bad", field: "iScore", operator: "<", value: "400", scoreAdjustment: 35 },
  ],
  thresholds: { high: 65, medium: 35 },
};

export const DEFAULT_AFFORDABILITY_PROFILE: ScoringProfile = {
  id: "affordability_default",
  name: "Default Affordability Scoring",
  baseScore: 100,
  rules: [
    { id: "dti_over_40", name: "DTI > 40 penalty", field: "dti", operator: ">=", value: "40", scoreAdjustment: -1.5 },
    { id: "risk_over_40", name: "Risk > 40 penalty", field: "riskScore", operator: ">=", value: "40", scoreAdjustment: -0.5 },
    { id: "no_salary_transfer", name: "No salary transfer", field: "salaryTransfer", operator: "==", value: "false", scoreAdjustment: -5 },
    { id: "old_used_car", name: "Used car > 3 years", field: "carAge", operator: ">", value: "3", scoreAdjustment: -5, conditions: [{ id: "used_cond", name: "Is used", field: "vehicleCondition", operator: "==", value: "used", scoreAdjustment: 0 }] },
  ],
  thresholds: { high: 60, medium: 30 },
};
