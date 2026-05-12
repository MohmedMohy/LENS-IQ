// src/engine/evaluation/evaluateApplication.ts

import type { ApplicationInput } from "../../shared/types/applicationInput.js";
import type { Program } from "../../shared/types/program.js";
import type { EvaluationResult } from "../../shared/types/result.js";
import type { EvaluationContext } from "../types/context.js";
import type { Decision } from "../../shared/types/decision.js";

import { getRulesByProgram } from "../../services/getRules.js";

import { checkEligibility } from "./eligibility.js";
import { runPolicyEngine } from "./policyEngine.js";

import { evaluateRisk } from "../scoring/riskScore.js";

import { buildResult } from "../builders/result.builder.js";

export async function evaluateApplication(
    input: ApplicationInput,
    program: Program,
    tenantId: number
): Promise<EvaluationResult> {

    // =========================
    // 1. LOAD RULES
    // =========================
    const rules = await getRulesByProgram(
        program.id,
        tenantId
    );

    // =========================
    // 2. CONTEXT
    // =========================
    const ctx: EvaluationContext = {
        input,
        program,
        rules,
        baseDTI: 0,
        reasons: [],
    };

    // =========================
    // 3. POLICY ENGINE
    // =========================
    const policyDecision = runPolicyEngine(ctx);

    if (policyDecision) {
        return buildResult(
            program.id,
            policyDecision,
            ctx
        );
    }

    // =========================
    // 4. ELIGIBILITY
    // =========================
    const eligibility = checkEligibility(ctx);

    if (!eligibility.isEligible) {

        const decision: Decision = {
            type: "REJECT",
            reason: {
                type: "RISK",
                message: "Base DTI exceeds maximum threshold",
                impact: "HIGH",
            },
        };

        return buildResult(
            program.id,
            decision,
            ctx
        );
    }

    // save calculated base dti
    ctx.baseDTI = eligibility.dti;

    // =========================
    // 5. RISK ANALYSIS
    // =========================
    const risk = evaluateRisk(
        input.age,
        input.salary,
        eligibility.dti
    );

    // =========================
    // 6. DECISION + MODIFIERS
    // =========================
    let decision: Decision;

    /**
     * IMPORTANT:
     * interestModifier is now stored
     * as PERCENTAGE POINTS
     *
     * Example:
     * 10 => +10%
     * 25 => +25%
     */
    let interestModifier = 0;
    let maxMonthsModifier = 0;

    if (risk.level === "HIGH") {

        decision = {
            type: "REJECT",
            reason: {
                type: "RISK",
                message: "High risk profile",
                impact: "HIGH",
            },
        };

        interestModifier = 25;
        maxMonthsModifier = -12;

    } else if (risk.level === "MEDIUM") {

        decision = {
            type: "CONDITIONAL",
            reason: {
                type: "RISK",
                message: "Medium risk — adjusted terms applied",
                impact: "MEDIUM",
            },
        };

        interestModifier = 10;

    } else {

        decision = {
            type: "APPROVE",
            reason: {
                type: "RISK",
                message: "Low risk profile",
                impact: "LOW",
            },
        };
    }

    // =========================
    // 7. FINAL RESULT
    // =========================
    return {
        ...buildResult(
            program.id,
            decision,
            ctx
        ),

        interestModifier,
        maxMonthsModifier,
    };
}