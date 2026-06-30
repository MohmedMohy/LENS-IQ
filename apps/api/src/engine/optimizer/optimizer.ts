import type { ApplicationInput } from "../../shared/types/applicationInput.js";
import type { Program, ProgramBank } from "../../shared/types/program.js";
import type { Offer } from "../../shared/types/offer.js";
import type { EvaluationResult } from "../../shared/types/result.js";

import { evaluateApplication } from "../evaluation/evaluateApplication.js";
import { runPolicyEngine } from "../evaluation/policyEngine.js";
import { generateOffer } from "../offers/offerGenerator.js";
import { analyzeConstraints } from "./ConstraintAnalyzer.js";
import { generateCandidates as generateCandidatesFn } from "./CandidateGenerator.js";
import { rankOffersSmart } from "./RankingEngine.js";
import { DEFAULT_OPTIMIZER_CONFIG, type OptimizerConfig } from "./config.js";
import { getRulesByProgramAndScope } from "../../services/getRules.js";
import type { EvaluationContext } from "../types/context.js";
import {
  type CandidateRequest,
  type SmartOffer,
  type SmartOptimizerResult,
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
    government: "government", gov: "government", public: "government",
    private: "unlisted_private", listed: "listed_private", listed_private: "listed_private",
    self_employed: "self_employed", self: "self_employed", freelance: "self_employed", freelancer: "self_employed",
    retired: "retired",
  };
  return map[jobType.toLowerCase()] ?? undefined;
}

function getEffectiveTerms(program: Program, bankId: number): ProgramBank {
    const bankTerms = program.banks?.find(b => b.bankId === bankId);
    if (bankTerms) return bankTerms;
    return {
        programId: program.id,
        bankId,
        interestRate: program.interestRate,
        profitRate: program.profitRate,
        minMonths: program.minMonths,
        maxMonths: program.maxMonths,
        minDownPaymentPercent: program.minDownPaymentPercent,
        maxDownPaymentPercent: program.maxDownPaymentPercent,
        maxFinanceAmount: program.maxFinanceAmount,
        adminFeesPercent: program.adminFeesPercent,
        maxCarAge: program.maxCarAge,
        maxVehiclePrice: program.maxVehiclePrice,
        active: true,
    };
}

function checkNearMiss(
  offer: Offer, input: ApplicationInput, employmentType: string | undefined, config: OptimizerConfig
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
      return { nearMiss: true, dtiDifference: dtiDiff, suggestions };
    }
  }
  return undefined;
}

function buildExplanation(
  originalRequest: CandidateRequest, finalOffer: Offer, steps: OptimizationStep[]
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
  return {
    originalTenure: originalRequest.months,
    optimizedTenure: finalOffer.tenor ?? finalOffer.months,
    steps: stepDescriptions,
    reason: finalOffer.status === "APPROVED" ? "Optimization successful" : "Best available offer after optimization",
    changes,
  };
}

function logOptimization(message: string, data?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  const dataStr = data ? ` ${JSON.stringify(data)}` : "";
  console.log(`[OPTIMIZER] ${timestamp} ${message}${dataStr}`);
}

