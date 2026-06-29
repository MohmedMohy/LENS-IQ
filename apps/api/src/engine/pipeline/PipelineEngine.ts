import type { PipelineInput, PipelineState, PipelineResult, PipelineStep } from "./types.js";
import type { OfferExplanation } from "../explanation/types.js";

export class PipelineEngine {
  private steps: PipelineStep[] = [];

  addStep(step: PipelineStep): this {
    this.steps.push(step);
    return this;
  }

  addSteps(steps: PipelineStep[]): this {
    for (const s of steps) { this.steps.push(s); }
    return this;
  }

  insertStep(index: number, step: PipelineStep): this {
    this.steps.splice(index, 0, step);
    return this;
  }

  removeStep(name: string): this {
    this.steps = this.steps.filter((s) => s.name !== name);
    return this;
  }

  async execute(input: PipelineInput): Promise<PipelineResult> {
    const startTime = Date.now();
    let state: PipelineState = {
      input,
      applicationInput: input.applicationInput,
      programs: input.programs,
      tenantId: input.tenantId,
      evaluation: null,
      ruleResults: [],
      offers: [],
      explanations: new Map(),
      audit: null,
      errors: [],
    };

    for (const step of this.steps) {
      if (state.errors.length > 0) break;
      try {
        state = await step.execute(state);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown pipeline error";
        state.errors.push(`Step "${step.name}" failed: ${message}`);
        break;
      }
    }

    const durationMs = Date.now() - startTime;

    return {
      offers: state.offers,
      explanations: state.explanations,
      errors: state.errors,
      durationMs,
      auditEntries: state.audit ? 1 : 0,
    };
  }

  getStepNames(): string[] {
    return this.steps.map((s) => s.name);
  }

  clearSteps(): void {
    this.steps = [];
  }
}
