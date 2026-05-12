// src/api/client.ts

import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";

import { ENV } from "@/config/env";
import { useAuthStore } from "@/store/auth.store";
import { ApiError } from "@/lib/api-error";

export const apiClient = axios.create({
    baseURL: ENV.API_URL,
    timeout: 15000,
    headers: {
        "Content-Type": "application/json",
    },
});

// ======================
// Request Interceptor
// ======================
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = useAuthStore.getState().accessToken;

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error: AxiosError) => {
        console.error("Request Error:", error);
        return Promise.reject(error);
    }
);

// ======================
// Response Interceptor
// ======================
apiClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError<{ message?: string; error?: string }>) => {
        const status = error.response?.status ?? 0;
        const isLoginRequest = error.config?.url?.includes("/auth/login");

        const message =
            error.response?.data?.message ??
            error.response?.data?.error ??
            (status === 0
                ? "Network error — check your connection."
                : status === 401
                    ? "Session expired. Please sign in again."
                    : status === 403
                        ? "You don't have permission to do this."
                        : status === 404
                            ? "Resource not found."
                            : status >= 500
                                ? "Server error. Try again later."
                                : error.message ?? "Something went wrong.");

        if (status === 401 && !isLoginRequest) {
            console.warn("Unauthorized → logout");
            useAuthStore.getState().logout();
        }

        return Promise.reject(new ApiError(status, message));
    }
);