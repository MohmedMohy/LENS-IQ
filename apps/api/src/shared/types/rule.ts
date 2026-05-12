export type RuleField =
  | "salary"
  | "age"
  | "car_age"
  | "price"
  | "job_type"
  | "owns_property"
  | "salary_transfer"
  | "down_payment";

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