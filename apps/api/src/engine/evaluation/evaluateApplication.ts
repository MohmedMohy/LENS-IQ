import type { ApplicationInput } from "../../shared/types/applicationInput.js";
import type { Program } from "../../shared/types/program.js";
import type { EvaluationResult } from "../../shared/types/result.js";
import type { EvaluationContext } from "../types/context.js";
import type { Decision } from "../../shared/types/decision.js";
import type { EmploymentType } from "../../shared/types/scoring.js";

import { getRulesByProgram } from "../../services/getRules.js";

import { checkEligibility } from "./eligibility.js";
import { runPolicyEngine } from "./policyEngine.js";

import { evaluateRisk } from "../scoring/riskScore.js";

import { buildResult } from "../builders/result.builder.js";

function mapJobType(jobType?: string): EmploymentType | undefined {
    if (!jobType) return undefined;
    const map: Record<string, EmploymentType> = {
        government: 'government',
        gov: 'government',
        public: 'government',
        private: 'unlisted_private',
        listed: 'listed_private',
        'listed_private': 'listed_private',
        self_employed: 'self_employed',
        self: 'self_employed',
        freelance: 'self_employed',
        retired: 'retired',
    };
    return map[jobType.toLowerCase()] ?? undefined;
}

export async function evaluateApplication(
    input: ApplicationInput,
    program: Program,
    tenantId: number
): Promise<EvaluationResult> {

    const rules = await getRulesByProgram(program.id, tenantId);

    const ctx: EvaluationContext = {
        input,
        program,
        rules,
        baseDTI: 0,
        reasons: [],
    };

    const policyDecision = runPolicyEngine(ctx);

    if (policyDecision) {
        return buildResult(program.id, policyDecision, ctx);
    }

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

        return buildResult(program.id, decision, ctx);
    }

    ctx.baseDTI = eligibility.dti;

    const employmentType = mapJobType(input.job_type);

    const risk = evaluateRisk(
        input.age,
        input.salary,
        eligibility.dti,
        employmentType,
        input.iScore
    );

    let decision: Decision;

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

    return {
        ...buildResult(program.id, decision, ctx),

        interestModifier,
        maxMonthsModifier,
        calculationMethod: program.calculationMethod,
        riskScore: risk.score,
        riskLevel: risk.level,
        riskFactors: risk.riskFactors,
    };
}
