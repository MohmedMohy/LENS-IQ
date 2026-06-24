import crypto from "crypto";
import type { FastifyInstance } from "fastify";
import { db } from "../db/db.js";
import { createCustomer } from "../admin/customers/service.js";
import { createApplication } from "../admin/applications/service.js";
import { createCustomerSchema } from "../admin/customers/customers.schema.js";
import { sendSuccess, sendError } from "../shared/response.js";
import { z } from "zod";

const applySchema = z.object({
    dealer_code: z.string().min(1),
    customer: createCustomerSchema,
    vehicle_id: z.number().int().positive(),
    requested_down_payment: z.number().positive(),
    requested_months: z.number().int().positive(),
    payment_method: z.enum(["salary_transfer", "bank_account", "cash_proof"]).default("bank_account"),
    notes: z.string().optional(),
});

export async function publicApplyRoutes(fastify: FastifyInstance) {
    // GET /public/vehicles/:code — قائمة العربيات المتاحة للمعرض
    fastify.get("/public/vehicles/:code", async (req, reply) => {
        try {
            const { code } = req.params as { code: string };
            const codeHash = crypto.createHash("sha256").update(code).digest("hex");
            const tenantResult = await db.query(
                `SELECT id FROM tenants WHERE api_key_hash = $1 AND active = true`,
                [codeHash]
            );
            const tenant = tenantResult.rows[0];
            if (!tenant) {
                return sendError(reply, "رابط التقديم غير صالح أو المعرض غير مفعل.", 404);
            }
            const vehicles = await db.query(
                `SELECT id, brand, model, manufacturing_year, condition, price, category
           FROM vehicles WHERE tenant_id = $1 ORDER BY id DESC`,
                [tenant.id]
            );
            return sendSuccess(reply, { vehicles: vehicles.rows });
        } catch (err: any) {
            return sendError(reply, err.message || "حدث خطأ داخلي", 500);
        }
    });

    // POST /public/apply — تقديم طلب تمويل
    fastify.post("/public/apply", async (req, reply) => {
        try {
            const body = applySchema.parse(req.body);

            const dealerHash = crypto.createHash("sha256").update(body.dealer_code).digest("hex");
            const tenantResult = await db.query(
                `SELECT id FROM tenants WHERE api_key_hash = $1 AND active = true`,
                [dealerHash]
            );

            const tenant = tenantResult.rows[0];
            if (!tenant) {
                return sendError(reply, "رابط التقديم غير صالح أو المعرض غير مفعل.", 404);
            }

            const tenantId = tenant.id;
            const newCustomer = await createCustomer(body.customer, tenantId);

            const newApplication = await createApplication(
                {
                    customer_id: newCustomer.id,
                    vehicle_id: body.vehicle_id,
                    requested_down_payment: body.requested_down_payment,
                    requested_months: body.requested_months,
                    payment_method: body.payment_method,
                    notes: body.notes,
                },
                tenantId
            );

            return reply.status(201).send({
                success: true,
                application_id: newApplication.id,
                message: "تم إرسال الطلب بنجاح",
            });

        } catch (err: any) {
            if (err instanceof z.ZodError) {
                return sendError(reply, "بيانات غير صالحة", 400, err.issues);
            }
            fastify.log.error(err);
            return sendError(reply, err.message || "حدث خطأ داخلي أثناء معالجة الطلب", 500);
        }
    });
}
