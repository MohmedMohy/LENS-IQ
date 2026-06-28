import type { EvaluationContext } from "../types/context.js";
import { calculateDTI, ELIGIBILITY_CEILING } from "../scoring/dti.js";

export function checkEligibility(
    ctx: EvaluationContext
): { dti: number; isEligible: boolean; status: string } {

    const dtiResult = calculateDTI(
        ctx.input.salary,
        0,
        ctx.input.current_liabilities,
        (ctx.input.job_type as any) ?? undefined
    );

    const isEligible = dtiResult.status !== 'exceeds_ceiling';

    return {
        dti: dtiResult.value,
        isEligible,
        status: dtiResult.status,
    };
}