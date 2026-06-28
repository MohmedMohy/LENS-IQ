export interface OptimizerConfig {
  maxOffers: number;
  maxDepth: number;
  maxCandidates: number;
  maxExecutionTimeMs: number;
  tenureStep: number;
  downPaymentStep: number;
  loanReductionStep: number;
  enableBankSearch: boolean;
  enableProgramSearch: boolean;
  enableNearMiss: boolean;
  dtiThreshold: number;
  dtiHardCeiling: number;
  nearMissDtiThreshold: number;
}

export const DEFAULT_OPTIMIZER_CONFIG: OptimizerConfig = {
  maxOffers: 10,
  maxDepth: 10,
  maxCandidates: 200,
  maxExecutionTimeMs: 5000,
  tenureStep: 12,
  downPaymentStep: 5,
  loanReductionStep: 20000,
  enableBankSearch: true,
  enableProgramSearch: true,
  enableNearMiss: true,
  dtiThreshold: 50,
  dtiHardCeiling: 60,
  nearMissDtiThreshold: 5,
};
