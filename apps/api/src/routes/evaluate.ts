import type { FastifyInstance } from "fastify";
import { db } from "../db/db.js";
import { getPrograms } from "../services/getPrograms.js";
import { compareOffers, rankOffers } from "../engine/index.js";
import { authMiddleware } from "../auth/auth.middleware.js";

export async function evaluateRoutes(fastify: FastifyInstance) {
    fastify.post<{ Body: { application_id: number } }>(
        "/evaluate",
        { preHandler: authMiddleware },
        async (req, reply) => {
            try {
                const tenantId = req.tenantId;
                const { application_id } = req.body;

                // 1. Fetch application full data
                const appResult = await db.query(
                    `
          SELECT a.*,
                 c.name, c.salary, c.job_type, c.current_liabilities,
                 c.owns_property, c.owns_car, c.salary_transfer,
                 c.birth_date,
                 v.price, v.manufacturing_year, v.condition, v.brand, v.model
          FROM applications a
          JOIN customers c ON a.customer_id = c.id
          JOIN vehicles v ON a.vehicle_id = v.id
          WHERE a.id = $1 AND a.tenant_id = $2
          `,
                    [application_id, tenantId]
                );

                const row = appResult.rows[0];

                if (!row) {
                    return reply.status(404).send({
                        error: "Application not found"
                    });
                }

                // 2. Derive engine input (TEMP layer - will move to engine later)
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
                    down_payment: Number(row.requested_down_payment),
                    job_type: row.job_type,
                    car_age: currentYear - Number(row.manufacturing_year),
                    salary_transfer: Boolean(row.salary_transfer),
                };

                // 3. Load programs
                const programs = await getPrograms(tenantId);

                // 4. Engine execution (still legacy for now)
                const offers = await compareOffers(input, programs, tenantId);

                // 5. Persist offers
                for (const offer of offers) {
                    await db.query(
                        `
            INSERT INTO offers (
              tenant_id,
              application_id,
              program_id,
              bank_id,
              status,
              installment,
              total_payment,
              finance_amount,
              down_payment,
              interest_rate,
              months,
              dti,
              risk_score,
              risk_level,
              affordability_score,
              reasons
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
            `,
                        [
                            tenantId,
                            application_id,
                            offer.programId,
                            offer.bankId,
                            offer.status,
                            offer.installment,
                            offer.totalPayment,
                            offer.financeAmount ?? 0,
                            Number(row.requested_down_payment),
                            offer.interestRate,
                            offer.months,
                            offer.dti,
                            offer.riskScore,
                            offer.riskLevel,
                            offer.affordabilityScore,
                            JSON.stringify(offer.reasons ?? [])
                        ]
                    );
                }

                // 6. Rank approved offers
                const approved = offers.filter(o => o.status === "APPROVED");
                const ranked = rankOffers(approved);

                // 7. Response
                return reply.send({
                    bestOffer: ranked[0] ?? null,
                    offers
                });
            } catch (err: any) {
                fastify.log.error(err);
                return reply.status(500).send({
                    error: err?.message ?? "Internal Server Error"
                });
            }
        }
    );
}