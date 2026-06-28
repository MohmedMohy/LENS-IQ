export type FinancingType = "conventional" | "islamic";
export type CalculationMethod = "reducing" | "flat" | "murabaha";
export type AllowedConditions = "new" | "used" | "both";
export type CustomerType = "salary_transfer" | "employee" | "self_employed";

export interface Program {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  customer_types: CustomerType[];
  priority: number;
  required_documents: string[];
  default_risk_rules: Record<string, unknown> | null;

  financing_type: FinancingType;
  calculation_method: CalculationMethod;
  min_salary: number;
  max_customer_age: number;
  salary_transfer_required: boolean;
  max_car_age: number;
  allowed_conditions: AllowedConditions;
  max_vehicle_price: number | null;
  interest_rate: number;
  profit_rate: number | null;
  min_months: number;
  max_months: number;
  min_down_payment_percent: number;
  max_down_payment_percent: number;
  max_finance_amount: number | null;
  admin_fees_percent: number;
  active: boolean;

  banks?: ProgramBank[];
}

export interface ProgramBank {
  program_id: number;
  bank_id: number;
  interest_rate: number;
  profit_rate: number | null;
  min_months: number;
  max_months: number;
  min_down_payment_percent: number;
  max_down_payment_percent: number;
  max_finance_amount: number | null;
  admin_fees_percent: number;
  max_car_age: number;
  max_vehicle_price: number | null;
  active: boolean;
  bank_name?: string;
}

export type CreateProgramPayload = Omit<Program, "id" | "banks"> & {
  bank_ids?: number[];
};
export type UpdateProgramPayload = Partial<CreateProgramPayload>;
