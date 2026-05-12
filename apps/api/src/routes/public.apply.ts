// src/routes/public.apply.ts
import type { FastifyInstance } from "fastify";
import { db } from "../db/db.js";
import { createCustomer } from "../admin/customers/service.js";
import { createApplication } from "../admin/applications/service.js";
import { createCustomerSchema } from "../admin/customers/customers.schema.js";
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
    fastify.post("/public/apply", async (req, reply) => {
        try {
            // 1. التحقق من صحة البيانات المدخلة
            const body = applySchema.parse(req.body);

            // 2. البحث عن المعرض باستخدام الـ dealer_code (api_key)
            const tenantResult = await db.query(
                `SELECT id FROM tenants WHERE api_key = $1 AND active = true`,
                [body.dealer_code]
            );

            const tenant = tenantResult.rows[0];
            if (!tenant) {
                return reply.status(404).send({
                    success: false,
                    message: "رابط التقديم غير صالح أو المعرض غير مفعل.",
                });
            }

            const tenantId = tenant.id;

            // 3. إنشاء العميل الجديد وربطه بـ tenantId
            const newCustomer = await createCustomer(body.customer, tenantId);

            // 4. إنشاء الطلب (Application) وربطه بالعميل والـ tenantId
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

            // 5. إرسال استجابة النجاح
            return reply.status(201).send({
                success: true,
                application_id: newApplication.id,
                message: "تم إرسال الطلب بنجاح",
            });

        } catch (err: any) {
            // معالجة أخطاء Zod (التحقق من البيانات)
            if (err instanceof z.ZodError) {
                return reply.status(400).send({
                    success: false,
                    message: "بيانات غير صالحة",
                    errors: err.issues,
                });
            }

            // معالجة الأخطاء العامة
            fastify.log.error(err);
            return reply.status(500).send({
                success: false,
                message: err.message || "حدث خطأ داخلي أثناء معالجة الطلب",
            });
        }
    });
}