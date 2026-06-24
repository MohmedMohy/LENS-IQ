import { create } from "zustand";
import type { Tenant } from "@/types/auth";

type AuthState = {
    tenant: Tenant | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    setSession: (tenant: Tenant, token?: string) => void;
    logout: () => void;
    setLoading: (loading: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
    tenant: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,

    setSession: (tenant, token) => {
        set({ tenant, token: token ?? null, isAuthenticated: true, isLoading: false });
    },

    logout: () => {
        set({ tenant: null, token: null, isAuthenticated: false, isLoading: false });
    },

    setLoading: (loading) => {
        set({ isLoading: loading });
    },
}));
