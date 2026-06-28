export type RuleField =
  | "age" | "salary" | "price"
  | "car_age" | "job_type"
  | "owns_property" | "salary_transfer" | "down_payment"
  | "customer_type" | "employment_type" | "business_age";

export type RuleOperator = "<" | ">" | "<=" | ">=" | "=" | "!=";

export type RuleAction = "REJECT" | "REQUIRED" | "WARN";

export interface Rule {
  id: number;
  program_id: number;
  scope: "PROGRAM" | "BANK";
  field: RuleField;
  operator: RuleOperator;
  value: string;
  action: RuleAction;
  priority: number;
}
