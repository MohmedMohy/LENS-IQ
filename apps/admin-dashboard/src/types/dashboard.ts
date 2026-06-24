import type { Role } from "./auth";

export type TeamMember = {
    id: number;
    manager_id: number | null;
    name: string;
    email: string;
    role: Role;
    active: boolean;
    created_at: string;
    manager_name?: string | null;
};

export type RecentEvaluation = {
    created_at: string;
    application_id: number;
    user_name: string | null;
};

export type DashboardStats = {
    applications: {
        total: number;
        approved: number;
        rejected: number;
        pending: number;
        cancelled: number;
    };
    customers: number;
    vehicles: number;
    evaluations: number;
    recentEvaluations: RecentEvaluation[];
    team: TeamMember[];
    tenant: {
        name: string;
        email: string;
        max_users: number;
    };
    role: Role;
};
