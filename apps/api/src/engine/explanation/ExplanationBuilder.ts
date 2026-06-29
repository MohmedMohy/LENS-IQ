import type { Offer } from "../../shared/types/offer.js";
import type { ApplicationInput } from "../../shared/types/applicationInput.js";
import type { Program } from "../../shared/types/program.js";
import type { RuleResult } from "../rules/types.js";
import type {
  OfferExplanation,
  ExplanationFactor,
  DecisionTraceStep,
  ExplanationSummary,
} from "./types.js";
import type { Reason } from "../../shared/types/result.js";
import type { EvaluationResult } from "../../shared/types/result.js";

export class ExplanationBuilder {
  static buildOfferExplanation(
    offer: Offer,
    input: ApplicationInput,
    program: Program,
    evaluation: EvaluationResult,
    passedRules: RuleResult[],
    failedRules: RuleResult[],
    skippedRules: RuleResult[],
    decisionTrace: DecisionTraceStep[],
  ): OfferExplanation {
    const riskFactors = this.buildRiskFactors(offer, evaluation);
    const { advantages, disadvantages } = this.buildProsCons(
      offer, input, program, evaluation, riskFactors,
    );
    const customerMatchScore = this.computeCustomerMatch(offer, input);
    const confidence = this.computeConfidence(offer, evaluation);
    const recommendation = this.buildRecommendation(
      offer, advantages, disadvantages, customerMatchScore,
    );

    return {
      programId: offer.programId,
      bankId: offer.bankId,
      overall: offer.status,
      approvalProbability: offer.approvalProbability,
      confidence,
      passedRules,
      failedRules,
      skippedRules,
      riskFactors,
      advantages,
      disadvantages,
      customerMatchScore,
      recommendation,
      decisionTrace,
    };
  }

  static buildSummary(
    offers: Offer[],
    explanations: Map<string, OfferExplanation>,
  ): ExplanationSummary {
    const approved = offers.filter((o) => o.status === "APPROVED");
    const conditional = offers.filter((o) => o.status === "CONDITIONAL");
    const rejected = offers.filter((o) => o.status === "REJECTED");

    let bestOffer: ExplanationSummary["bestOffer"];
    if (approved.length > 0) {
      const best = approved.reduce((a, b) =>
        a.approvalProbability > b.approvalProbability ? a : b,
      );
      const exp = explanations.get(`${best.programId}:${best.bankId}`);
      bestOffer = {
        programName: best.programName ?? `Program #${best.programId}`,
        bankName: best.bankName ?? "Default",
        approvalProbability: best.approvalProbability,
        reasons: exp?.advantages ?? [],
      };
    }

    return {
      totalOffers: offers.length,
      approvedCount: approved.length,
      conditionalCount: conditional.length,
      rejectedCount: rejected.length,
      bestOffer,
    };
  }

  private static buildRiskFactors(
    offer: Offer,
    evaluation: EvaluationResult,
  ): ExplanationFactor[] {
    const factors: ExplanationFactor[] = [];

    factors.push({
      name: "DTI",
      value: offer.dti,
      impact: offer.dti > 50 ? "NEGATIVE" : offer.dti > 30 ? "NEUTRAL" : "POSITIVE",
      weight: 0.3,
      details: `Debt-to-income ratio: ${offer.dti}%`,
    });

    factors.push({
      name: "Risk Score",
      value: offer.riskScore,
      impact: offer.riskLevel === "LOW" ? "POSITIVE" : offer.riskLevel === "MEDIUM" ? "NEUTRAL" : "NEGATIVE",
      weight: 0.25,
      details: `Risk score: ${offer.riskScore} (${offer.riskLevel})`,
    });

    factors.push({
      name: "Affordability",
      value: offer.affordabilityScore,
      impact: offer.affordabilityScore >= 70 ? "POSITIVE" : offer.affordabilityScore >= 40 ? "NEUTRAL" : "NEGATIVE",
      weight: 0.2,
      details: `Affordability score: ${offer.affordabilityScore}/100`,
    });

    return factors;
  }

  private static buildProsCons(
    offer: Offer,
    input: ApplicationInput,
    program: Program,
    evaluation: EvaluationResult,
    riskFactors: ExplanationFactor[],
  ): { advantages: string[]; disadvantages: string[] } {
    const advantages: string[] = [];
    const disadvantages: string[] = [];

    if (offer.status === "APPROVED" || offer.status === "CONDITIONAL") {
      advantages.push(`Offer approved with ${offer.approvalProbability}% probability`);
    }

    if (offer.installment > 0 && input.salary > 0) {
      const installmentRatio = (offer.installment / input.salary) * 100;
      if (installmentRatio <= 30) {
        advantages.push(`Installment (${installmentRatio.toFixed(0)}% of salary) is within comfortable range`);
      } else {
        disadvantages.push(`Installment is ${installmentRatio.toFixed(0)}% of salary — may strain budget`);
      }
    }

    if (offer.dti <= 40) {
      advantages.push(`Healthy DTI ratio of ${offer.dti}%`);
    } else if (offer.dti > 50) {
      disadvantages.push(`DTI of ${offer.dti}% exceeds standard threshold`);
    }

    if (offer.riskLevel === "LOW") {
      advantages.push("Low risk profile");
    } else if (offer.riskLevel === "HIGH") {
      disadvantages.push("High risk profile");
    }

    const tenor = offer.tenor ?? offer.months;
    if (input.requestedMonths && Math.abs(tenor - input.requestedMonths) <= 12) {
      advantages.push(`Tenor matches your preference (${tenor} months)`);
    } else {
      disadvantages.push(`Tenor (${tenor}mo) differs from requested (${input.requestedMonths}mo)`);
    }

    return { advantages, disadvantages };
  }

  private static computeCustomerMatch(
    offer: Offer,
    input: ApplicationInput,
  ): number {
    let score = 100;
    const tenor = offer.tenor ?? offer.months;
    if (input.requestedMonths) {
      score -= Math.min(30, Math.abs(tenor - input.requestedMonths) * 2);
    }
    if (offer.downPaymentPct && input.price > 0) {
      const requestedDPPct = (input.requestedDownPayment / input.price) * 100;
      score -= Math.min(20, Math.abs(offer.downPaymentPct - requestedDPPct) * 1.5);
    }
    return Math.max(0, Math.min(100, score));
  }

  private static computeConfidence(
    offer: Offer,
    evaluation: EvaluationResult,
  ): number {
    let confidence = 70;
    if (offer.riskLevel === "LOW") confidence += 15;
    if (offer.riskLevel === "HIGH") confidence -= 20;
    if (offer.dti <= 40) confidence += 10;
    if (offer.dti > 50) confidence -= 10;
    return Math.max(10, Math.min(100, confidence));
  }

  private static buildRecommendation(
    offer: Offer,
    advantages: string[],
    disadvantages: string[],
    customerMatchScore: number,
  ): string {
    if (offer.status === "APPROVED" && advantages.length > disadvantages.length) {
      return "Strongly recommended — fits your profile and preferences well";
    }
    if (offer.status === "APPROVED") {
      return "Recommended — approved with some adjustments";
    }
    if (offer.status === "CONDITIONAL") {
      return "Conditionally recommended — review the conditions before proceeding";
    }
    return "Not recommended — consider adjusting your preferences or trying different programs";
  }

  static mergeReasons(reasons: Reason[]): { passed: Reason[]; failed: Reason[] } {
    const passed: Reason[] = [];
    const failed: Reason[] = [];
    for (const r of reasons) {
      if (r.impact === "LOW") passed.push(r);
      else failed.push(r);
    }
    return { passed, failed };
  }
}
