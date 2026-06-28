import type { ApplicationInput } from "../../shared/types/applicationInput.js";
import type { Program } from "../../shared/types/program.js";
import type { Offer } from "../../shared/types/offer.js";
import type { EvaluationResult } from "../../shared/types/result.js";

import { evaluateApplication } from "../evaluation/evaluateApplication.js";
import { generateOffer } from "../offers/offerGenerator.js";
import { analyzeConstraints } from "./ConstraintAnalyzer.js";
import { generateCandidates as generateCandidatesFn } from "./CandidateGenerator.js";
import { rankOffersSmart } from "./RankingEngine.js";
import { DEFAULT_OPTIMIZER_CONFIG, type OptimizerConfig } from "./config.js";
import {
  type CandidateRequest,
  type SmartOffer,
  type SmartOptimizerResult,
  type ConstraintAnalysis,
  type OptimizationExplanation,
  type OptimizationStep,
  type OptimizationSummary,
  type NearMissInfo,
  createCandidateKey,
} from "./types.js";
import { MAX_DTI_STANDARD, MAX_DTI_GOVERNMENT, ELIGIBILITY_CEILING } from "../scoring/dti.js";

function mapJobType(jobType?: string): "government" | "listed_private" | "unlisted_private" | "self_employed" | "retired" | undefined {
  if (!jobType) return undefined;
  const map: Record<string, any> = {
    government: "government",
    gov: "government",
    public: "government",
    private: "unlisted_private",
    listed: "listed_private",
    listed_private: "listed_private",
    self_employed: "self_employed",
    self: "self_employed",
    freelance: "self_employed",
    freelancer: "self_employed",
    retired: "retired",
  };
  return map[jobType.toLowerCase()] ?? undefined;
}

function makeCandidateFromOffer(offer: Offer, programId: number, bankId: number, calculationMethod: string): CandidateRequest {
  return {
    months: offer.tenor ?? offer.months,
    downPaymentPercent: offer.downPaymentPct ?? 0,
    downPaymentAmount: offer.downPaymentAmount ?? offer.downPayment,
    financeAmount: offer.financeAmount,
    programId,
    bankId,
    calculationMethod,
  };
}

function checkNearMiss(
  offer: Offer,
  input: ApplicationInput,
  employmentType: string | undefined,
  config: OptimizerConfig
): NearMissInfo | undefined {
  if (offer.status !== "REJECTED") return undefined;

  const maxAllowed = employmentType === "government" ? MAX_DTI_GOVERNMENT : MAX_DTI_STANDARD;

  if (offer.dti > maxAllowed && offer.dti <= ELIGIBILITY_CEILING) {
    const dtiDiff = offer.dti - maxAllowed;
    if (dtiDiff <= config.nearMissDtiThreshold) {
      const suggestions: string[] = [];
      suggestions.push(`Increase tenure to reduce DTI by ${dtiDiff.toFixed(1)}%`);
      const extraDP = Math.round((dtiDiff / 100) * input.salary * 12);
      suggestions.push(`Increase down payment by approximately ${extraDP.toLocaleString()} EGP`);
      return {
        nearMiss: true,
        dtiDifference: dtiDiff,
        suggestions,
      };
    }
  }

  return undefined;
}

function buildExplanation(
  originalRequest: CandidateRequest,
  finalOffer: Offer,
  steps: OptimizationStep[]
): OptimizationExplanation {
  const changes: string[] = [];
  const stepDescriptions: string[] = [];

  for (const s of steps) {
    if (s.details) {
      stepDescriptions.push(s.details);
      if (s.action.includes("tenure") || s.action.includes("amount") || s.action.includes("down payment") || s.action.includes("program") || s.action.includes("bank") || s.action.includes("method")) {
        changes.push(s.details);
      }
    }
  }

  const reason = finalOffer.status === "APPROVED"
    ? "Optimization successful"
    : "Best available offer after optimization";

  return {
    originalTenure: originalRequest.months,
    optimizedTenure: finalOffer.tenor ?? finalOffer.months,
    steps: stepDescriptions,
    reason,
    changes,
  };
}

