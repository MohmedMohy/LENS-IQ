// src/admin/banks/banks.schema.ts

import { z } from "zod";

export const createBankSchema = z.object({
    name: z.string().min(1, "name is required"),
    code: z.string().min(1, "code is required"),
    logo_url: z.preprocess(
        (v) => (v === "" ? undefined : v),
        z.string().url("Invalid URL").optional()
    ),
    active: z.boolean().optional().default(true),
});

export const updateBankSchema = createBankSchema.partial();

export type CreateBankDTO = z.infer<typeof createBankSchema>;
export type UpdateBankDTO = z.infer<typeof updateBankSchema>;