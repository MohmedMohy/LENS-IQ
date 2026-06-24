import { z } from "zod";

export const createUserSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(["MANAGER", "SALES_AGENT"]),
    manager_id: z.number().int().positive().optional().nullable(),
});

export const updateUserSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    email: z.string().email("Invalid email").optional(),
    password: z.string().min(8, "Password must be at least 8 characters").optional(),
    role: z.enum(["MANAGER", "SALES_AGENT"]).optional(),
    active: z.boolean().optional(),
    manager_id: z.number().int().positive().optional().nullable(),
});

export const updateTeamMemberSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    email: z.string().email("Invalid email").optional(),
    password: z.string().min(8, "Password must be at least 8 characters").optional(),
    active: z.boolean().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>;
