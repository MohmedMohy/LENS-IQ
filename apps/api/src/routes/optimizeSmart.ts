import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getPrograms } from "../services/getPrograms.js";
import { smartOptimize, DEFAULT_OPTIMIZER_CONFIG } from "../engine/index.js";
import type { OptimizerConfig } from "../engine/optimizer/config.js";
import { authMiddleware } from "../auth/auth.middleware.js";
import { sendSuccess, sendError } from "../shared/response.js";
import type { ApplicationInput } from "../shared/types/applicationInput.js";

const smartOptimizeSchema = z.object({
  price: z.number().positive(),
  salary: z.number().positive(),
  current_liabilities: z.number().min(0).default(0),
  requested_down_payment: z.number().min(0),
  requested_months: z.number().int().positive(),
  age: z.number().int().min(18).max(80),
  job_type: z.string().optional(),
  car_age: z.number().int().min(0).max(30).default(5),
  owns_property: z.boolean().default(false),
  owns_car: z.boolean().default(false),
  salary_transfer: z.boolean().default(false),
  max_offers: z.number().int().min(1).max(10).optional(),
  enable_near_miss: z.boolean().optional(),
});

export async function optimizeSmartRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: z.infer<typeof smartOptimizeSchema> }>(
    "/optimize/smart",
    { preHandler: authMiddleware },
    async (req, reply) => {
      try {
        const tenantId = req.tenantId;
        const body = smartOptimizeSchema.parse(req.body);

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
          requestedMonths: body.requested_months,
          job_type: body.job_type,
          car_age: body.car_age,
          salary_transfer: body.salary_transfer,
        };

        const optimizerConfig: OptimizerConfig = {
          ...DEFAULT_OPTIMIZER_CONFIG,
          maxOffers: body.max_offers ?? DEFAULT_OPTIMIZER_CONFIG.maxOffers,
          enableNearMiss: body.enable_near_miss ?? DEFAULT_OPTIMIZER_CONFIG.enableNearMiss,
        };

        const result = await smartOptimize(baseInput, programs, tenantId, optimizerConfig);

        return sendSuccess(reply, {
          offers: result.offers,
          timeline: result.timeline,
          summary: result.summary,
          visitedStates: result.visitedStates,
          parameters: {
            price: body.price,
            downPayment: body.requested_down_payment,
            downPaymentPercent: Math.round((body.requested_down_payment / body.price) * 100),
            duration: body.requested_months,
            salary: body.salary,
            dti: body.salary > 0 ? Math.round((body.current_liabilities / body.salary) * 100) : 0,
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
