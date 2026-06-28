import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { authMiddleware } from "../auth/auth.middleware.js";
import { sendSuccess, sendError } from "../shared/response.js";
import { createSubmission, getSubmission, updateDecision } from "./service.js";

const submitSchema = z.object({
    application_id: z.number().int().positive(),
    bankName: z.string().min(1),
    programName: z.string().min(1),
    installment: z.number().positive(),
    downPayment: z.number().min(0),
    financeAmount: z.number().positive(),
    months: z.number().int().positive(),
    interestRate: z.number().min(0),
});

const decisionSchema = z.object({
    status: z.enum(["APPROVED", "REJECTED"]),
    financierNotes: z.string().optional(),
});

export async function financierRoutes(fastify: FastifyInstance) {
    fastify.post(
        "/financier/submit",
        { preHandler: authMiddleware },
        async (req, reply) => {
            try {
                const tenantId = req.tenantId;
                const body = submitSchema.parse(req.body);
                const result = await createSubmission(tenantId, body.application_id, body);
                return sendSuccess(reply, result);
            } catch (err) {
                if (err instanceof z.ZodError) {
                    return sendError(reply, "Validation failed", 400, err.issues);
                }
                fastify.log.error(err);
                return sendError(reply, (err as Error)?.message ?? "Internal Server Error", 500);
            }
        }
    );

    fastify.get(
        "/financier/submission/:applicationId",
        { preHandler: authMiddleware },
        async (req, reply) => {
            try {
                const tenantId = req.tenantId;
                const { applicationId } = req.params as { applicationId: string };
                const result = await getSubmission(tenantId, Number(applicationId));
                if (!result) {
                    return sendError(reply, "Submission not found", 404);
                }
                return sendSuccess(reply, result);
            } catch (err) {
                fastify.log.error(err);
                return sendError(reply, (err as Error)?.message ?? "Internal Server Error", 500);
            }
        }
    );

    fastify.patch(
        "/financier/decision/:applicationId",
        { preHandler: authMiddleware },
        async (req, reply) => {
            try {
                const tenantId = req.tenantId;
                const { applicationId } = req.params as { applicationId: string };
                const body = decisionSchema.parse(req.body);
                await updateDecision(tenantId, Number(applicationId), body.status, body.financierNotes);
                return sendSuccess(reply, { success: true });
            } catch (err) {
                if (err instanceof z.ZodError) {
                    return sendError(reply, "Validation failed", 400, err.issues);
                }
                fastify.log.error(err);
                return sendError(reply, (err as Error)?.message ?? "Internal Server Error", 500);
            }
        }
    );
}
