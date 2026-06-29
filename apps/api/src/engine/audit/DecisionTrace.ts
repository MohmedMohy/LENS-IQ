import type { AuditEntry, AuditPipelineStep, AuditStoreEntry, DecisionTraceShort } from "./types.js";
import type { ApplicationInput } from "../../shared/types/applicationInput.js";
import type { Program } from "../../shared/types/program.js";
import type { EvaluationResult } from "../../shared/types/result.js";

let auditIdCounter = 0;
const inMemoryStore: AuditEntry[] = [];

export class DecisionTrace {
  private steps: AuditPipelineStep[] = [];
  private startedAt: string;
  private currentStepStart: string;

  constructor(
    private applicationId: number,
    private tenantId: number,
  ) {
    this.startedAt = new Date().toISOString();
    this.currentStepStart = this.startedAt;
  }

  beginStep(stepName: string): void {
    this.currentStepStart = new Date().toISOString();
    this.steps.push({
      stepName,
      startedAt: this.currentStepStart,
      completedAt: "",
      durationMs: 0,
      status: "PASS",
      details: {},
    });
  }

  completeStep(stepName: string, status: AuditPipelineStep["status"], details: Record<string, unknown> = {}): void {
    const step = this.steps.find((s) => s.stepName === stepName && s.completedAt === "");
    if (step) {
      step.completedAt = new Date().toISOString();
      step.durationMs = new Date(step.completedAt).getTime() - new Date(step.startedAt).getTime();
      step.status = status;
      step.details = details;
    }
  }

  failStep(stepName: string, details: Record<string, unknown> = {}): void {
    this.completeStep(stepName, "FAIL", details);
  }

  skipStep(stepName: string): void {
    this.completeStep(stepName, "SKIPPED");
  }

  recordDetails(stepName: string, details: Record<string, unknown>): void {
    const step = this.steps.find((s) => s.stepName === stepName);
    if (step) {
      step.details = { ...step.details, ...details };
    }
  }

  finalize(
    input: ApplicationInput,
    program: Program,
    evaluationResult: EvaluationResult,
    finalDecision: AuditEntry["finalDecision"],
  ): AuditEntry {
    const id = `audit_${++auditIdCounter}_${Date.now()}`;
    const now = new Date().toISOString();
    const durationMs = new Date(now).getTime() - new Date(this.startedAt).getTime();

    const entry: AuditEntry = {
      id,
      timestamp: now,
      tenantId: this.tenantId,
      applicationId: this.applicationId,
      programId: program.id,
      input,
      program,
      pipelineSteps: this.steps,
      evaluationResult,
      finalDecision,
      durationMs,
    };

    inMemoryStore.push(entry);
    if (inMemoryStore.length > 1000) {
      inMemoryStore.shift();
    }

    return entry;
  }

  static getHistory(limit = 50): AuditEntry[] {
    return inMemoryStore.slice(-limit).reverse();
  }

  static getByApplicationId(applicationId: number): AuditEntry | undefined {
    return inMemoryStore.find((e) => e.applicationId === applicationId);
  }

  static getByTenantId(tenantId: number, limit = 50): AuditEntry[] {
    return inMemoryStore
      .filter((e) => e.tenantId === tenantId)
      .slice(-limit)
      .reverse();
  }

  static buildShortTrace(entry: AuditEntry): DecisionTraceShort {
    return {
      applicationId: entry.applicationId,
      decision: entry.finalDecision,
      ruleCount: entry.pipelineSteps.length,
      riskScore: entry.evaluationResult.riskScore ?? 0,
      dti: entry.evaluationResult.installment,
      programName: entry.program.name,
    };
  }

  static clearStore(): void {
    inMemoryStore.length = 0;
  }
}
