import { z } from "zod";

export const createRuleSchema = z.object({
    program_id: z.number().int().positive(),
    field: z.enum([
        "salary", "age", "car_age", "price",
        "job_type", "owns_property", "salary_transfer", "down_payment"
    ]),
    operator: z.enum(["<", ">", "<=", ">=", "=", "!="]),
    value: z.string().min(1),   // ← string مش number
    action: z.enum(["REJECT", "REQUIRED", "WARN"]),
});

export const updateRuleSchema = createRuleSchema.partial();

export type CreateRuleDTO = z.infer<typeof createRuleSchema>;
export type UpdateRuleDTO =
    z.infer<typeof updateRuleSchema>;