function logOptimization(
  message: string,
  data?: Record<string, unknown>
): void {
  const timestamp = new Date().toISOString();
  const dataStr = data ? ` ${JSON.stringify(data)}` : "";
  console.log(`[OPTIMIZER] ${timestamp} ${message}${dataStr}`);
}

export async function smartOptimize(
  input: ApplicationInput,
  programs: Program[],
  tenantId: number,
  config: OptimizerConfig = DEFAULT_OPTIMIZER_CONFIG
): Promise<SmartOptimizerResult> {
  const startTime = Date.now();
  const visited = new Set<string>();
  const approvedOffers: SmartOffer[] = [];
  const timeline: OptimizationStep[] = [];
  let evaluatedCount = 0;
  let depth = 0;
  let maxDepthReached = 0;
  let totalCandidatesGenerated = 0;

  const activePrograms = programs.filter(p => p.active);
  if (activePrograms.length === 0) {
    logOptimization("No active programs found");
    return {
      offers: [],
      timeline: { steps: [] },
      summary: {
        evaluatedCandidates: 0,
        approvedOffers: 0,
        rejectedOffers: 0,
        bestScore: 0,
        optimizationTimeMs: 0,
        maxDepthReached: 0,
        candidatesGenerated: 0,
      },
      visitedStates: 0,
    };
  }

  const employmentType = mapJobType(input.job_type);

  const initialDPPct = input.price > 0
    ? Math.round((input.requestedDownPayment / input.price) * 100)
    : 0;

  const initialRequests: CandidateRequest[] = activePrograms.map(p => {
    const dpPct = Math.max(p.minDownPaymentPercent, Math.min(p.maxDownPaymentPercent, initialDPPct));
    return {
      months: Math.max(p.minMonths, Math.min(p.maxMonths, input.requestedMonths)),
      downPaymentPercent: dpPct,
      downPaymentAmount: input.price * (dpPct / 100),
      financeAmount: Math.max(0, input.price - input.price * (dpPct / 100)),
      programId: p.id,
      bankId: p.bankId,
      calculationMethod: p.calculationMethod,
    };
  });

  const priorityQueue: Array<{ request: CandidateRequest; depth: number; parentSteps: OptimizationStep[] }> =
    initialRequests.map(req => ({ request: req, depth: 0, parentSteps: [] }));

  timeline.push({ step: 1, action: "Initialize optimization", details: `Starting with ${activePrograms.length} active programs` });

  while (priorityQueue.length > 0 && approvedOffers.length < config.maxOffers) {
    const elapsed = Date.now() - startTime;
    if (elapsed > config.maxExecutionTimeMs) {
      timeline.push({ step: timeline.length + 1, action: "Execution time limit reached", details: `${elapsed}ms exceeded max ${config.maxExecutionTimeMs}ms` });
      logOptimization("Execution time limit reached", { elapsed, maxCandidates: evaluatedCount });
      break;
    }

    if (evaluatedCount >= config.maxCandidates) {
      timeline.push({ step: timeline.length + 1, action: "Max candidate limit reached", details: `Evaluated ${evaluatedCount} candidates` });
      logOptimization("Max candidate limit reached", { evaluatedCount });
      break;
    }

    if (depth >= config.maxDepth) {
      timeline.push({ step: timeline.length + 1, action: "Max depth reached", details: `Depth ${depth}` });
      break;
    }

    const current = priorityQueue.shift()!;
    const req = current.request;
    depth = current.depth;
    maxDepthReached = Math.max(maxDepthReached, depth);

    const candidateKey = createCandidateKey(req);
    if (visited.has(candidateKey)) continue;
    visited.add(candidateKey);

    const program = activePrograms.find(p => p.id === req.programId);
    if (!program) continue;

    const evaluation = await evaluateApplication(input, program, tenantId);

    const evaluationWithOverrides: EvaluationResult = {
      ...evaluation,
      calculationMethod: req.calculationMethod as any,
    };

    const offer = generateOffer(input, program, evaluationWithOverrides, {
      overrideMonths: req.months,
      overrideDownPaymentPercent: req.downPaymentPercent,
    });

    evaluatedCount++;

    const analysis = analyzeConstraints(offer, input, program);

    if (offer.status !== "REJECTED" || analysis.severity === 0) {
      const isDuplicate = approvedOffers.some(
        a => a.programId === offer.programId
          && (a.tenor ?? a.months) === (offer.tenor ?? offer.months)
          && a.financeAmount === offer.financeAmount
          && a.downPaymentPct === offer.downPaymentPct
          && a.calculationMethod === offer.calculationMethod
      );

      if (!isDuplicate && (offer.status === "APPROVED" || offer.status === "CONDITIONAL")) {
        const nearMiss = config.enableNearMiss ? checkNearMiss(offer, input, employmentType, config) : undefined;
        const explanation = buildExplanation(
          initialRequests[0] ?? req,
          offer,
          [...current.parentSteps, { step: timeline.length + 1, action: "Approved", details: "Offer approved" }]
        );

        const smartOffer: SmartOffer = {
          ...offer,
          optimizationExplanation: explanation,
          nearMiss,
        };

        approvedOffers.push(smartOffer);

        timeline.push({
          step: timeline.length + 1,
          action: "Found approved offer",
          details: `Program: ${program.name}, ${req.months} months, ${req.downPaymentPercent}% DP`,
        });

        logOptimization("Approved offer found", {
          programId: program.id,
          months: req.months,
          dps: req.downPaymentPercent,
          score: offer.approvalProbability,
        });
      }
    }

    if (offer.status === "REJECTED" && depth < config.maxDepth) {
      const candidates = generateCandidatesFn(input, req, {
        failedRules: analysis.failedRules,
        suggestions: analysis.suggestions,
      }, activePrograms, config);

      totalCandidatesGenerated += candidates.length;

      const uniqueCandidates = candidates.filter(c => !visited.has(createCandidateKey(c)));

      for (const c of uniqueCandidates.slice(0, 5)) {
        const actionDescription = describeChange(req, c);
        const nextSteps = [
          ...current.parentSteps,
          {
            step: current.parentSteps.length + 1,
            action: actionDescription,
            details: `Program ${c.programId}: ${req.months}→${c.months}mo, ${req.downPaymentPercent}→${c.downPaymentPercent}% DP, ${req.calculationMethod}→${c.calculationMethod}`,
          },
        ];
        priorityQueue.push({ request: c, depth: depth + 1, parentSteps: nextSteps });
      }
    }
  }

  const ranked = rankOffersSmart(approvedOffers.length > 0 ? approvedOffers : [], input);

  const finalOffers = ranked.slice(0, config.maxOffers);

  const totalApproved = finalOffers.filter(o => o.status === "APPROVED").length;
  const totalRejected = finalOffers.filter(o => o.status === "REJECTED").length;

  const bestScore = finalOffers.length > 0 ? (finalOffers[0].programScore ?? 0) : 0;

  const summary: OptimizationSummary = {
    evaluatedCandidates: evaluatedCount,
    approvedOffers: totalApproved,
    rejectedOffers: totalRejected,
    bestScore,
    optimizationTimeMs: Date.now() - startTime,
    maxDepthReached,
    candidatesGenerated: totalCandidatesGenerated,
  };

  logOptimization("Optimization complete", {
    evaluated: evaluatedCount,
    approved: totalApproved,
    bestScore,
    timeMs: summary.optimizationTimeMs,
    depth: maxDepthReached,
  });

  return {
    offers: finalOffers,
    timeline: { steps: timeline },
    summary,
    visitedStates: visited.size,
  };
}

function describeChange(from: CandidateRequest, to: CandidateRequest): string {
  if (from.months !== to.months && from.months < to.months) return "Increase tenure";
  if (from.months !== to.months && from.months > to.months) return "Decrease tenure";
  if (from.downPaymentPercent !== to.downPaymentPercent) return "Increase down payment";
  if (from.financeAmount !== to.financeAmount) return "Adjust finance amount";
  if (from.programId !== to.programId) return "Switch program";
  if (from.bankId !== to.bankId) return "Switch bank";
  if (from.calculationMethod !== to.calculationMethod) return "Switch calculation method";
  return "Adjust parameters";
}
