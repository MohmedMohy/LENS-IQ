import type { Rule, RuleField } from "../../shared/types/rule.js";
import type { ApplicationInput } from "../../shared/types/applicationInput.js";
import { applyOperator } from "./operators.js";

const BOOL_FIELDS = new Set<RuleField>([
  "owns_property",
  "salary_transfer",
]);

const STRING_FIELDS = new Set<RuleField>([
  "job_type",
]);

const FIELD_MAP: Partial<Record<RuleField, keyof ApplicationInput>> = {
  down_payment: "requestedDownPayment",
};

function resolveField(field: RuleField, input: ApplicationInput): unknown {
  const mappedKey = FIELD_MAP[field];
  if (mappedKey) {
    return input[mappedKey];
  }
  return input[field as keyof ApplicationInput];
}

export function evaluateRule(rule: Rule, input: ApplicationInput): boolean {
  const raw = resolveField(rule.field, input);

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