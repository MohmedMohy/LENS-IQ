// src/lib/api-error.ts

export class ApiError extends Error {
    readonly status: number;

    constructor(status: number, message: string) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }

    get isUnauthorized() { return this.status === 401; }
    get isForbidden() { return this.status === 403; }
    get isNotFound() { return this.status === 404; }
    get isServer() { return this.status >= 500; }
    get isNetwork() { return this.status === 0; }
}

/** Type guard — use this in catch blocks */
export function isApiError(err: unknown): err is ApiError {
    return err instanceof ApiError;
}