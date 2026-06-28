import type { EvaluationContext } from "../types/context.js";
import type { EmploymentType } from "../../shared/types/scoring.js";
import { calculateDTI, ELIGIBILITY_CEILING } from "../scoring/dti.js";

function mapJobType(jobType?: string): EmploymentType | undefined {
    if (!jobType) return undefined;
    const map: Record<string, EmploymentType> = {
        government: 'government',
        gov: 'government',
        public: 'government',
        corporate: 'listed_private',
        private: 'unlisted_private',
        listed: 'listed_private',
        listed_private: 'listed_private',
        self_employed: 'self_employed',
        self: 'self_employed',
        freelance: 'self_employed',
        freelancer: 'self_employed',
        retired: 'retired',
    };
    return map[jobType.toLowerCase()] ?? undefined;
}

export function checkEligibility(
    ctx: EvaluationContext
): { dti: number; isEligible: boolean; status: string } {

    const employmentType = mapJobType(ctx.input.job_type);

    const dtiResult = calculateDTI(
        ctx.input.salary,
        0,
        ctx.input.current_liabilities,
        employmentType
    );

    const isEligible = dtiResult.status !== 'exceeds_ceiling';

    return {
        dti: dtiResult.value,
        isEligible,
        status: dtiResult.status,
    };
}
