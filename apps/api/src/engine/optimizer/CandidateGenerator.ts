import type { ApplicationInput } from "../../shared/types/applicationInput.js";
import type { Program, ProgramBank } from "../../shared/types/program.js";
import type { CandidateRequest, OptimizationSuggestion } from "./types.js";
import type { OptimizerConfig } from "./config.js";

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function getBankTerms(program: Program): ProgramBank {
  const firstBank = program.banks?.[0];
  if (firstBank) return firstBank;
  return {
    programId: program.id,
    bankId: 0,
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

function generateDtiCandidates(
  input: ApplicationInput,
  program: Program,
  baseFinanceAmount: number,
  baseMonths: number,
  baseDownPaymentPct: number,
  config: OptimizerConfig
): CandidateRequest[] {
  const candidates: CandidateRequest[] = [];
  const bankTerms = getBankTerms(program);
  const maxAllowed = bankTerms.maxMonths;
  for (let m = baseMonths + config.tenureStep; m <= maxAllowed; m += config.tenureStep) {
    candidates.push({
      months: m,
      downPaymentPercent: baseDownPaymentPct,
      downPaymentAmount: input.price * (baseDownPaymentPct / 100),
      financeAmount: baseFinanceAmount,
      programId: program.id,
      bankId: bankTerms.bankId,
      calculationMethod: program.calculationMethod,
    });
  }
  return candidates;
}

function generateTenureReductionCandidates(
  input: ApplicationInput,
  program: Program,
  baseFinanceAmount: number,
  baseMonths: number,
  baseDownPaymentPct: number,
  config: OptimizerConfig
): CandidateRequest[] {
  const candidates: CandidateRequest[] = [];
  const bankTerms = getBankTerms(program);
  const minAllowed = bankTerms.minMonths;
  for (let m = baseMonths - config.tenureStep; m >= minAllowed; m -= config.tenureStep) {
    candidates.push({
      months: m,
      downPaymentPercent: baseDownPaymentPct,
      downPaymentAmount: input.price * (baseDownPaymentPct / 100),
      financeAmount: baseFinanceAmount,
      programId: program.id,
      bankId: bankTerms.bankId,
      calculationMethod: program.calculationMethod,
    });
  }
  return candidates;
}

function generateFinanceReductionCandidates(
  input: ApplicationInput,
  program: Program,
  baseFinanceAmount: number,
  baseMonths: number,
  baseDownPaymentPct: number,
  config: OptimizerConfig
): CandidateRequest[] {
  const candidates: CandidateRequest[] = [];
  const bankTerms = getBankTerms(program);
  const minFinanceAmount = 0;
  const step = config.loanReductionStep;
  for (let fa = baseFinanceAmount - step; fa >= minFinanceAmount; fa -= step) {
    const newDP = input.price - fa;
    const newDPPct = input.price > 0 ? Math.round((newDP / input.price) * 100) : baseDownPaymentPct;
    if (newDPPct >= bankTerms.minDownPaymentPercent && newDPPct <= bankTerms.maxDownPaymentPercent) {
      candidates.push({
        months: baseMonths,
        downPaymentPercent: newDPPct,
        downPaymentAmount: newDP,
        financeAmount: fa,
        programId: program.id,
        bankId: bankTerms.bankId,
        calculationMethod: program.calculationMethod,
      });
    }
  }
  return candidates;
}

function generateDownPaymentIncreaseCandidates(
  input: ApplicationInput,
  program: Program,
  baseMonths: number,
  baseDownPaymentPct: number,
  config: OptimizerConfig
): CandidateRequest[] {
  const candidates: CandidateRequest[] = [];
  const bankTerms = getBankTerms(program);
  const maxDP = bankTerms.maxDownPaymentPercent;
  for (let dp = baseDownPaymentPct + config.downPaymentStep; dp <= maxDP; dp += config.downPaymentStep) {
    const dpAmount = input.price * (dp / 100);
    candidates.push({
      months: baseMonths,
      downPaymentPercent: dp,
      downPaymentAmount: dpAmount,
      financeAmount: Math.max(0, input.price - dpAmount),
      programId: program.id,
      bankId: bankTerms.bankId,
      calculationMethod: program.calculationMethod,
    });
  }
  return candidates;
}

function generateProgramSwitchCandidates(
  input: ApplicationInput,
  allPrograms: Program[],
  excludeProgramId: number,
  baseMonths: number,
  baseDownPaymentPct: number,
  config: OptimizerConfig
): CandidateRequest[] {
  const candidates: CandidateRequest[] = [];
  for (const p of allPrograms) {
    if (p.id === excludeProgramId || !p.active) continue;
    const bankTerms = getBankTerms(p);
    const dp = clamp(baseDownPaymentPct, bankTerms.minDownPaymentPercent, bankTerms.maxDownPaymentPercent);
    const months = clamp(baseMonths, bankTerms.minMonths, bankTerms.maxMonths);
    const dpAmount = input.price * (dp / 100);
    candidates.push({
      months,
      downPaymentPercent: dp,
      downPaymentAmount: dpAmount,
      financeAmount: Math.max(0, input.price - dpAmount),
      programId: p.id,
      bankId: bankTerms.bankId,
      calculationMethod: p.calculationMethod,
    });
  }
  return candidates;
}

function generateBankSwitchCandidates(
  input: ApplicationInput,
  allPrograms: Program[],
  excludeBankId: number,
  baseMonths: number,
  baseDownPaymentPct: number,
  config: OptimizerConfig
): CandidateRequest[] {
  const candidates: CandidateRequest[] = [];
  const uniqueBanks = new Set<number>();
  for (const p of allPrograms) {
    const bankTerms = getBankTerms(p);
    if (bankTerms.bankId === excludeBankId || !p.active || uniqueBanks.has(bankTerms.bankId)) continue;
    uniqueBanks.add(bankTerms.bankId);
    const dp = clamp(baseDownPaymentPct, bankTerms.minDownPaymentPercent, bankTerms.maxDownPaymentPercent);
    const months = clamp(baseMonths, bankTerms.minMonths, bankTerms.maxMonths);
    const dpAmount = input.price * (dp / 100);
    candidates.push({
      months,
      downPaymentPercent: dp,
      downPaymentAmount: dpAmount,
      financeAmount: Math.max(0, input.price - dpAmount),
      programId: p.id,
      bankId: bankTerms.bankId,
      calculationMethod: p.calculationMethod,
    });
  }
  return candidates;
}

function generateMethodSwitchCandidates(
  input: ApplicationInput,
  program: Program,
  baseMonths: number,
  baseDownPaymentPct: number,
  config: OptimizerConfig
): CandidateRequest[] {
  const candidates: CandidateRequest[] = [];
  const bankTerms = getBankTerms(program);
  const methods = ["reducing", "flat", "murabaha"];
  for (const method of methods) {
    if (method === program.calculationMethod) continue;
    const dpAmount = input.price * (baseDownPaymentPct / 100);
    candidates.push({
      months: baseMonths,
      downPaymentPercent: baseDownPaymentPct,
      downPaymentAmount: dpAmount,
      financeAmount: Math.max(0, input.price - dpAmount),
      programId: program.id,
      bankId: bankTerms.bankId,
      calculationMethod: method,
    });
  }
  return candidates;
}

function generateEmploymentCompatibleCandidates(
  input: ApplicationInput,
  allPrograms: Program[],
  baseMonths: number,
  baseDownPaymentPct: number,
  config: OptimizerConfig
): CandidateRequest[] {
  const candidates: CandidateRequest[] = [];
  for (const p of allPrograms) {
    if (!p.active) continue;
    if (p.salaryTransferRequired && !input.salary_transfer) continue;
    const bankTerms = getBankTerms(p);
    const dp = clamp(baseDownPaymentPct, bankTerms.minDownPaymentPercent, bankTerms.maxDownPaymentPercent);
    const months = clamp(baseMonths, bankTerms.minMonths, bankTerms.maxMonths);
    const dpAmount = input.price * (dp / 100);
    candidates.push({
      months,
      downPaymentPercent: dp,
      downPaymentAmount: dpAmount,
      financeAmount: Math.max(0, input.price - dpAmount),
      programId: p.id,
      bankId: bankTerms.bankId,
      calculationMethod: p.calculationMethod,
    });
  }
  return candidates;
}

function generateAgeCompatibleCandidates(
  input: ApplicationInput,
  allPrograms: Program[],
  baseMonths: number,
  baseDownPaymentPct: number,
  config: OptimizerConfig
): CandidateRequest[] {
  const candidates: CandidateRequest[] = [];
  for (const p of allPrograms) {
    if (!p.active) continue;
    if (input.age > p.maxCustomerAge) continue;
    const bankTerms = getBankTerms(p);
    const dp = clamp(baseDownPaymentPct, bankTerms.minDownPaymentPercent, bankTerms.maxDownPaymentPercent);
    const months = clamp(baseMonths, bankTerms.minMonths, bankTerms.maxMonths);
    const dpAmount = input.price * (dp / 100);
    candidates.push({
      months,
      downPaymentPercent: dp,
      downPaymentAmount: dpAmount,
      financeAmount: Math.max(0, input.price - dpAmount),
      programId: p.id,
      bankId: bankTerms.bankId,
      calculationMethod: p.calculationMethod,
    });
  }
  return candidates;
}

export function generateCandidates(
  input: ApplicationInput,
  currentRequest: CandidateRequest,
  analysis: { failedRules: string[]; suggestions: OptimizationSuggestion[] },
  allPrograms: Program[],
  config: OptimizerConfig
): CandidateRequest[] {
  const candidates: CandidateRequest[] = [];
  const seen = new Set<string>();
  const failedRules = analysis.failedRules;
  const suggestionTypes = new Set(analysis.suggestions.map(s => s.type));

  const addIfUnique = (c: CandidateRequest) => {
    const key = `${c.bankId}:${c.programId}:${c.months}:${c.financeAmount}:${c.calculationMethod}:${c.downPaymentPercent}`;
    if (!seen.has(key)) {
      seen.add(key);
      candidates.push(c);
    }
  };

  if (failedRules.includes("MAX_DTI") || suggestionTypes.has("INCREASE_TENURE")) {
    for (const c of generateDtiCandidates(input, allPrograms.find(p => p.id === currentRequest.programId)!, currentRequest.financeAmount, currentRequest.months, currentRequest.downPaymentPercent, config)) {
      addIfUnique(c);
    }
  }

  if (failedRules.includes("MAX_TENURE") || suggestionTypes.has("DECREASE_TENURE")) {
    const program = allPrograms.find(p => p.id === currentRequest.programId);
    if (program) {
      for (const c of generateTenureReductionCandidates(input, program, currentRequest.financeAmount, currentRequest.months, currentRequest.downPaymentPercent, config)) {
        addIfUnique(c);
      }
    }
  }

  if (failedRules.includes("MAX_FINANCE_AMOUNT") || suggestionTypes.has("DECREASE_FINANCE_AMOUNT")) {
    const program = allPrograms.find(p => p.id === currentRequest.programId);
    if (program) {
      for (const c of generateFinanceReductionCandidates(input, program, currentRequest.financeAmount, currentRequest.months, currentRequest.downPaymentPercent, config)) {
        addIfUnique(c);
      }
    }
  }

  if (suggestionTypes.has("INCREASE_DOWN_PAYMENT") || failedRules.includes("MIN_DOWN_PAYMENT")) {
    const program = allPrograms.find(p => p.id === currentRequest.programId);
    if (program) {
      for (const c of generateDownPaymentIncreaseCandidates(input, program, currentRequest.months, currentRequest.downPaymentPercent, config)) {
        addIfUnique(c);
      }
    }
  }

  if (suggestionTypes.has("SWITCH_PROGRAM") || failedRules.includes("MIN_INCOME")) {
    for (const c of generateProgramSwitchCandidates(input, allPrograms, currentRequest.programId, currentRequest.months, currentRequest.downPaymentPercent, config)) {
      addIfUnique(c);
    }
  }

  if (config.enableBankSearch && (suggestionTypes.has("SWITCH_BANK") || failedRules.includes("BANK_POLICY"))) {
    for (const c of generateBankSwitchCandidates(input, allPrograms, currentRequest.bankId, currentRequest.months, currentRequest.downPaymentPercent, config)) {
      addIfUnique(c);
    }
  }

  if (suggestionTypes.has("SWITCH_CALCULATION_METHOD")) {
    const program = allPrograms.find(p => p.id === currentRequest.programId);
    if (program) {
      for (const c of generateMethodSwitchCandidates(input, program, currentRequest.months, currentRequest.downPaymentPercent, config)) {
        addIfUnique(c);
      }
    }
  }

  if (failedRules.includes("EMPLOYMENT")) {
    for (const c of generateEmploymentCompatibleCandidates(input, allPrograms, currentRequest.months, currentRequest.downPaymentPercent, config)) {
      addIfUnique(c);
    }
  }

  if (failedRules.includes("AGE")) {
    for (const c of generateAgeCompatibleCandidates(input, allPrograms, currentRequest.months, currentRequest.downPaymentPercent, config)) {
      addIfUnique(c);
    }
  }

  return candidates;
}
