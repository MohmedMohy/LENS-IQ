// customers.schema.ts

import { z } from "zod";

export const createCustomerSchema = z.object({
    name: z.string().min(1),

    national_id: z.string().length(14),

    phone: z
        .string()
        .min(11)
        .regex(/^01[0-2,5]{1}[0-9]{8}$/), // Egypt format validation

    birth_date: z.string().datetime().optional().or(z.string()),

    salary: z.number().positive(),

    job_type: z.enum([
        "private",
        "government",
        "corporate",
        "freelancer",
        "retired",
    ]),

    current_liabilities: z.number().min(0).default(0),

    additional_income: z.number().min(0).default(0),

    employer_name: z.string().optional(),

    employment_tenure_months: z.number().int().nonnegative().optional(),

    insurance_number: z.string().optional(),

    club_membership: z.string().optional(),

    marital_status: z
        .enum(["single", "married", "divorced", "widowed"])
        .optional(),

    owns_property: z.boolean().default(false),

    owns_car: z.boolean().default(false),

    salary_transfer: z.boolean().default(false),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export type CreateCustomerDTO = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerDTO = z.infer<typeof updateCustomerSchema>;