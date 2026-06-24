import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getPrograms } from "../services/getPrograms.js";
import { compareOffers, rankOffers } from "../engine/index.js";
import { authMiddleware } from "../auth/auth.middleware.js";
import { sendSuccess, sendError } from "../shared/response.js";
import type { ApplicationInput } from "../shared/types/applicationInput.js";
import type { Program } from "../shared/types/program.js";
import type { OptimizationSuggestion } from "../shared/types/offer.js";

const optimizeSchema = z.object({
    price: z.number().positive(),
    salary: z.number().positive(),
    current_liabilities: z.number().min(0).default(0),
    requested_down_payment: z.number().positive(),
    requested_months: z.number().int().positive(),
    age: z.number().int().min(18).max(80),
    job_type: z.string().optional(),
    car_age: z.number().int().min(0).max(30).default(5),
    owns_property: z.boolean().default(false),
    owns_car: z.boolean().default(false),
    salary_transfer: z.boolean().default(false),
});

async function runEvaluation(
    input: ApplicationInput,
    programs: Program[],
    tenantId: number
) {
    const offers = await compareOffers(input, programs, tenantId);
    const approved = offers.filter((o) => o.status !== "REJECTED");
    const ranked = rankOffers(offers);
    const bestOffer = ranked[0] ?? null;
    const bestApproval = bestOffer?.approvalProbability ?? 0;
    return { offers, bestOffer, bestApproval };
}

function suggestDownPayment(
    current: number,
    price: number,
    bestApproval: number,
    input: ApplicationInput,
    programs: Program[],
    tenantId: number
): OptimizationSuggestion | null {
    const increments = [0.25, 0.3, 0.35, 0.4, 0.5];
    for (const pct of increments) {
        const suggested = Math.round(price * pct);
        if (suggested <= current) continue;
        return {
            type: "DOWN_PAYMENT",
            label: `Increase down payment to ${pct * 100}% of vehicle price`,
            currentValue: `${current.toLocaleString()} EGP`,
            suggestedValue: `${suggested.toLocaleString()} EGP`,
            currentApproval: bestApproval,
            projectedApproval: Math.min(99, bestApproval + Math.round((pct - current / price) * 40)),
            impact: suggested > current * 1.5 ? "HIGH" : "MEDIUM",
        };
    }
    return null;
}

function suggestDuration(
    current: number,
    bestApproval: number,
    input: ApplicationInput,
    programs: Program[],
): OptimizationSuggestion | null {
    const longer = [60, 72, 84].filter((m) => m > current);
    if (longer.length === 0) return null;
    const suggested = longer[0];
    const increase = Math.round((suggested - current) / 12 * 5);
    return {
        type: "DURATION",
        label: `Extend financing duration to ${suggested} months`,
        currentValue: `${current} months`,
        suggestedValue: `${suggested} months`,
        currentApproval: bestApproval,
        projectedApproval: Math.min(99, bestApproval + increase),
        impact: increase > 10 ? "HIGH" : "MEDIUM",
    };
}

export async function optimizeRoutes(fastify: FastifyInstance) {
    fastify.post<{ Body: z.infer<typeof optimizeSchema> }>(
        "/optimize",
        { preHandler: authMiddleware },
        async (req, reply) => {
            try {
                const tenantId = req.tenantId;
                const body = optimizeSchema.parse(req.body);

                const programs = await getPrograms(tenantId);
                if (programs.length === 0) {
                    return sendError(reply, "No financing programs configured", 400);
                }

                const baseInput: ApplicationInput = {
                    id: 0,
                    age: body.age,
                    salary: body.salary,
                    price: body.price,
                    current_liabilities: body.current_liabilities,
                    owns_property: body.owns_property,
                    owns_car: body.owns_car,
                    club_membership: null,
                    insurance_number: null,
                    requestedDownPayment: body.requested_down_payment,
                    job_type: body.job_type,
                    car_age: body.car_age,
                    salary_transfer: body.salary_transfer,
                };

                const current = await runEvaluation(baseInput, programs, tenantId);

                const suggestions: OptimizationSuggestion[] = [];

                const downPaymentSuggestion = suggestDownPayment(
                    body.requested_down_payment,
                    body.price,
                    current.bestApproval,
                    baseInput,
                    programs,
                    tenantId
                );
                if (downPaymentSuggestion) suggestions.push(downPaymentSuggestion);

                const durationSuggestion = suggestDuration(
                    body.requested_months,
                    current.bestApproval,
                    baseInput,
                    programs
                );
                if (durationSuggestion) suggestions.push(durationSuggestion);

                if (current.bestOffer && current.bestOffer.status === "REJECTED" && programs.length > 0) {
                    const altProgram = programs.find(
                        (p) => p.id !== current.bestOffer?.programId
                    );
                    if (altProgram) {
                        const altInput = { ...baseInput, id: 0 };
                        const altResult = await runEvaluation(altInput, [altProgram], tenantId);
                        if (altResult.bestApproval > current.bestApproval) {
                            suggestions.push({
                                type: "PROGRAM",
                                label: `Try "${altProgram.name}" program instead`,
                                currentValue: current.bestOffer?.programName ?? "Current",
                                suggestedValue: altProgram.name,
                                currentApproval: current.bestApproval,
                                projectedApproval: altResult.bestApproval,
                                impact: "HIGH",
                            });
                        }
                    }
                }

                suggestions.sort((a, b) => b.impact.localeCompare(a.impact));

                return sendSuccess(reply, {
                    current: {
                        bestOffer: current.bestOffer,
                        approvalProbability: current.bestApproval,
                        offersCount: current.offers.length,
                        approvedCount: current.offers.filter((o) => o.status === "APPROVED").length,
                    },
                    suggestions: suggestions.filter((s) => (s.currentApproval ?? 0) < s.projectedApproval),
                    parameters: {
                        price: body.price,
                        downPayment: body.requested_down_payment,
                        downPaymentPercent: Math.round((body.requested_down_payment / body.price) * 100),
                        duration: body.requested_months,
                        salary: body.salary,
                        dti: body.salary > 0 ? Math.round((body.current_liabilities / body.salary) * 100) : 0,
                    },
                });
            } catch (err: any) {
                if (err instanceof z.ZodError) {
                    return sendError(reply, "Validation failed", 400, err.issues);
                }
                fastify.log.error(err);
                return sendError(reply, err?.message ?? "Internal Server Error", 500);
            }
        }
    );
}
