import type { EvaluationContext } from "../types/context.js";
import type { Decision } from "../../shared/types/decision.js";
import { evaluateRule } from "../rules/ruleEvaluator.js";

/**
 * =========================
 * Policy Engine (Rule Layer)
 * =========================
 * - Evaluates business rules only
 * - No final decision responsibility
 * - Returns only signal or null
 */
export function runPolicyEngine(
    ctx: EvaluationContext
): Decision | null {

    // =========================
    // 1. RULE EVALUATION LOOP
    // =========================
    for (const rule of ctx.rules) {

        const ruleMet = evaluateRule(rule, ctx.input);

        // =========================
        // 2. REJECT RULE
        // =========================
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

        // =========================
        // 3. REQUIRED RULE FAILED
        // =========================
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

        // =========================
        // 4. WARN ONLY (NO STOP)
        // =========================
        if (ruleMet && rule.action === "WARN") {
            ctx.reasons.push({
                type: "RULE",
                message: `Warning: ${rule.field}`,
                impact: "MEDIUM",
            });
        }
    }

    // =========================
    // 5. NO BLOCKING RULES
    // =========================
    return null;
}