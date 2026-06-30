export type FinancingType = "conventional" | "islamic";
export type CalculationMethod = "flat" | "reducing" | "murabaha";
export type AllowedConditions = "new" | "used" | "both";
export type CustomerType = "salary_transfer" | "employee" | "self_employed";

export interface Program {
  id: number;
  tenantId: number;
  name: string;
  code: string | null;
  description: string | null;
  customerTypes: CustomerType[];
  requiredDocuments: string[];
  defaultRiskRules: Record<string, unknown> | null;

  financingType: FinancingType;
  calculationMethod: CalculationMethod;

  minSalary: number;
  maxCustomerAge: number;
  maxCarAge: number;
  allowedConditions: AllowedConditions;
  maxVehiclePrice: number | null;

  interestRate: number;
  profitRate: number | null;

  maxMonths: number;
  minMonths: number;
  minDownPaymentPercent: number;
  maxDownPaymentPercent: number;
  maxFinanceAmount: number | null;
  adminFeesPercent: number;
  maxLtvPercent?: number;

  salaryTransferRequired: boolean;
  active: boolean;

  banks?: ProgramBank[];
}

export interface ProgramBank {
  programId: number;
  bankId: number;
  interestRate: number;
  profitRate: number | null;
  minMonths: number;
  maxMonths: number;
  minDownPaymentPercent: number;
  maxDownPaymentPercent: number;
  maxFinanceAmount: number | null;
  adminFeesPercent: number;
  maxCarAge: number;
  maxVehiclePrice: number | null;
  maxLtvPercent?: number;
  active: boolean;
  bankName?: string;
}
