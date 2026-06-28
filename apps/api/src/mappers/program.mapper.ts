import type { Program } from "../shared/types/program.js";
import type { ProgramRow } from "../shared/types/database.js";

export function mapProgram(row: ProgramRow): Program {
    return {
        id: Number(row.id),
        tenantId: Number(row.tenant_id),
        name: row.name,
        code: row.code ?? null,
        description: row.description ?? null,
        customerTypes: row.customer_types as Program["customerTypes"],
        priority: Number(row.priority) || 0,
        requiredDocuments: Array.isArray(row.required_documents) ? row.required_documents : [],
        defaultRiskRules: row.default_risk_rules ?? null,

        financingType: row.financing_type as Program["financingType"],
        calculationMethod: row.calculation_method as Program["calculationMethod"],

        minSalary: Number(row.min_salary),
        maxCustomerAge: Number(row.max_customer_age),
        maxCarAge: Number(row.max_car_age),
        allowedConditions: row.allowed_conditions as Program["allowedConditions"],
        maxVehiclePrice: row.max_vehicle_price ? Number(row.max_vehicle_price) : null,

        interestRate: Number(row.interest_rate) || 0,
        profitRate: row.profit_rate ? Number(row.profit_rate) : null,

        maxMonths: Number(row.max_months) || 12,
        minMonths: Number(row.min_months) || 12,
        minDownPaymentPercent: Number(row.min_down_payment_percent) || 0,
        maxDownPaymentPercent: Number(row.max_down_payment_percent) || 100,
        maxFinanceAmount: row.max_finance_amount ? Number(row.max_finance_amount) : null,
        adminFeesPercent: Number(row.admin_fees_percent) || 0,

        salaryTransferRequired: Boolean(row.salary_transfer_required),
        active: Boolean(row.active),
    };
}
