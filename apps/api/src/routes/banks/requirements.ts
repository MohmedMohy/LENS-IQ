import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../../db/db.js";
import { authMiddleware } from "../../auth/auth.middleware.js";
import { sendSuccess, sendError } from "../../shared/response.js";
import { decrypt } from "../../shared/crypto.service.js";

async function getBankRequirements(bankId: number) {
    const result = await db.query(
        `SELECT id, name, code, logo_url, requirements FROM banks WHERE id = $1`,
        [bankId]
    );
    return result.rows[0] ?? null;
}

const DOCUMENT_CHECKLIST: Array<{
    id: string;
    name: string;
    required: boolean;
    condition: string;
}> = [
    { id: "nat_id", name: "بطاقة الرقم القومي (سارية)", required: true, condition: "always" },
    { id: "salary_certificate", name: "شهادة راتب معتمدة (آخر 3 شهور)", required: true, condition: "always" },
    { id: "bank_statement", name: "كشف حساب بنكي (آخر 6 شهور)", required: true, condition: "always" },
    { id: "utility_bill", name: "فاتورة مرافق حديثة", required: true, condition: "always" },
    { id: "employment_letter", name: "خطاب تعيين / عقد عمل", required: true, condition: "employed" },
    { id: "tax_card", name: "بطاقة ضريبية", required: false, condition: "self_employed" },
    { id: "commercial_registry", name: "سجل تجاري", required: false, condition: "self_employed" },
    { id: "insurance_doc", name: "وثيقة التأمين على السيارة", required: true, condition: "always" },
];

function computeDocumentStatus(
    doc: typeof DOCUMENT_CHECKLIST[0],
    jobType: string
): "required" | "likely_available" | "needs_verification" {
    if (doc.condition === "always") return "required";
    if (doc.condition === jobType) return "likely_available";
    if (!doc.required) return "needs_verification";
    return "required";
}

export async function bankRequirementsRoutes(fastify: FastifyInstance) {
    fastify.get(
        "/banks/:bankId/requirements",
        { preHandler: authMiddleware },
        async (req, reply) => {
            try {
                const tenantId = req.tenantId;
                const { bankId } = req.params as { bankId: string };
                const query = req.query as { applicationId?: string };

                const bank = await getBankRequirements(Number(bankId));
                if (!bank) {
                    return sendError(reply, "Bank not found", 404);
                }

                let applicationContext = null;
                if (query.applicationId) {
                    const appResult = await db.query(
                        `SELECT a.*, c.name AS customer_name, c.job_type, c.phone, c.national_id,
                                v.brand, v.model, v.price, v.condition
                         FROM applications a
                         JOIN customers c ON a.customer_id = c.id
                         JOIN vehicles v ON a.vehicle_id = v.id
                         WHERE a.id = $1 AND a.tenant_id = $2`,
                        [Number(query.applicationId), tenantId]
                    );
                    const row = appResult.rows[0];
                    if (row) {
                        try { if (row.phone) row.phone = decrypt(row.phone); } catch { }
                        try { if (row.national_id) row.national_id = decrypt(row.national_id); } catch { }

                        applicationContext = {
                            clientName: row.customer_name,
                            employmentType: row.job_type,
                            carType: row.condition,
                            carDetails: `${row.brand} ${row.model}`,
                            requestedAmount: Number(row.price),
                            clientPhone: row.phone,
                        };
                    }
                }

                const dbRequirements = bank.requirements || {};
                const dbDocs = Array.isArray(dbRequirements.documents) ? dbRequirements.documents : [];

                const documentChecklist = DOCUMENT_CHECKLIST.map(doc => {
                    const dbDoc = dbDocs.find((d: any) => d.id === doc.id);
                    const status = computeDocumentStatus(doc, applicationContext?.employmentType || "unknown");
                    return {
                        documentId: doc.id,
                        name: dbDoc?.name || doc.name,
                        required: dbDoc?.required !== undefined ? dbDoc.required : doc.required,
                        status,
                        notes: dbDoc?.notes || doc.condition === "always" ? "مطلوب" : "حسب حالة العميل",
                        copies: dbDoc?.copies || 1,
                    };
                });

                return sendSuccess(reply, {
                    bank: {
                        id: bank.id,
                        name: bank.name,
                        code: bank.code,
                        logoUrl: bank.logo_url,
                    },
                    requirements: {
                        documents: dbDocs,
                        employmentTypes: dbRequirements.employmentTypes || ["government", "private", "self_employed"],
                        minSalary: dbRequirements.minSalary || 0,
                        minAge: dbRequirements.minAge || 21,
                        maxAge: dbRequirements.maxAge || 65,
                        additionalConditions: dbRequirements.additionalConditions || [],
                        processingTime: dbRequirements.processingTime || "3-5 أيام عمل",
                        bankNotes: dbRequirements.bankNotes || "",
                    },
                    applicationContext,
                    documentChecklist,
                });
            } catch (err) {
                fastify.log.error(err);
                return sendError(reply, (err as Error)?.message ?? "Internal Server Error", 500);
            }
        }
    );
}
