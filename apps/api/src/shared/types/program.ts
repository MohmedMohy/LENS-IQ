export type FinancingType =
  | "conventional"
  | "islamic";

export type CalculationMethod =
  | "flat"
  | "reducing"
  | "murabaha";

export type AllowedConditions =
  | "new"
  | "used"
  | "both";

export interface Program {
  id: number;

  tenantId: number;

  bankId: number;

  name: string;

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

  maxFinanceAmount: number | null;

  adminFeesPercent: number;

  salaryTransferRequired: boolean;

  active: boolean;
}