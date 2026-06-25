// src/lib/schemas.ts

import { z } from "zod";

// ── Banks ─────────────────────────────────────────────────────────────────────

export const bankSchema = z.object({
    name: z.string().min(1, "Bank name is required"),

    code: z.string().min(1, "Bank code is required"),

    logo_url: z
        .string()
        .url("Must be a valid URL")
        .or(z.literal(""))
        .optional(),

    active: z.boolean(),
});

export type BankFormValues = z.infer<typeof bankSchema>;

// ── Programs ──────────────────────────────────────────────────────────────────

export const programSchema = z.object({
    name: z.string().min(1, "Program name is required"),

    bank_id: z.number()
        .int()
        .positive("Select a bank"),

    financing_type: z.enum(["conventional", "islamic"]).default("conventional"),

    calculation_method: z.enum(["reducing", "flat", "murabaha"]).default("reducing"),

    min_salary: z.number()
        .nonnegative("Must be ≥ 0"),

    max_customer_age: z.number()
        .int()
        .positive("Must be > 0"),

    max_car_age: z.number()
        .int()
        .nonnegative()
        .default(0),

    salary_transfer_required: z.boolean().default(false),

    allowed_conditions: z.enum(["new", "used", "both"]).default("both"),

    interest_rate: z.number()
        .min(0)
        .max(100, "Must be between 0 and 100"),

    profit_rate: z.number()
        .min(0)
        .max(100)
        .optional()
        .nullable(),

    min_months: z.number().int().positive().default(12),

    max_months: z.number()
        .int()
        .positive("Must be > 0"),

    min_down_payment_percent: z.number()
        .min(0)
        .max(100, "Must be 0–100"),

    max_down_payment_percent: z.number()
        .min(0)
        .max(100)
        .default(100),

    max_vehicle_price: z.number().positive().optional().nullable(),

    max_finance_amount: z.number().positive().optional().nullable(),

    admin_fees_percent: z.number()
        .min(0)
        .max(100)
        .default(0),

    active: z.boolean(),
});

export type ProgramFormValues = z.infer<typeof programSchema>;

// ── Rules ─────────────────────────────────────────────────────────────────────

export const ruleSchema = z.object({
    program_id: z.number()
        .int()
        .positive("Select a program"),

    field: z.enum(["age", "salary", "price"]),

    operator: z.enum(["<", ">", "<=", ">=", "=", "!="]),

    value: z.number(),

    action: z.enum(["REJECT", "REQUIRED", "WARN"]),
});

export type RuleFormValues = z.infer<typeof ruleSchema>;