import { create } from "zustand";
import type { Tenant } from "@/types/auth"; // استورد الـ Tenant type عشان نستخدمه في الـ state

type AuthState = {
    accessToken: string | null;
    tenant: Tenant | null; //  object مش string

    setSession: (token: string, tenant: Tenant) => void; //  بنحتاج الـ tenant عشان نخزّنه في الـ state
    logout: () => void;
};

//  helper — بنقرأ الـ tenant من localStorage ونحوّله من JSON
function getTenantFromStorage(): Tenant | null {
    try {
        const raw = localStorage.getItem("tenant");
        return raw ? (JSON.parse(raw) as Tenant) : null;
    } catch {
        return null;
    }
}

export const useAuthStore = create<AuthState>((set) => ({
    accessToken: localStorage.getItem("access_token"),
    tenant: getTenantFromStorage(), //  parse بدل raw string

    setSession: (token, tenant) => {
        localStorage.setItem("access_token", token);
        localStorage.setItem("tenant", JSON.stringify(tenant)); // stringify عشان نخزّنه صح

        set({ accessToken: token, tenant });
    },

    logout: () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("tenant");

        set({ accessToken: null, tenant: null });
    },
}));

export const getAccessToken = (): string | null =>
    localStorage.getItem("access_token");