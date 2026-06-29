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
export type CustomerType = "salary_transfer" | "employee" | "self_employed";

export type Program = {
    id: number;
    name: string;
    code: string | null;
    description: string | null;
    customer_types: CustomerType[];
    required_documents: string[];

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
    bank_ids?: number[];
};

export type CreateProgramPayload = {
    name: string;
    code?: string;
    description?: string;
    customer_types: CustomerType[];
    required_documents?: string[];
    bank_ids: number[];

    financing_type: FinancingType;
    calculation_method: CalculationMethod;

    min_salary: number;
    max_customer_age: number;
    salary_transfer_required?: boolean;

    max_car_age?: number;
    allowed_conditions?: AllowedConditions;
    max_vehicle_price?: number | null;

    interest_rate: number;
    profit_rate?: number | null;
    min_months?: number;
    max_months: number;
    min_down_payment_percent: number;
    max_down_payment_percent?: number;
    max_finance_amount?: number | null;
    admin_fees_percent?: number;

    active?: boolean;
};

export type UpdateProgramPayload = Partial<CreateProgramPayload>;

// ─────────────────────────────────────────────
// RULE
// ─────────────────────────────────────────────

export type RuleField =
    | "age" | "salary" | "price"
    | "car_age" | "job_type"
    | "owns_property" | "salary_transfer" | "down_payment"
    | "customer_type" | "employment_type" | "business_age";

export type RuleOperator = "<" | ">" | "<=" | ">=" | "=" | "!=";
export type RuleAction = "REJECT" | "REQUIRED" | "WARN";
export type RuleScope = "PROGRAM" | "BANK";

export type Rule = {
    id: number;
    program_id: number;
    scope: RuleScope;
    field: RuleField;
    operator: RuleOperator;
    value: string;
    action: RuleAction;
    priority: number;
};

export type CreateRulePayload = Omit<Rule, "id">;
export type UpdateRulePayload = Partial<CreateRulePayload>;

// ─────────────────────────────────────────────
// CUSTOMER
// ─────────────────────────────────────────────

export type JobType = "private" | "government" | "corporate" | "freelancer" | "retired";
export type MaritalStatus = "single" | "married" | "divorced" | "widowed";

export type Customer = {
    id: number;
    name: string;
    national_id: string;
    phone: string;
    birth_date: string;
    salary: number;
    job_type: JobType;
    current_liabilities: number;
    additional_income: number;
    employer_name: string | null;
    employment_tenure_months: number | null;
    insurance_number: string | null;
    club_membership: string | null;
    marital_status: MaritalStatus | null;
    owns_property: boolean;
    owns_car: boolean;
    salary_transfer: boolean;
    tax_card: string | null;
    commercial_registry: string | null;
};

export type CreateCustomerPayload = Omit<Customer, "id">;
export type UpdateCustomerPayload = Partial<CreateCustomerPayload>;

// ─────────────────────────────────────────────
// VEHICLE
// ─────────────────────────────────────────────

export type VehicleCondition = "new" | "used";
export type VehicleCategory = "sedan" | "suv" | "truck" | "van" | "microbus";

export type Vehicle = {
    id: number;
    brand: string;
    model: string;
    manufacturing_year: number;
    condition: VehicleCondition;
    price: number;
    category: VehicleCategory | null;
};

export type CreateVehiclePayload = Omit<Vehicle, "id">;
export type UpdateVehiclePayload = Partial<CreateVehiclePayload>;

// ─────────────────────────────────────────────
// APPLICATION
// ─────────────────────────────────────────────

export type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
export type PaymentMethod = "salary_transfer" | "bank_account" | "cash_proof";

export type Application = {
    id: number;
    customer_id: number;
    vehicle_id: number;
    requested_down_payment: number;
    requested_months: number;
    payment_method: PaymentMethod;
    status: ApplicationStatus;
    notes: string | null;
    created_at: string;
    updated_at: string;
    // Joined fields from DB query
    customer_name: string;
    salary: number;
    job_type: JobType;
    phone: string;
    current_liabilities?: number;
    brand: string;
    model: string;
    price: number;
    manufacturing_year: number;
    condition: VehicleCondition;
};

export type CreateApplicationPayload = {
    customer_id: number;
    vehicle_id: number;
    requested_down_payment: number;
    requested_months: number;
    payment_method?: PaymentMethod;
    notes?: string;
};

export type UpdateApplicationStatusPayload = {
    status: ApplicationStatus;
};

// ─────────────────────────────────────────────
// EVALUATE
// ─────────────────────────────────────────────

export type EvaluateRequest = {
    application_id: number;
};

export type ImpactLevel = "LOW" | "MEDIUM" | "HIGH";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type OfferStatus = "APPROVED" | "CONDITIONAL" | "REJECTED";

export type Reason = {
    type: "RULE" | "RISK" | "SYSTEM";
    message: string;
    impact: ImpactLevel;
};

export type Offer = {
    programId: number;
    bankId: number;
    programName?: string;
    bankName?: string;
    status: OfferStatus;
    installment: number;
    totalPayment: number;
    financeAmount: number;
    downPayment: number;
    interestRate: number;
    months: number;
    dti: number;
    riskScore: number;
    riskLevel: RiskLevel;
    affordabilityScore: number;
    approvalProbability?: number;
    reasons: Reason[];
};

export type RankedOffer = Offer & {
  programScore: number;
  rank: number;
};

export type EvaluateResponse = {
    bestOffer: Offer | null;
    offers: Offer[];
    error?: string;
};

// ─────────────────────────────────────────────
// USER
// ─────────────────────────────────────────────

export type { User, CreateUserPayload, UpdateUserPayload } from "./user";

// ─────────────────────────────────────────────
// AUDIT LOG
// ─────────────────────────────────────────────

export type AuditLog = {
    id: number;
    tenant_id: number;
    user_id: number | null;
    user_type: string;
    action: string;
    entity: string;
    entity_id: number | null;
    details: Record<string, unknown> | null;
    ip_address: string | null;
    created_at: string;
    user_name: string | null;
    user_email: string | null;
};
