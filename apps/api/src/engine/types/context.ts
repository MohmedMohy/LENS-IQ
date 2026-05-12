import type { ApplicationInput } from "../../shared/types/applicationInput.js";
import type { Program } from "../../shared/types/program.js";

export interface EvaluationContext {
    input: ApplicationInput;
    program: Program;
    rules: any[];

    baseDTI: number;
    reasons: any[];
}