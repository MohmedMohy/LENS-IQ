export interface BankRow {
  id: number;
  tenant_id: number;
  name: string;
  code: string;
  logo_url: string | null;
  active: boolean;
}

export interface ProgramRow {
  id: number;
  tenant_id: number;
  name: string;
  code: string | null;
  description: string | null;
  customer_types: string[];
  priority: number;
  required_documents: any;
  default_risk_rules: any;
  financing_type: string;
  calculation_method: string;
  min_salary: number;
  max_customer_age: number;
  salary_transfer_required: boolean;
  max_car_age: number;
  allowed_conditions: string;
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
}

export interface ProgramBankRow {
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
}

export interface CustomerRow {
  id: number;
  tenant_id: number;
  name: string;
  national_id: string;
  phone: string;
  birth_date: string | null;
  salary: number;
  job_type: string;
  current_liabilities: number;
  additional_income: number;
  employer_name: string | null;
  employment_tenure_months: number | null;
  insurance_number: string | null;
  club_membership: string | null;
  marital_status: string | null;
  owns_property: boolean;
  owns_car: boolean;
  salary_transfer: boolean;
  tax_card: string | null;
  commercial_registry: string | null;
}

export interface ApplicationRow {
  id: number;
  tenant_id: number;
  customer_id: number;
  vehicle_id: number;
  requested_down_payment: number;
  requested_months: number;
  payment_method: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RuleRow {
  id: number;
  tenant_id: number;
  program_id: number;
  scope: string;
  field: string;
  operator: string;
  value: string;
  action: string;
  priority: number;
}
