import type { RuleOperator } from "../../shared/types/rule.js";

export function applyOperator(
    fieldValue: number,
    operator: RuleOperator,
    ruleValue: number
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