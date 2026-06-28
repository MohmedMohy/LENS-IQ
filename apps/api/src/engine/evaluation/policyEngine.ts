import type { EvaluationContext } from "../types/context.js";
import type { Decision } from "../../shared/types/decision.js";
import { evaluateRule } from "../rules/ruleEvaluator.js";

export function runPolicyEngine(
    ctx: EvaluationContext
): Decision | null {

    let hasConditionalSignal = false;

    for (const rule of ctx.rules) {

        const ruleMet = evaluateRule(rule, ctx.input);

        if (ruleMet && rule.action === "REJECT") {
            return {
                type: "REJECT",
                reason: {
                    type: "RULE",
                    message: `Reject rule: ${rule.field}`,
                    impact: "HIGH",
                },
            };
        }

        if (!ruleMet && rule.action === "REQUIRED") {
            return {
                type: "REJECT",
                reason: {
                    type: "RULE",
                    message: `Required failed: ${rule.field}`,
                    impact: "HIGH",
                },
            };
        }

        if (ruleMet && rule.action === "REQUIRED") {
            hasConditionalSignal = true;
        }

        if (ruleMet && rule.action === "WARN") {
            ctx.reasons.push({
                type: "RULE",
                message: `Warning: ${rule.field}`,
                impact: "MEDIUM",
            });
        }
    }

    if (hasConditionalSignal) {
        return {
            type: "CONDITIONAL",
            reason: {
                type: "RULE",
                message: "Met required conditions — subject to review",
                impact: "MEDIUM",
            },
        };
    }

    return null;
}
