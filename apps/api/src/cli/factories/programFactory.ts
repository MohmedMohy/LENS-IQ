import type { Program } from "../../shared/types/program.js";

export function createTestProgram(overrides?: Partial<Program>): Program {
    return {
        id: 1,
        tenantId: 1,
        bankId: 1,
        name: "Test Program",
        financingType: "conventional",
        calculationMethod: "reducing",
        interestRate: 14.5,
        minDownPaymentPercent: 10,
        maxDownPaymentPercent: 100,
        maxMonths: 60,
        minMonths: 12,
        minSalary: 5000,
        maxCustomerAge: 60,
        maxCarAge: 10,
        allowedConditions: "both",
        maxVehiclePrice: null,
        profitRate: null,
        maxFinanceAmount: null,
        adminFeesPercent: 1,
        salaryTransferRequired: false,
        active: true,
        ...overrides,
    };
}
