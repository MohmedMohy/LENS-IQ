// utils/validate.ts
import type { FastifyReply, FastifyRequest } from "fastify";
import type { ZodSchema } from "zod";

export const validate =
    (schema: ZodSchema) =>
        async (request: FastifyRequest, reply: FastifyReply) => {
            try {
                const parsed = schema.parse(request.body);
                request.body = parsed;
            } catch (err: any) {
                return reply.code(400).send({
                    success: false,
                    message: "Validation error",
                    errors: err.errors,
                });
            }
        };