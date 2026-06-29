import { describe, it } from "node:test";
import assert from "node:assert";

import { analyzeConstraints } from "../ConstraintAnalyzer.js";
import { generateCandidates } from "../CandidateGenerator.js";
import { rankOffersSmart, computeCustomerPreferenceScore, computeDeviationScore } from "../RankingEngine.js";
import { DEFAULT_OPTIMIZER_CONFIG } from "../config.js";
import { createCandidateKey } from "../types.js";
import type { Offer } from "../../../shared/types/offer.js";
import type { ApplicationInput } from "../../../shared/types/applicationInput.js";
import type { Program } from "../../../shared/types/program.js";
import type { CandidateRequest } from "../types.js";

const mockInput: ApplicationInput = {
  id: 0,
  age: 30,
  salary: 15000,
  price: 500000,
  current_liabilities: 2000,
  owns_property: false,
  owns_car: false,
  club_membership: null,
  insurance_number: null,
  requestedDownPayment: 100000,
  requestedMonths: 48,
  job_type: "government",
  car_age: 3,
  salary_transfer: true,
};

const mockProgram: Program = {
  id: 1,
  tenantId: 1,
  name: "Test Program",
  code: null,
  description: null,
  customerTypes: ["salary_transfer"],
  requiredDocuments: [],
  defaultRiskRules: null,
  financingType: "conventional",
  calculationMethod: "reducing",
  minSalary: 5000,
  maxCustomerAge: 65,
  maxCarAge: 10,
  allowedConditions: "both",
  maxVehiclePrice: 2000000,
  interestRate: 14,
  profitRate: null,
  maxMonths: 96,
  minMonths: 12,
  minDownPaymentPercent: 20,
  maxDownPaymentPercent: 50,
  maxFinanceAmount: 1000000,
  adminFeesPercent: 1,
  salaryTransferRequired: false,
  active: true,
};
