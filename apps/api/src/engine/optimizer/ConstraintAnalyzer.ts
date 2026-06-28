import type { Offer } from "../../shared/types/offer.js";
import type { ApplicationInput } from "../../shared/types/applicationInput.js";
import type { Program } from "../../shared/types/program.js";
import type { ConstraintAnalysis, FailedRuleType, OptimizationSuggestion } from "./types.js";

export function analyzeConstraints(
  offer: Offer,
  input: ApplicationInput,
  program: Program
): ConstraintAnalysis {
  const failedRules: FailedRuleType[] = [];
  const reasons: string[] = [];
  const suggestions: OptimizationSuggestion[] = [];

  const reasonsList = offer.reasons ?? [];

  for (const r of reasonsList) {
    const msg = r.message.toLowerCase();

    if (msg.includes("dti") && msg.includes("exceed")) {
      failedRules.push("MAX_DTI");
      reasons.push(`DTI ${offer.dti}% exceeds maximum allowed`);
      suggestions.push({
        type: "INCREASE_TENURE",
        label: "Increase tenure to reduce DTI",
        currentValue: `${offer.months} months`,
        suggestedValue: `${offer.months + 12} months`,
        impact: "HIGH",
      });
      suggestions.push({
        type: "INCREASE_DOWN_PAYMENT",
        label: "Increase down payment to reduce finance amount",
        currentValue: `${offer.downPaymentPct ?? 0}%`,
        suggestedValue: `${(offer.downPaymentPct ?? 0) + 5}%`,
        impact: "HIGH",
      });
    }

    if (msg.includes("dt") && msg.includes("ceiling") || msg.includes("60%")) {
      if (!failedRules.includes("MAX_DTI")) {
        failedRules.push("MAX_DTI");
      }
      if (!reasons.some(rr => rr.includes("DTI"))) {
        reasons.push(`DTI ${offer.dti}% exceeds hard ceiling`);
      }
    }

    if (msg.includes("salary") || msg.includes("minimum salary") || msg.includes("min salary")) {
      failedRules.push("MIN_INCOME");
      reasons.push(`Salary below minimum required for this program`);
      suggestions.push({
        type: "SWITCH_PROGRAM",
        label: "Try a program with lower salary requirements",
        currentValue: program.name,
        suggestedValue: "Alternative program",
        impact: "HIGH",
      });
    }

    if (msg.includes("tenor") || msg.includes("months") || msg.includes("max months")) {
      if (offer.months > program.maxMonths) {
        failedRules.push("MAX_TENURE");
        reasons.push(`Tenure ${offer.months} exceeds program maximum ${program.maxMonths}`);
        suggestions.push({
          type: "DECREASE_TENURE",
          label: `Reduce tenure to ${program.maxMonths} months`,
          currentValue: `${offer.months} months`,
          suggestedValue: `${program.maxMonths} months`,
          impact: "MEDIUM",
        });
      }
      if (offer.months < program.minMonths) {
        failedRules.push("MIN_TENURE");
        reasons.push(`Tenure ${offer.months} below program minimum ${program.minMonths}`);
        suggestions.push({
          type: "INCREASE_TENURE",
          label: `Increase tenure to ${program.minMonths} months`,
          currentValue: `${offer.months} months`,
          suggestedValue: `${program.minMonths} months`,
          impact: "MEDIUM",
        });
      }
    }

    if (msg.includes("max age") || msg.includes("car age")) {
      failedRules.push("MAX_TENURE");
      reasons.push(`Vehicle age exceeds program limit`);
    }

    if (msg.includes("age") && !msg.includes("car")) {
      failedRules.push("AGE");
      reasons.push(`Customer age ${input.age} outside program limits`);
      suggestions.push({
        type: "SEARCH_AGE_COMPATIBLE",
        label: "Find programs compatible with customer age",
        currentValue: `${input.age} years`,
        suggestedValue: `Age-compatible program`,
        impact: "HIGH",
      });
    }

    if (msg.includes("risk") || msg.includes("risk profile") || msg.includes("high risk")) {
      failedRules.push("CUSTOM_RULE");
      reasons.push(`Risk profile too high for this program`);
      suggestions.push({
        type: "INCREASE_DOWN_PAYMENT",
        label: "Increase down payment to reduce risk",
        currentValue: `${offer.downPaymentPct ?? 0}%`,
        suggestedValue: `${(offer.downPaymentPct ?? 0) + 10}%`,
        impact: "HIGH",
      });
    }
  }

  if (input.salary < program.minSalary) {
    if (!failedRules.includes("MIN_INCOME")) {
      failedRules.push("MIN_INCOME");
      reasons.push(`Salary ${input.salary} below minimum ${program.minSalary}`);
    }
  }

  if (input.age > program.maxCustomerAge) {
    if (!failedRules.includes("AGE")) {
      failedRules.push("AGE");
      reasons.push(`Age ${input.age} exceeds program max ${program.maxCustomerAge}`);
    }
  }

  if (offer.financeAmount > 0 && program.maxFinanceAmount !== null && offer.financeAmount > program.maxFinanceAmount) {
    failedRules.push("MAX_FINANCE_AMOUNT");
    reasons.push(`Finance amount ${offer.financeAmount} exceeds maximum ${program.maxFinanceAmount}`);
    suggestions.push({
      type: "DECREASE_FINANCE_AMOUNT",
      label: `Reduce finance amount to ${program.maxFinanceAmount}`,
      currentValue: `${offer.financeAmount}`,
      suggestedValue: `${program.maxFinanceAmount}`,
      impact: "MEDIUM",
    });
  }

  const dpPct = offer.downPaymentPct ?? 0;
  if (dpPct < program.minDownPaymentPercent) {
    failedRules.push("MIN_DOWN_PAYMENT");
    reasons.push(`Down payment ${dpPct}% below minimum ${program.minDownPaymentPercent}%`);
    suggestions.push({
      type: "INCREASE_DOWN_PAYMENT",
      label: `Increase down payment to ${program.minDownPaymentPercent}%`,
      currentValue: `${dpPct}%`,
      suggestedValue: `${program.minDownPaymentPercent}%`,
      impact: "HIGH",
    });
  }

  if (program.salaryTransferRequired && !input.salary_transfer) {
    if (!failedRules.includes("EMPLOYMENT")) {
      failedRules.push("EMPLOYMENT");
      reasons.push(`Salary transfer required by this program`);
      suggestions.push({
        type: "SEARCH_EMPLOYMENT_COMPATIBLE",
        label: "Find programs without salary transfer requirement",
        currentValue: "Salary transfer required",
        suggestedValue: "No salary transfer needed",
        impact: "MEDIUM",
      });
    }
  }

  const severity = failedRules.length > 2 ? 3 : failedRules.length > 1 ? 2 : failedRules.length > 0 ? 1 : 0;

  return {
    decision: offer.status === "APPROVED" ? "APPROVED" : offer.status === "REJECTED" ? "REJECTED" : "CONDITIONAL",
    failedRules: [...new Set(failedRules)],
    reasons: [...new Set(reasons)],
    severity,
    suggestions,
  };
}
