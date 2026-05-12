import type { Rule } from "../../shared/types/rule.js";
import type { ApplicationInput } from "../../shared/types/applicationInput.js";
import { applyOperator } from "./operators.js";

const BOOL_FIELDS = new Set<Rule["field"]>([
  "owns_property",
  "salary_transfer",
]);

const STRING_FIELDS = new Set<Rule["field"]>([
  "job_type",
]);

export function evaluateRule(rule: Rule, input: ApplicationInput): boolean {
  const raw = input[rule.field as keyof ApplicationInput];

  if (BOOL_FIELDS.has(rule.field)) {
    const fieldVal = Boolean(raw);
    const ruleVal = rule.value === "true";

    return rule.operator === "="
      ? fieldVal === ruleVal
      : fieldVal !== ruleVal;
  }

  if (STRING_FIELDS.has(rule.field)) {
    const fieldVal = String(raw ?? "").toLowerCase();
    const ruleVal = rule.value.toLowerCase();

    return rule.operator === "="
      ? fieldVal === ruleVal
      : fieldVal !== ruleVal;
  }

  const fieldVal = Number(raw);
  const ruleVal = Number(rule.value);

  if (isNaN(fieldVal) || isNaN(ruleVal)) return false;

  return applyOperator(fieldVal, rule.operator, ruleVal);
}