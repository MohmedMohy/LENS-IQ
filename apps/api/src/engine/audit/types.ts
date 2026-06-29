import type { ApplicationInput } from "../../shared/types/applicationInput.js";
import type { Program } from "../../shared/types/program.js";
import type { EvaluationResult } from "../../shared/types/result.js";

export interface AuditEntry {
  id: string;
  timestamp: string;
  tenantId: number;
  applicationId: number;
  programId: number;

  input: ApplicationInput;
  program: Program;

  pipelineSteps: AuditPipelineStep[];

  evaluationResult: EvaluationResult;

  finalDecision: "APPROVED" | "REJECTED" | "CONDITIONAL";

  durationMs: number;
}

export interface AuditPipelineStep {
  stepName: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  status: "PASS" | "FAIL" | "SKIPPED";
  details: Record<string, unknown>;
}

export interface DecisionTraceShort {
  applicationId: number;
  decision: string;
  ruleCount: number;
  riskScore: number;
  dti: number;
  programName: string;
}

export interface AuditStoreEntry {
  entry: AuditEntry;
  trace: DecisionTraceShort;
}

export const AUDIT_STORE_KEYS = {
  ALL: "audit:all" as const,
  TENANT: (id: number) => `audit:tenant:${id}` as const,
  APPLICATION: (id: number) => `audit:app:${id}` as const,
};
