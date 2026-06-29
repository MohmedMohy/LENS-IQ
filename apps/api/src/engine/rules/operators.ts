import type { RuleOperator } from "../../shared/types/rule.js";
import type { ExtendedRuleOperator, RuleResultStatus, RuleEvaluationContext } from "./types.js";

export function applyOperator(
  fieldValue: number,
  operator: RuleOperator,
  ruleValue: number,
): boolean {
  switch (operator) {
    case ">": return fieldValue > ruleValue;
    case ">=": return fieldValue >= ruleValue;
    case "<": return fieldValue < ruleValue;
    case "<=": return fieldValue <= ruleValue;
    case "=": return fieldValue === ruleValue;
    case "!=": return fieldValue !== ruleValue;
    default: return false;
  }
}

export function applyExtendedOperator(
  ctx: RuleEvaluationContext,
): RuleResultStatus {
  const { field, operator, ruleValue, fieldValue } = ctx;

  try {
    switch (operator as ExtendedRuleOperator) {
      case "==": {
        return String(fieldValue) === ruleValue ? "PASS" : "FAIL";
      }
      case "!=": {
        return String(fieldValue) !== ruleValue ? "PASS" : "FAIL";
      }
      case ">": {
        const fv = Number(fieldValue);
        const rv = Number(ruleValue);
        return !isNaN(fv) && !isNaN(rv) && fv > rv ? "PASS" : "FAIL";
      }
      case ">=": {
        const fv = Number(fieldValue);
        const rv = Number(ruleValue);
        return !isNaN(fv) && !isNaN(rv) && fv >= rv ? "PASS" : "FAIL";
      }
      case "<": {
        const fv = Number(fieldValue);
        const rv = Number(ruleValue);
        return !isNaN(fv) && !isNaN(rv) && fv < rv ? "PASS" : "FAIL";
      }
      case "<=": {
        const fv = Number(fieldValue);
        const rv = Number(ruleValue);
        return !isNaN(fv) && !isNaN(rv) && fv <= rv ? "PASS" : "FAIL";
      }
      case "between": {
        const parts = ruleValue.split(",");
        if (parts.length !== 2) return "UNKNOWN";
        const fv = Number(fieldValue);
        const lo = Number(parts[0].trim());
        const hi = Number(parts[1].trim());
        return !isNaN(fv) && !isNaN(lo) && !isNaN(hi) && fv >= lo && fv <= hi ? "PASS" : "FAIL";
      }
      case "in": {
        const values = ruleValue.split(",").map((s) => s.trim());
        return values.includes(String(fieldValue)) ? "PASS" : "FAIL";
      }
      case "notIn": {
        const values = ruleValue.split(",").map((s) => s.trim());
        return values.includes(String(fieldValue)) ? "FAIL" : "PASS";
      }
      case "contains": {
        return String(fieldValue).toLowerCase().includes(ruleValue.toLowerCase()) ? "PASS" : "FAIL";
      }
      case "startsWith": {
        return String(fieldValue).toLowerCase().startsWith(ruleValue.toLowerCase()) ? "PASS" : "FAIL";
      }
      case "endsWith": {
        return String(fieldValue).toLowerCase().endsWith(ruleValue.toLowerCase()) ? "PASS" : "FAIL";
      }
      case "regex": {
        try {
          return new RegExp(ruleValue).test(String(fieldValue)) ? "PASS" : "FAIL";
        } catch {
          return "UNKNOWN";
        }
      }
      case "exists": {
        return fieldValue !== undefined && fieldValue !== null && fieldValue !== ""
          ? "PASS"
          : "FAIL";
      }
      case "notExists": {
        return fieldValue === undefined || fieldValue === null || fieldValue === ""
          ? "PASS"
          : "FAIL";
      }
      default: {
        return "UNKNOWN";
      }
    }
  } catch {
    return "UNKNOWN";
  }
}

export function checkAllSupportedOperators(): ExtendedRuleOperator[] {
  return [
    "==", "!=", ">", ">=", "<", "<=",
    "between", "in", "notIn",
    "contains", "startsWith", "endsWith",
    "regex", "exists", "notExists",
  ];
}
