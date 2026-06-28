import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../../db/db.js";
import { getPrograms } from "../../services/getPrograms.js";
import { compareOffersDetailed, rankOffers } from "../../engine/index.js";
import { authMiddleware } from "../../auth/auth.middleware.js";
import { sendSuccess, sendError } from "../../shared/response.js";
import type { ApplicationInput } from "../../shared/types/applicationInput.js";

const evaluateRecommendationSchema = z.object({
    applicationId: z.number().int().positive(),
    recommendationType: z.enum(["SHORTEN_TENOR", "EXTEND_TENOR", "INCREASE_DOWN_PAYMENT", "SWITCH_METHOD", "BEST_BANK_ALTERNATIVE"]),
    suggestedParams: z.object({
        tenor: z.number().int().positive().optional(),
        downPaymentPct: z.number().min(0).max(100).optional(),
        method: z.enum(["reducing", "flat", "murabaha"]).optional(),
        bankId: z.number().int().positive().optional(),
    }),
});

export async function evaluateRecommendationRoutes(fastify: FastifyInstance) {
    fastify.post(
        "/engine/evaluate-recommendation",
        { preHandler: authMiddleware },
        async (req, reply) => {
            try {
                const tenantId = req.tenantId;
                const body = evaluateRecommendationSchema.parse(req.body);

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
                    [body.applicationId, tenantId]
                );

                const row = appResult.rows[0];
                if (!row) {
                    return sendError(reply, "Application not found", 404);
                }

                const currentYear = new Date().getFullYear();

                const baseInput: ApplicationInput = {
                    id: body.applicationId,
                    age: currentYear - new Date(row.birth_date).getFullYear(),
                    salary: Number(row.salary),
                    price: Number(row.price),
                    current_liabilities: Number(row.current_liabilities),
                    owns_property: Boolean(row.owns_property),
                    owns_car: Boolean(row.owns_car),
                    club_membership: null,
                    insurance_number: null,
                    requestedDownPayment: Number(row.requested_down_payment),
                    requestedMonths: Number(row.requested_months),
                    job_type: row.job_type,
                    car_age: currentYear - Number(row.manufacturing_year),
                    salary_transfer: Boolean(row.salary_transfer),
                };

                let programs = await getPrograms(tenantId);

                const originalResult = await compareOffersDetailed(baseInput, programs, tenantId);
                const allOriginal = [...originalResult.approved, ...originalResult.conditional] as any[];
                const rankedOriginal = rankOffers(allOriginal);
                const originalBest = rankedOriginal[0] ?? null;

                const suggestedInput: ApplicationInput = { ...baseInput };
                let suggestedTenors: number[] | undefined;

                if (body.recommendationType === "SHORTEN_TENOR" && body.suggestedParams.tenor) {
                    suggestedInput.requestedDownPayment = baseInput.price * 0.25;
                }

                if (body.recommendationType === "EXTEND_TENOR" && body.suggestedParams.tenor) {
                    suggestedTenors = [body.suggestedParams.tenor];
                }

                if (body.recommendationType === "INCREASE_DOWN_PAYMENT" && body.suggestedParams.downPaymentPct) {
                    suggestedInput.requestedDownPayment = baseInput.price * (body.suggestedParams.downPaymentPct / 100);
                }

                if (body.recommendationType === "BEST_BANK_ALTERNATIVE" && body.suggestedParams.bankId) {
                    programs = programs.filter(p => p.bankId === body.suggestedParams.bankId);
                    if (programs.length === 0) {
                        return sendError(reply, "No programs found for the selected bank", 404);
                    }
                }

                let suggestedResult = await compareOffersDetailed(suggestedInput, programs, tenantId, suggestedTenors);

                if (body.recommendationType === "SWITCH_METHOD" && body.suggestedParams.method) {
                    const switchPrograms = programs.filter(p => p.calculationMethod === body.suggestedParams.method);
                    if (switchPrograms.length > 0) {
                        suggestedResult = await compareOffersDetailed(suggestedInput, switchPrograms, tenantId);
                    }
                }

                const allSuggested = [...suggestedResult.approved, ...suggestedResult.conditional] as any[];
                const rankedSuggested = rankOffers(allSuggested);
                const suggestedBest = rankedSuggested[0] ?? null;

                const originalMonthly = originalBest?.installment ?? 0;
                const originalTotal = originalBest?.totalPayment ?? 0;
                const originalDTI = originalBest?.dti ?? 0;
                const originalApproval = originalBest?.approvalProbability ?? 0;

                const suggestedMonthly = suggestedBest?.installment ?? 0;
                const suggestedTotal = suggestedBest?.totalPayment ?? 0;
                const suggestedDTI = suggestedBest?.dti ?? 0;
                const suggestedApproval = suggestedBest?.approvalProbability ?? 0;

                let monthlySaving = 0;
                let totalSaving = 0;
                let dtiChange = 0;
                let approvalChance = 0;

                if (body.recommendationType === "SHORTEN_TENOR") {
                    monthlySaving = 0;
                    totalSaving = Math.max(0, originalTotal - suggestedTotal);
                    dtiChange = suggestedDTI - originalDTI;
                    approvalChance = suggestedApproval - originalApproval;
                } else if (body.recommendationType === "INCREASE_DOWN_PAYMENT") {
                    monthlySaving = Math.max(0, originalMonthly - suggestedMonthly);
                    totalSaving = Math.max(0, originalTotal - suggestedTotal);
                    dtiChange = suggestedDTI - originalDTI;
                    approvalChance = suggestedApproval - originalApproval;
                } else if (body.recommendationType === "EXTEND_TENOR") {
                    monthlySaving = Math.max(0, originalMonthly - suggestedMonthly);
                    totalSaving = 0;
                    dtiChange = suggestedDTI - originalDTI;
                    approvalChance = suggestedApproval - originalApproval;
                } else if (body.recommendationType === "SWITCH_METHOD") {
                    totalSaving = Math.max(0, originalTotal - suggestedTotal);
                    monthlySaving = Math.max(0, originalMonthly - suggestedMonthly);
                    dtiChange = suggestedDTI - originalDTI;
                    approvalChance = suggestedApproval - originalApproval;
                } else if (body.recommendationType === "BEST_BANK_ALTERNATIVE") {
                    monthlySaving = Math.max(0, originalMonthly - suggestedMonthly);
                    approvalChance = suggestedApproval - originalApproval;
                }

                const recommendationTexts: Record<string, string> = {
                    SHORTEN_TENOR: body.suggestedParams.tenor
                        ? `تقليل المدة لـ ${body.suggestedParams.tenor} شهر يوفر لك ${totalSaving.toLocaleString("en-EG", { maximumFractionDigits: 0 })} جنيه إجمالاً`
                        : "تقليل مدة التمويل يخفض التكلفة الإجمالية",
                    EXTEND_TENOR: body.suggestedParams.tenor
                        ? `تمديد المدة لـ ${body.suggestedParams.tenor} شهر يخفض القسط الشهري لـ ${suggestedMonthly.toLocaleString("en-EG", { maximumFractionDigits: 0 })} جنيه`
                        : "تمديد مدة التمويل يخفض القسط الشهري",
                    INCREASE_DOWN_PAYMENT: body.suggestedParams.downPaymentPct
                        ? `رفع الدفعة الأولى لـ ${body.suggestedParams.downPaymentPct}% يخفض القسط لـ ${suggestedMonthly.toLocaleString("en-EG", { maximumFractionDigits: 0 })} جنيه ويحسن DTI لـ ${suggestedDTI}%`
                        : "زيادة الدفعة الأولى تحسن شروط التمويل",
                    SWITCH_METHOD: `التحويل لنظام الرصيد المتناقص يوفر لك ${totalSaving.toLocaleString("en-EG", { maximumFractionDigits: 0 })} جنيه في إجمالي التكلفة`,
                    BEST_BANK_ALTERNATIVE: suggestedBest?.bankName
                        ? `بنك ${suggestedBest.bankName} لديه فرصة موافقة أعلى بــ ${Math.abs(approvalChance).toFixed(0)}%`
                        : "بنك بديل بفرصة موافقة أعلى",
                };

                return sendSuccess(reply, {
                    originalOffer: originalBest,
                    recommendedOffer: suggestedBest,
                    improvement: {
                        monthlySaving: Math.round(monthlySaving),
                        totalSaving: Math.round(totalSaving),
                        dtiChange: Math.round(dtiChange * 10) / 10,
                        approvalChance: Math.round(approvalChance),
                    },
                    recommendation: {
                        type: body.recommendationType,
                        message: recommendationTexts[body.recommendationType] || "توصية ذكية لتحسين العرض التمويلي",
                        suggestedParams: body.suggestedParams,
                    },
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
