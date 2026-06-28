import { db } from "../db/db.js";
import { logAudit } from "../shared/audit.service.js";

export async function createSubmission(
    tenantId: number,
    applicationId: number,
    data: {
        bankName: string;
        programName: string;
        installment: number;
        downPayment: number;
        financeAmount: number;
        months: number;
        interestRate: number;
    }
) {
    const result = await db.query(
        `INSERT INTO offers (tenant_id, application_id, program_id, bank_id, status, installment, total_payment, finance_amount, down_payment, interest_rate, months, dti, risk_score, risk_level, affordability_score, reasons)
         VALUES ($1, $2, 0, 0, 'PENDING', $3, $4, $5, $6, $7, $8, 0, 0, 'LOW', 0, '[]'::jsonb)
         RETURNING id`,
        [tenantId, applicationId, data.installment, data.installment * data.months, data.financeAmount, data.downPayment, data.interestRate, data.months]
    );
    const offerId = result.rows[0]?.id;

    await db.query(
        `UPDATE applications SET status = 'UNDER_REVIEW', updated_at = NOW() WHERE id = $1 AND tenant_id = $2`,
        [applicationId, tenantId]
    );

    await db.query(
        `INSERT INTO financier_submissions (tenant_id, application_id, offer_id, bank_name, program_name, status, submitted_at)
         VALUES ($1, $2, $3, $4, $5, 'PENDING', NOW())`,
        [tenantId, applicationId, offerId, data.bankName, data.programName]
    );

    logAudit({ tenantId, action: "submit_financier", entity: "application", entityId: applicationId, details: { bank: data.bankName, amount: data.financeAmount } });

    return {
        applicationId,
        bankName: data.bankName,
        programName: data.programName,
        status: "PENDING",
        submittedAt: new Date().toISOString(),
    };
}

export async function getSubmission(tenantId: number, applicationId: number) {
    const result = await db.query(
        `SELECT fs.*, a.customer_id, c.name AS customer_name, c.phone, c.national_id,
                v.brand, v.model, v.price
         FROM financier_submissions fs
         JOIN applications a ON fs.application_id = a.id
         JOIN customers c ON a.customer_id = c.id
         JOIN vehicles v ON a.vehicle_id = v.id
         WHERE fs.application_id = $1 AND fs.tenant_id = $2
         ORDER BY fs.id DESC LIMIT 1`,
        [applicationId, tenantId]
    );
    return result.rows[0] ?? null;
}

export async function updateDecision(
    tenantId: number,
    applicationId: number,
    status: "APPROVED" | "REJECTED",
    financierNotes?: string
) {
    await db.query(
        `UPDATE financier_submissions SET status = $1, financier_notes = $2, decided_at = NOW()
         WHERE application_id = $3 AND tenant_id = $4`,
        [status, financierNotes ?? null, applicationId, tenantId]
    );

    if (status === "APPROVED") {
        await db.query(
            `UPDATE applications SET status = 'APPROVED', updated_at = NOW() WHERE id = $1 AND tenant_id = $2`,
            [applicationId, tenantId]
        );
    } else {
        await db.query(
            `UPDATE applications SET status = 'PENDING', updated_at = NOW() WHERE id = $1 AND tenant_id = $2`,
            [applicationId, tenantId]
        );
    }

    logAudit({ tenantId, action: `financier_${status.toLowerCase()}`, entity: "application", entityId: applicationId, details: { notes: financierNotes } });
}
