import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../../db/db.js";
import { authMiddleware } from "../../auth/auth.middleware.js";
import { sendSuccess, sendError } from "../../shared/response.js";

const bankDecisionSchema = z.object({
    applicationId: z.number().int().positive(),
    bankId: z.number().int().positive(),
    decision: z.enum(["approved", "rejected", "conditional"]),
    notes: z.string().max(2000).optional(),
    conditions: z.array(z.string()).optional(),
    approvedAmount: z.number().positive().optional(),
    approvedTenor: z.number().int().positive().optional(),
    approvedRate: z.number().min(0).max(100).optional(),
});

export async function bankDecisionRoutes(fastify: FastifyInstance) {
    fastify.post(
        "/applications/bank-decision",
        { preHandler: authMiddleware },
        async (req, reply) => {
            try {
                const tenantId = req.tenantId;
                const body = bankDecisionSchema.parse(req.body);

                const appResult = await db.query(
                    `SELECT id, status FROM applications WHERE id = $1 AND tenant_id = $2`,
                    [body.applicationId, tenantId]
                );
                if (appResult.rows.length === 0) {
                    return sendError(reply, "Application not found", 404);
                }

                const bankResult = await db.query(
                    `SELECT id FROM banks WHERE id = $1`,
                    [body.bankId]
                );
                if (bankResult.rows.length === 0) {
                    return sendError(reply, "Bank not found", 404);
                }

                await db.query(
                    `INSERT INTO financier_submissions
                     (application_id, bank_id, decision, notes, conditions,
                      approved_amount, approved_tenor, approved_rate,
                      status, tenant_id, created_by, updated_at, created_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
                    [
                        body.applicationId,
                        body.bankId,
                        body.decision,
                        body.notes || null,
                        body.conditions ? JSON.stringify(body.conditions) : null,
                        body.approvedAmount || null,
                        body.approvedTenor || null,
                        body.approvedRate || null,
                        "completed",
                        tenantId,
                        (req as any).userId || null,
                    ]
                );

                if (body.decision === "approved" && body.approvedAmount) {
                    await db.query(
                        `UPDATE applications SET status = 'approved',
                         approved_amount = $1, approved_tenor = $2
                         WHERE id = $3`,
                        [body.approvedAmount, body.approvedTenor || null, body.applicationId]
                    );
                } else if (body.decision === "rejected") {
                    await db.query(
                        `UPDATE applications SET status = 'rejected', rejection_reason = $1 WHERE id = $2`,
                        [body.notes || "Bank rejected the application", body.applicationId]
                    );
                }

                return sendSuccess(reply, {
                    applicationId: body.applicationId,
                    bankId: body.bankId,
                    decision: body.decision,
                    message: body.decision === "approved"
                        ? "تم اعتماد التمويل بنجاح"
                        : body.decision === "rejected"
                            ? "تم رفض التمويل من البنك"
                            : "تم تسجيل القرار مع شروط",
                });
            } catch (err) {
                if (err instanceof z.ZodError) {
                    return sendError(reply, "Validation failed", 400, err.issues);
                }
                fastify.log.error(err);
                return sendError(reply, (err as Error)?.message ?? "Internal Server Error", 500);
            }
        }
    );

    fastify.post(
        "/applications/:id/bank-decision",
        { preHandler: authMiddleware },
        async (req, reply) => {
            try {
                const tenantId = req.tenantId;
                const { id } = req.params as { id: string };
                const body = req.body as any;

                const parsed = bankDecisionSchema.parse({
                    applicationId: Number(id),
                    bankId: body.bankId,
                    decision: body.decision,
                    notes: body.notes,
                    conditions: body.conditions,
                    approvedAmount: body.approvedAmount,
                    approvedTenor: body.approvedTenor,
                    approvedRate: body.approvedRate,
                });

                const appResult = await db.query(
                    `SELECT id, status FROM applications WHERE id = $1 AND tenant_id = $2`,
                    [parsed.applicationId, tenantId]
                );
                if (appResult.rows.length === 0) {
                    return sendError(reply, "Application not found", 404);
                }

                const bankResult = await db.query(
                    `SELECT id FROM banks WHERE id = $1`,
                    [parsed.bankId]
                );
                if (bankResult.rows.length === 0) {
                    return sendError(reply, "Bank not found", 404);
                }

                await db.query(
                    `INSERT INTO financier_submissions
                     (application_id, bank_id, decision, notes, conditions,
                      approved_amount, approved_tenor, approved_rate,
                      status, tenant_id, created_by, updated_at, created_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
                    [
                        parsed.applicationId,
                        parsed.bankId,
                        parsed.decision,
                        parsed.notes || null,
                        parsed.conditions ? JSON.stringify(parsed.conditions) : null,
                        parsed.approvedAmount || null,
                        parsed.approvedTenor || null,
                        parsed.approvedRate || null,
                        "completed",
                        tenantId,
                        (req as any).userId || null,
                    ]
                );

                if (parsed.decision === "approved" && parsed.approvedAmount) {
                    await db.query(
                        `UPDATE applications SET status = 'approved',
                         approved_amount = $1, approved_tenor = $2
                         WHERE id = $3`,
                        [parsed.approvedAmount, parsed.approvedTenor || null, parsed.applicationId]
                    );
                } else if (parsed.decision === "rejected") {
                    await db.query(
                        `UPDATE applications SET status = 'rejected', rejection_reason = $1 WHERE id = $2`,
                        [parsed.notes || "Bank rejected the application", parsed.applicationId]
                    );
                }

                return sendSuccess(reply, {
                    applicationId: parsed.applicationId,
                    bankId: parsed.bankId,
                    decision: parsed.decision,
                    message: parsed.decision === "approved"
                        ? "تم اعتماد التمويل بنجاح"
                        : parsed.decision === "rejected"
                            ? "تم رفض التمويل من البنك"
                            : "تم تسجيل القرار مع شروط",
                });
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
