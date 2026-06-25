import type { FastifyInstance } from "fastify";
import { db } from "../db/db.js";
import { getPrograms } from "../services/getPrograms.js";
import { compareOffers, rankOffers } from "../engine/index.js";
import { authMiddleware } from "../auth/auth.middleware.js";
import { sendSuccess, sendError } from "../shared/response.js";
import { logAudit } from "../shared/audit.service.js";

export async function evaluateRoutes(fastify: FastifyInstance) {
    fastify.post<{ Body: { application_id: number } }>(
        "/evaluate",
        { preHandler: authMiddleware },
        async (req, reply) => {
            try {
                const tenantId = req.tenantId;
                const { application_id } = req.body;

                const appResult = await db.query(
                    `SELECT a.*,
                     c.name, c.salary, c.job_type, c.current_liabilities,
                     c.owns_property, c.owns_car, c.salary_transfer,
                     c.birth_date,
                     v.price, v.manufacturing_year, v.condition, v.brand, v.model
                     FROM applications a
                     JOIN customers c ON a.customer_id = c.id
                     JOIN vehicles v ON a.vehicle_id = v.id
                     WHERE a.id = $1 AND a.tenant_id = $2`,
                    [application_id, tenantId]
                );

                const row = appResult.rows[0];

                if (!row) {
                    return sendError(reply, "Application not found", 404);
                }

                const currentYear = new Date().getFullYear();

                const input = {
                    id: application_id,
                    age: currentYear - new Date(row.birth_date).getFullYear(),
                    salary: Number(row.salary),
                    price: Number(row.price),
                    current_liabilities: Number(row.current_liabilities),
                    owns_property: Boolean(row.owns_property),
                    owns_car: Boolean(row.owns_car),
                    club_membership: null,
                    insurance_number: null,
                    requestedDownPayment: Number(row.requested_down_payment),
                    job_type: row.job_type,
                    car_age: currentYear - Number(row.manufacturing_year),
                    salary_transfer: Boolean(row.salary_transfer),
                };

                const programs = await getPrograms(tenantId);

                await db.query(
                    `DELETE FROM offers WHERE application_id = $1 AND tenant_id = $2`,
                    [application_id, tenantId]
                );

                const offers = await compareOffers(input, programs, tenantId);

                if (offers.length > 0) {
                    const values = offers.map((_, i) => {
                        const base = i * 16;
                        return `($${base+1},$${base+2},$${base+3},$${base+4},$${base+5},$${base+6},$${base+7},$${base+8},$${base+9},$${base+10},$${base+11},$${base+12},$${base+13},$${base+14},$${base+15},$${base+16})`;
                    }).join(",");
                    const params = offers.flatMap(o => [
                        tenantId, application_id, o.programId, o.bankId,
                        o.status, o.installment, o.totalPayment,
                        o.financeAmount ?? 0, o.downPayment, o.interestRate,
                        o.months, o.dti, o.riskScore, o.riskLevel,
                        o.affordabilityScore, JSON.stringify(o.reasons ?? [])
                    ]);
                    await db.query(
                        `INSERT INTO offers (tenant_id, application_id, program_id, bank_id, status, installment, total_payment, finance_amount, down_payment, interest_rate, months, dti, risk_score, risk_level, affordability_score, reasons) VALUES ${values}`,
                        params
                    );
                }

                const approved = offers.filter(o => o.status === "APPROVED");
                const ranked = rankOffers(approved);

                logAudit({ tenantId, userId: req.userId, action: "evaluate", entity: "application", entityId: application_id, details: { offers_count: offers.length, best_status: ranked[0]?.status ?? null } });

                return sendSuccess(reply, { bestOffer: ranked[0] ?? null, offers });
            } catch (err) {
                fastify.log.error(err);
                return sendError(reply, (err as Error)?.message ?? "Internal Server Error", 500);
            }
        }
    );
}
