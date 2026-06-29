import type { ApplicationInput } from "../../shared/types/applicationInput.js";
import type { Program } from "../../shared/types/program.js";
import type { Offer } from "../../shared/types/offer.js";
import type { EvaluationResult } from "../../shared/types/result.js";
import type { RuleResult } from "../rules/types.js";
import type { DecisionTrace } from "../audit/DecisionTrace.js";
import type { OfferExplanation } from "../explanation/types.js";

export interface PipelineInput {
  applicationInput: ApplicationInput;
  programs: Program[];
  tenantId: number;
}

export interface PipelineState {
  input: PipelineInput;
  applicationInput: ApplicationInput;
  programs: Program[];
  selectedProgram?: Program;
  tenantId: number;
  evaluation: EvaluationResult | null;
  ruleResults: RuleResult[];
  offers: Offer[];
  explanations: Map<string, OfferExplanation>;
  audit: DecisionTrace | null;
  errors: string[];
}

export interface PipelineStep {
  name: string;
  execute(state: PipelineState): Promise<PipelineState> | PipelineState;
}

export interface PipelineResult {
  offers: Offer[];
  explanations: Map<string, OfferExplanation>;
  errors: string[];
  durationMs: number;
  auditEntries: number;
}

export type PipelineStepConstructor = new () => PipelineStep;
