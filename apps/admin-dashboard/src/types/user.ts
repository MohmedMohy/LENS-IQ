import type { Role } from "./auth";

export type User = {
    id: number;
    tenant_id: number;
    manager_id: number | null;
    name: string;
    email: string;
    role: Role;
    active: boolean;
    created_at: string;
    manager_name?: string | null;
};

export type CreateUserPayload = {
    name: string;
    email: string;
    password: string;
    role: "MANAGER" | "SALES_AGENT";
    manager_id?: number | null;
};

export type UpdateUserPayload = Partial<CreateUserPayload> & { active?: boolean };