function generateAllParameterCombinations(
  input: ApplicationInput, program: Program, bankTerms: ProgramBank
): CandidateRequest[] {
  const results: CandidateRequest[] = [];
  const dpValues: number[] = [];
  const monthValues: number[] = [];

  const requestedDP = input.price > 0 ? Math.round((input.requestedDownPayment / input.price) * 100) : bankTerms.minDownPaymentPercent;

  for (let dp = bankTerms.minDownPaymentPercent; dp <= bankTerms.maxDownPaymentPercent; dp += 5) {
    dpValues.push(dp);
  }
  if (!dpValues.includes(requestedDP) && requestedDP >= bankTerms.minDownPaymentPercent && requestedDP <= bankTerms.maxDownPaymentPercent) {
    dpValues.push(requestedDP);
  }

  for (let m = bankTerms.minMonths; m <= bankTerms.maxMonths; m += 12) {
    monthValues.push(m);
  }
  const requestedM = Math.max(bankTerms.minMonths, Math.min(bankTerms.maxMonths, input.requestedMonths));
  if (!monthValues.includes(requestedM)) {
    monthValues.push(requestedM);
  }
  monthValues.sort((a, b) => a - b);

  for (const months of monthValues) {
    for (const dp of dpValues) {
      const dpAmount = input.price * (dp / 100);
      results.push({
        months,
        downPaymentPercent: dp,
        downPaymentAmount: dpAmount,
        financeAmount: Math.max(0, input.price - dpAmount),
        programId: program.id,
        bankId: bankTerms.bankId,
        calculationMethod: program.calculationMethod,
      });
    }
  }

  return results;
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
  let maxDepthReached = 0;
  let totalCandidatesGenerated = 0;

  const activePrograms = programs.filter(p => p.active);
  if (activePrograms.length === 0) {
    return {
      offers: [], timeline: { steps: [] },
      summary: { evaluatedCandidates: 0, approvedOffers: 0, rejectedOffers: 0, bestScore: 0, optimizationTimeMs: 0, maxDepthReached: 0, candidatesGenerated: 0 },
      visitedStates: 0,
    };
  }

  const employmentType = mapJobType(input.job_type);

  const bankRulesCache = new Map<number, any[]>();

  for (const p of activePrograms) {
    const activeBanks = (p.banks || []).filter(b => b.active);
    const bankIds = activeBanks.length > 0 ? activeBanks.map(b => b.bankId) : [0];

    for (const bankId of bankIds) {
      const bankTerms = getEffectiveTerms(p, bankId);
      const combos = generateAllParameterCombinations(input, p, bankTerms);
      totalCandidatesGenerated += combos.length;
      for (const c of combos) {
        const key = createCandidateKey(c);
        if (!visited.has(key)) {
          visited.add(key);
        }
      }
    }

    bankRulesCache.set(p.id, await getRulesByProgramAndScope(p.id, "BANK", tenantId));
  }

  timeline.push({ step: 1, action: "Initialize optimization", details: `Generated ${visited.size} unique parameter combinations across ${activePrograms.length} programs` });

  let stepCounter = 2;
  let bestProgramScore = 0;

  const allKeys = [...visited];
  visited.clear();

  for (let i = 0; i < allKeys.length && approvedOffers.length < config.maxOffers; i++) {
    const elapsed = Date.now() - startTime;
    if (elapsed > config.maxExecutionTimeMs) {
      timeline.push({ step: stepCounter++, action: "Execution time limit reached", details: `${elapsed}ms` });
      break;
    }
    if (evaluatedCount >= config.maxCandidates) {
      timeline.push({ step: stepCounter++, action: "Max candidate limit reached", details: `${evaluatedCount} candidates` });
      break;
    }
    if (evaluatedCount >= allKeys.length) break;

    const key = allKeys[i];
    if (visited.has(key)) continue;
    visited.add(key);

    const parts = key.split(":");
    const bankId = Number(parts[0]);
    const programId = Number(parts[1]);
    const months = Number(parts[2]);
    const financeAmount = Number(parts[3]);
    const calculationMethod = parts[4];
    const downPaymentPercent = Number(parts[5]);

    const program = activePrograms.find(p => p.id === programId);
    if (!program) continue;

    const bankTerms = getEffectiveTerms(program, bankId);

    const downPaymentAmount = input.price * (downPaymentPercent / 100);

    const evaluation = await evaluateApplication(input, program, tenantId);
    const evaluationWithOverrides: EvaluationResult = {
      ...evaluation,
      calculationMethod: calculationMethod as any,
    };

    const programBankRules = bankRulesCache.get(program.id);
    if (programBankRules && programBankRules.length > 0) {
        const bankCtx: EvaluationContext = {
            input,
            program,
            rules: programBankRules,
            baseDTI: 0,
            reasons: [],
        };
        const bankPolicy = runPolicyEngine(bankCtx);
        if (bankPolicy) {
            continue;
        }
    }

    const bankName = bankTerms.bankName;
    const offer = await generateOffer(input, program, evaluationWithOverrides, bankTerms, bankId, bankName, {
      overrideMonths: months,
      overrideDownPaymentPercent: downPaymentPercent,
    }, tenantId);

    evaluatedCount++;

    if (offer.status === "APPROVED" || offer.status === "CONDITIONAL") {
      const isDuplicate = approvedOffers.some(
        a => a.programId === programId
          && a.bankId === bankId
          && (a.tenor ?? a.months) === months
          && a.financeAmount === offer.financeAmount
          && a.downPaymentPct === downPaymentPercent
          && a.calculationMethod === calculationMethod
      );

      if (!isDuplicate) {
        const nearMiss = config.enableNearMiss ? checkNearMiss(offer, input, employmentType, config) : undefined;
        const originalRequest: CandidateRequest = {
          months: input.requestedMonths,
          downPaymentPercent: input.price > 0 ? Math.round((input.requestedDownPayment / input.price) * 100) : 0,
          downPaymentAmount: input.requestedDownPayment,
          financeAmount: input.price - input.requestedDownPayment,
          programId, bankId, calculationMethod,
        };
        const explanation = buildExplanation(originalRequest, offer, [
          { step: 1, action: "Evaluate", details: `Original: ${input.requestedMonths}mo, ${Math.round((input.requestedDownPayment / input.price) * 100)}% DP` },
          { step: 2, action: "Optimize", details: `${months}mo, ${downPaymentPercent}% DP, ${calculationMethod}` },
          { step: 3, action: "Approved", details: `DTI ${offer.dti}%, Score ${offer.approvalProbability}%` },
        ]);

        const smartOffer: SmartOffer = {
          ...offer,
          optimizationExplanation: explanation,
          nearMiss,
        };

        approvedOffers.push(smartOffer);

        if (offer.approvalProbability > bestProgramScore) {
          bestProgramScore = offer.approvalProbability;
        }

        timeline.push({
          step: stepCounter++, action: "Found approved offer",
          details: `${program.name} / ${bankName || `Bank #${bankId}`}: ${months}mo, ${downPaymentPercent}% DP, approval ${offer.approvalProbability}%`,
        });
      }
    } else {
      const analysis = analyzeConstraints(offer, input, program);
      if (config.enableNearMiss) {
        const nearMiss = checkNearMiss(offer, input, employmentType, config);
        if (nearMiss) {
          timeline.push({
            step: stepCounter++, action: "Near miss detected",
            details: `DTI ${offer.dti}%, ${nearMiss.suggestions.join(", ")}`,
          });
        }
      }
    }
  }

  const ranked = rankOffersSmart(approvedOffers.length > 0 ? approvedOffers : [], input);
  const finalOffers = ranked.slice(0, config.maxOffers);

  const totalApproved = finalOffers.filter(o => o.status === "APPROVED").length;
  const totalRejected = finalOffers.filter(o => o.status === "REJECTED").length;

  const summary: OptimizationSummary = {
    evaluatedCandidates: evaluatedCount,
    approvedOffers: totalApproved,
    rejectedOffers: totalRejected,
    bestScore: bestProgramScore,
    optimizationTimeMs: Date.now() - startTime,
    maxDepthReached,
    candidatesGenerated: totalCandidatesGenerated,
  };

  logOptimization("Optimization complete", { evaluated: evaluatedCount, approved: finalOffers.length, bestScore: bestProgramScore, timeMs: summary.optimizationTimeMs });

  return {
    offers: finalOffers,
    timeline: { steps: timeline },
    summary,
    visitedStates: visited.size,
  };
}
