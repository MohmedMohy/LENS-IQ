import type { FastifyReply, FastifyError } from "fastify";
import { ZodError } from "zod";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: unknown;
}

export function sendSuccess<T>(reply: FastifyReply, data?: T, statusCode = 200) {
  return reply.status(statusCode).send(
    data !== undefined ? { success: true, data } : { success: true }
  );
}

export function sendError(
  reply: FastifyReply,
  message: string,
  statusCode = 400,
  errors?: unknown
) {
  return reply.status(statusCode).send({
    success: false,
    message,
    ...(errors ? { errors } : {}),
  });
}

type HandlerResult<T> = { data: T; statusCode?: number } | { error: string; statusCode?: number; errors?: unknown };

export function handleResult<T>(reply: FastifyReply, result: HandlerResult<T>) {
  if ("error" in result) {
    return sendError(reply, result.error, result.statusCode ?? 400, result.errors);
  }
  return sendSuccess(reply, result.data, result.statusCode ?? 200);
}

export function handleError(error: unknown, defaultMessage = "Internal server error", defaultStatus = 500) {
  if (error instanceof ZodError) {
    return { error: "Validation failed", statusCode: 400, errors: error.issues };
  }
  if (error instanceof Error) {
    const message = error.message || defaultMessage;
    const statusCode = "statusCode" in error ? (error as FastifyError).statusCode ?? defaultStatus : defaultStatus;
    return { error: message, statusCode };
  }
  return { error: defaultMessage, statusCode: defaultStatus };
}

export function createController<T>(
  fn: () => Promise<T>,
  errorMessage = "Operation failed"
): Promise<{ data: T } | { error: string; statusCode: number; errors?: unknown }> {
  return fn().then(
    (data) => ({ data }),
    (error) => handleError(error, errorMessage)
  );
}
