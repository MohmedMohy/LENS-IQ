import { z } from "zod";

const customerTypeSchema = z.enum(["salary_transfer", "employee", "self_employed"]);

export const createProgramSchema = z.object({
    name: z.string().min(1),
    code: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    customer_types: z.array(customerTypeSchema).min(1, "Select at least one customer type"),
    required_documents: z.array(z.string()).default([]),

    bank_ids: z.array(z.number().int().positive()).optional().default([]),

    financing_type: z.enum(["conventional", "islamic"]).default("conventional"),
    calculation_method: z.enum(["reducing", "flat", "murabaha"]).default("reducing"),

    min_salary: z.number().nonnegative(),
    max_customer_age: z.number().int().positive(),
    salary_transfer_required: z.boolean().default(false),

    max_car_age: z.number().int().nonnegative().default(0),
    allowed_conditions: z.enum(["new", "used", "both"]).default("both"),
    max_vehicle_price: z.number().positive().optional().nullable(),

    interest_rate: z.number().min(0).max(100).default(0),
    profit_rate: z.number().min(0).max(100).optional().nullable(),

    min_months: z.number().int().positive().default(12),
    max_months: z.number().int().positive(),
    min_down_payment_percent: z.number().min(0).max(100),
    max_down_payment_percent: z.number().min(0).max(100).default(100),
    max_finance_amount: z.number().positive().optional().nullable(),
    admin_fees_percent: z.number().min(0).max(100).default(0),

    active: z.boolean().default(true),
});

export const updateProgramSchema = createProgramSchema.partial();

export type CreateProgramDTO = z.infer<typeof createProgramSchema>;
export type UpdateProgramDTO = z.infer<typeof updateProgramSchema>;
