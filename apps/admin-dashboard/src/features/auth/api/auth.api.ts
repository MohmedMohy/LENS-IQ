import { apiClient } from "../../../api/client";
import type { LoginResponse } from "@/types/auth"; //  استخدم الـ type الموجود

export type LoginPayload = {
    email: string;
    password: string;
};

export type { LoginResponse }; //  re-export عشان أي حاجة بتستخدمه من هنا تفضل شغالة

export const authApi = {
    login: async (payload: LoginPayload): Promise<LoginResponse> => {
        const response = await apiClient.post("/auth/login", payload);
        return response.data;
    },
};