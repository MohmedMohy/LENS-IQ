export type RuleField =
  | "age" | "salary" | "price"
  | "car_age" | "job_type"
  | "owns_property" | "salary_transfer" | "down_payment"
  | "customer_type" | "employment_type" | "business_age";

export type RuleOperator = "<" | ">" | "<=" | ">=" | "=" | "!=";

export type RuleAction = "REJECT" | "REQUIRED" | "WARN";

export type RuleScope = "PROGRAM" | "BANK";

export interface Rule {
  id: number;
  program_id: number;
  scope: RuleScope;
  field: RuleField;
  operator: RuleOperator;
  value: string;
  action: RuleAction;
  priority: number;
}

export type CreateRulePayload = Omit<Rule, "id">;
export type UpdateRulePayload = Partial<CreateRulePayload>;
