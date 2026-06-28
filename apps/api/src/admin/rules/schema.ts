import { z } from "zod";

export const createRuleSchema = z.object({
    program_id: z.number().int().positive(),
    scope: z.enum(["PROGRAM", "BANK"]).default("PROGRAM"),
    field: z.enum([
        "salary", "age", "car_age", "price",
        "job_type", "owns_property", "salary_transfer", "down_payment",
        "customer_type", "employment_type", "business_age",
    ]),
    operator: z.enum(["<", ">", "<=", ">=", "=", "!="]),
    value: z.string().min(1),
    action: z.enum(["REJECT", "REQUIRED", "WARN"]),
    priority: z.number().int().min(0).default(0),
});

export const updateRuleSchema = createRuleSchema.partial();

export type CreateRuleDTO = z.infer<typeof createRuleSchema>;
export type UpdateRuleDTO = z.infer<typeof updateRuleSchema>;
