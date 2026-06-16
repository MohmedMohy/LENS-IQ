export type Tenant = {
    id: number;
    name: string;
    email: string;
    api_key?: string;
};

export type LoginPayload = {
    email: string;
    password: string;
};

export type LoginResponse = {
    token: string;
    tenant: Tenant;
};
