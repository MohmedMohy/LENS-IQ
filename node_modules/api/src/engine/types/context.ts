import type { ApplicationInput } from "../../shared/types/applicationInput.js";
import type { Program } from "../../shared/types/program.js";
import type { Rule } from "../../shared/types/rule.js";
import type { Reason } from "../../shared/types/result.js";

export interface EvaluationContext {
    input: ApplicationInput;
    program: Program;
    rules: Rule[];
    baseDTI: number;
    reasons: Reason[];
}
