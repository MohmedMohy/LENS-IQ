export type Role = "ADMIN" | "MANAGER" | "SALES_AGENT";

export type Tenant = {
    id: number;
    name: string;
    email: string;
    role: Role;
    max_users?: number;
    user_count?: number;
};

export type LoginPayload = {
    email: string;
    password: string;
};

export type LoginResponse = {
    accessToken: string;
    tenant: Tenant;
};

export type MeResponse = {
    id: number;
    name: string;
    email: string;
    role: Role;
    max_users?: number;
    user_count?: number;
};
