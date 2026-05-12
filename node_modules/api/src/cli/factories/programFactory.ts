import type { Program } from "../../shared/types/program.js";

export function createTestProgram(overrides?: Partial<Program>): Program {
    return {
        id: 1,
        tenantId: 1,
        bankId: 1,

        name: "Test Program",

        financingType: "CAR_LOAN",
        calculationMethod: "reducing",

        interestRate: 0.12,
        minDownPaymentPercent: 10,
        maxMonths: 60,

        // defaults لأي fields ناقصة عندك في type
        isActive: true,
        createdAt: new Date().toISOString(),

        ...overrides,
    } as Program;
}