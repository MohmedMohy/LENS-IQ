export type RuleField =
  | "age" | "salary" | "price"
  | "car_age" | "job_type"
  | "owns_property" | "salary_transfer" | "down_payment";

export type RuleOperator = "<" | ">" | "<=" | ">=" | "=" | "!=";

export type RuleAction = "REJECT" | "REQUIRED" | "WARN";

export interface Rule {
  id: number;
  program_id: number;
  field: RuleField;
  operator: RuleOperator;
  value: string;
  action: RuleAction;
}

export type CreateRulePayload = Omit<Rule, "id">;
export type UpdateRulePayload = Partial<CreateRulePayload>;
