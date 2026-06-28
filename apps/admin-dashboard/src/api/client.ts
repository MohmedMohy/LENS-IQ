import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from "axios";

import { ENV } from "@/config/env";
import { useAuthStore } from "@/store/auth.store";
import { ApiError } from "@/lib/api-error";
import type { Tenant } from "@/types/auth";

export const apiClient = axios.create({
    baseURL: `${ENV.API_URL}`,
    timeout: 15000,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
});

let isRefreshing = false;
let pendingQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (reason: unknown) => void;
}> = [];

function processQueue(error: unknown) {
    pendingQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else {
            resolve(undefined);
        }
    });
    pendingQueue = [];
}

apiClient.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        const body = response.data;
        if (body && typeof body === "object" && body.success === true && "data" in body) {
            response.data = body.data;
        }
        return response;
    },
    async (error: AxiosError<{ message?: string; error?: string }>) => {
        const status = error.response?.status ?? 0;
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
        const isLoginRequest = originalRequest?.url?.includes("/auth/login") ?? false;
        const isRefreshRequest = originalRequest?.url?.includes("/auth/refresh") ?? false;

        const isTimeout = error.code === "ECONNABORTED" || status === 0 && error.message?.includes("timeout");
        const message =
            error.response?.data?.message ??
            error.response?.data?.error ??
            (isTimeout
                ? "Request timed out — the evaluation is taking longer than expected. Please try again."
                : status === 0
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

        if (status === 401 && !isLoginRequest && !isRefreshRequest && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    pendingQueue.push({ resolve, reject });
                }).then(() => {
                    return apiClient(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshRes = await apiClient.post("/auth/refresh");
                const data = refreshRes.data as { accessToken?: string; tenant?: Record<string, unknown> };
                if (data?.accessToken && data?.tenant) {
                    useAuthStore.getState().setSession(data.tenant as unknown as Tenant, data.accessToken);
                }
                processQueue(null);
                return apiClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError);
                useAuthStore.getState().logout();
                return Promise.reject(new ApiError(401, "Session expired. Please sign in again."));
            } finally {
                isRefreshing = false;
            }
        }

        if (status === 401 && !isLoginRequest) {
            useAuthStore.getState().logout();
        }

        return Promise.reject(new ApiError(status, message));
    }
);
