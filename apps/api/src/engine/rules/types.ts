export type RuleResultStatus = "PASS" | "FAIL" | "SKIPPED" | "UNKNOWN";

export interface RuleResult {
  ruleId: number;
  field: string;
  operator: string;
  expectedValue: string;
  actualValue: unknown;
  status: RuleResultStatus;
  code: string;
  reason: string;
  message: string;
  priority: number;
}

export interface RuleEvaluationContext {
  field: string;
  operator: string;
  ruleValue: string;
  fieldValue: unknown;
}

export type ExtendedRuleOperator =
  | "==" | "!=" | ">" | ">=" | "<" | "<="
  | "between" | "in" | "notIn"
  | "contains" | "startsWith" | "endsWith"
  | "regex" | "exists" | "notExists";

export interface ScoringRuleConfig {
  id: string;
  name: string;
  field: string;
  operator: ExtendedRuleOperator;
  value: string | number | (string | number)[];
  scoreAdjustment: number;
  maxAdjustment?: number;
  conditions?: ScoringRuleConfig[];
}

export interface ScoringRuleSet {
  rules: ScoringRuleConfig[];
  baseScore: number;
}

export interface ScoreAdjustmentResult {
  ruleId: string;
  ruleName: string;
  adjustment: number;
  reason: string;
}
