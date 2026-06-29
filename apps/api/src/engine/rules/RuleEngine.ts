import type { Rule } from "../../shared/types/rule.js";
import type { ApplicationInput } from "../../shared/types/applicationInput.js";
import type { RuleResult, RuleResultStatus, RuleEvaluationContext, ExtendedRuleOperator } from "./types.js";
import { applyExtendedOperator } from "./operators.js";

const BOOL_FIELDS = new Set(["owns_property", "salary_transfer"]);
const STRING_FIELDS = new Set(["job_type", "customer_type", "employment_type"]);
const FIELD_MAP: Record<string, keyof ApplicationInput> = {
  down_payment: "requestedDownPayment",
};

function resolveField(field: string, input: ApplicationInput): unknown {
  const mappedKey = FIELD_MAP[field];
  if (mappedKey) return input[mappedKey];
  return input[field as keyof ApplicationInput];
}

export class RuleEngine {
  static evaluate(rule: Rule, input: ApplicationInput): RuleResult {
    const raw = resolveField(rule.field, input);
    const status = this.evaluateSingle(rule, raw);
    return {
      ruleId: rule.id,
      field: rule.field,
      operator: rule.operator,
      expectedValue: rule.value,
      actualValue: raw,
      status,
      code: `${status}_${rule.action}_${rule.field}`,
      reason: this.buildReason(status, rule, raw),
      message: this.buildMessage(status, rule, raw),
      priority: rule.priority,
    };
  }

  static evaluateBatch(rules: Rule[], input: ApplicationInput): RuleResult[] {
    return rules.map((r) => this.evaluate(r, input));
  }

  static evaluateWithExtendedOperator(
    rule: Rule,
    input: ApplicationInput,
    operator: ExtendedRuleOperator,
  ): RuleResult {
    const raw = resolveField(rule.field, input);
    const ctx: RuleEvaluationContext = {
      field: rule.field,
      operator,
      ruleValue: rule.value,
      fieldValue: raw,
    };
    const status = applyExtendedOperator(ctx);
    return {
      ruleId: rule.id,
      field: rule.field,
      operator,
      expectedValue: rule.value,
      actualValue: raw,
      status,
      code: `${status}_${rule.action}_${rule.field}`,
      reason: this.buildReason(status, rule, raw),
      message: this.buildMessage(status, rule, raw),
      priority: rule.priority,
    };
  }

  static isPassed(result: RuleResult): boolean {
    return result.status === "PASS";
  }

  static isFailed(result: RuleResult): boolean {
    return result.status === "FAIL";
  }

  static partitionResults(
    results: RuleResult[],
  ): { passed: RuleResult[]; failed: RuleResult[]; skipped: RuleResult[]; unknown: RuleResult[] } {
    const passed: RuleResult[] = [];
    const failed: RuleResult[] = [];
    const skipped: RuleResult[] = [];
    const unknown: RuleResult[] = [];
    for (const r of results) {
      switch (r.status) {
        case "PASS": passed.push(r); break;
        case "FAIL": failed.push(r); break;
        case "SKIPPED": skipped.push(r); break;
        case "UNKNOWN": unknown.push(r); break;
      }
    }
    return { passed, failed, skipped, unknown };
  }

  private static evaluateSingle(rule: Rule, raw: unknown): RuleResultStatus {
    const operator = rule.operator as ExtendedRuleOperator;

    if (this.isExtendedOperator(operator)) {
      const ctx: RuleEvaluationContext = {
        field: rule.field,
        operator,
        ruleValue: rule.value,
        fieldValue: raw,
      };
      return applyExtendedOperator(ctx);
    }

    if (BOOL_FIELDS.has(rule.field)) {
      const fieldVal = Boolean(raw);
      const ruleVal = rule.value === "true";
      const match = rule.operator === "=" ? fieldVal === ruleVal : fieldVal !== ruleVal;
      return match ? "PASS" : "FAIL";
    }

    if (STRING_FIELDS.has(rule.field)) {
      if (rule.operator !== "=" && rule.operator !== "!=") return "UNKNOWN";
      const fieldVal = String(raw ?? "").toLowerCase();
      const ruleVal = rule.value.toLowerCase();
      const match = rule.operator === "=" ? fieldVal === ruleVal : fieldVal !== ruleVal;
      return match ? "PASS" : "FAIL";
    }

    const fieldVal = Number(raw);
    const ruleVal = Number(rule.value);
    if (isNaN(fieldVal) || isNaN(ruleVal)) return "UNKNOWN";

    switch (rule.operator) {
      case ">": return fieldVal > ruleVal ? "PASS" : "FAIL";
      case ">=": return fieldVal >= ruleVal ? "PASS" : "FAIL";
      case "<": return fieldVal < ruleVal ? "PASS" : "FAIL";
      case "<=": return fieldVal <= ruleVal ? "PASS" : "FAIL";
      case "=": return fieldVal === ruleVal ? "PASS" : "FAIL";
      case "!=": return fieldVal !== ruleVal ? "PASS" : "FAIL";
      default: return "UNKNOWN";
    }
  }

  private static isExtendedOperator(op: string): boolean {
    const extended: ExtendedRuleOperator[] = [
      "between", "in", "notIn",
      "contains", "startsWith", "endsWith",
      "regex", "exists", "notExists",
    ];
    return extended.includes(op as ExtendedRuleOperator);
  }

  private static buildReason(
    status: RuleResultStatus,
    rule: Rule,
    raw: unknown,
  ): string {
    if (status === "PASS") return `Passed: ${rule.field} ${rule.operator} ${rule.value}`;
    if (status === "FAIL") return `Failed: ${rule.field} ${rule.operator} ${rule.value} (actual: ${raw})`;
    if (status === "SKIPPED") return `Skipped: ${rule.field}`;
    return `Unknown: cannot evaluate ${rule.field} with operator ${rule.operator}`;
  }

  private static buildMessage(
    status: RuleResultStatus,
    rule: Rule,
    raw: unknown,
  ): string {
    if (status === "PASS") return `${rule.field} meets condition (${rule.action})`;
    if (status === "FAIL") return `${rule.field} value ${JSON.stringify(raw)} does not satisfy ${rule.operator} ${rule.value}`;
    if (status === "SKIPPED") return `${rule.field} evaluation skipped`;
    return `Cannot evaluate ${rule.field}`;
  }
}
