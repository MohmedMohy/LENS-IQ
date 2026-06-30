export { ScoringEngine, DEFAULT_SCORING_PROFILE, DEFAULT_AFFORDABILITY_PROFILE } from "./ScoringEngine.js";
export type { ScoringProfile, ScoringResult, ScoringInput } from "./types.js";

export { calculateDTI, MAX_DTI_STANDARD, MAX_DTI_GOVERNMENT, ELIGIBILITY_CEILING } from "./dti.js";
export { analyze } from "./scoring.js";
