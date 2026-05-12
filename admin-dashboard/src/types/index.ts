// ─────────────────────────────────────────────
// BANK
// ─────────────────────────────────────────────

export type Bank = {
    id: number;
    name: string;
    code: string;
    logo_url: string | null;
    active: boolean;
};

export type CreateBankPayload = {
    name: string;
    code: string;
    logo_url?: string;
    active?: boolean;
};

export type UpdateBankPayload = Partial<CreateBankPayload>;

// ─────────────────────────────────────────────
// PROGRAM
// ─────────────────────────────────────────────

export type FinancingType = "conventional" | "islamic";
export type CalculationMethod = "reducing" | "flat" | "murabaha";
export type AllowedConditions = "new" | "used" | "both";

export type Program = {
    id: number;
    bank_id: number;
    name: string;

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
    max_finance_amount: number | null;
    admin_fees_percent: number;

    active: boolean;
};

export type CreateProgramPayload = Omit<Program, "id">;
export type UpdateProgramPayload = Partial<CreateProgramPayload>;

// ─────────────────────────────────────────────
// RULE
// ─────────────────────────────────────────────

export type RuleField =
    | "age" | "salary" | "price"
    | "car_age" | "job_type"
    | "owns_property" | "salary_transfer" | "down_payment";

export type RuleOperator = "<" | ">" | "<=" | ">=" | "=" | "!=";
export type RuleAction = "REJECT" | "REQUIRED" | "WARN";

export type Rule = {
    id: number;
    program_id: number;
    field: RuleField;
    operator: RuleOperator;
    value: number;
    action: RuleAction;
};

export type CreateRulePayload = Omit<Rule, "id">;
export type UpdateRulePayload = Partial<CreateRulePayload>;