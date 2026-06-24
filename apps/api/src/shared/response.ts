import type { FastifyReply } from "fastify";

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
