import { describe, it, expect } from 'vitest'
import { runPolicyEngine } from '../evaluation/policyEngine.js'
import type { EvaluationContext } from '../types/context.js'
import type { ApplicationInput } from '../../shared/types/applicationInput.js'
import type { Program } from '../../shared/types/program.js'

const baseInput: ApplicationInput = {
  id: 1,
  age: 30,
  salary: 10000,
  price: 500000,
  current_liabilities: 0,
  owns_property: true,
  owns_car: false,
  club_membership: null,
  insurance_number: null,
  requestedDownPayment: 100000,
  requestedMonths: 60,
  job_type: 'government',
  car_age: 3,
  salary_transfer: true,
}

const baseProgram: Program = {
  id: 1,
  tenantId: 1,
  name: 'Test Program',
  code: null,
  description: null,
  customerTypes: ['salary_transfer'],
  priority: 0,
  requiredDocuments: [],
  defaultRiskRules: null,
  financingType: 'conventional',
  calculationMethod: 'reducing',
  minSalary: 0,
  maxCustomerAge: 65,
  maxCarAge: 10,
  allowedConditions: 'both',
  maxVehiclePrice: null,
  interestRate: 12,
  profitRate: null,
  maxMonths: 60,
  minMonths: 12,
  minDownPaymentPercent: 20,
  maxDownPaymentPercent: 50,
  maxFinanceAmount: null,
  adminFeesPercent: 0,
  salaryTransferRequired: false,
  active: true,
}

function createCtx(overrides?: Partial<EvaluationContext>): EvaluationContext {
  return {
    input: baseInput,
    program: baseProgram,
    rules: [],
    baseDTI: 0,
    reasons: [],
    ...overrides,
  }
}

describe('runPolicyEngine', () => {
  it('should return null when no rules trigger', () => {
    const ctx = createCtx({ rules: [] })
    const result = runPolicyEngine(ctx)
    expect(result).toBeNull()
  })

  it('should return REJECT when a REJECT rule matches', () => {
    const ctx = createCtx({
      input: { ...baseInput, salary: 3000 },
      rules: [
        { id: 1, program_id: 1, scope: 'PROGRAM', field: 'salary', operator: '<', value: '5000', action: 'REJECT', priority: 0 },
      ],
    })
    const result = runPolicyEngine(ctx)
    expect(result).not.toBeNull()
    expect(result!.type).toBe('REJECT')
  })

  it('should return REJECT when REQUIRED rule is not met', () => {
    const ctx = createCtx({
      input: { ...baseInput, owns_property: false },
      rules: [
        { id: 1, program_id: 1, scope: 'PROGRAM', field: 'owns_property', operator: '=', value: 'true', action: 'REQUIRED', priority: 0 },
      ],
    })
    const result = runPolicyEngine(ctx)
    expect(result).not.toBeNull()
    expect(result!.type).toBe('REJECT')
  })

  it('should return CONDITIONAL when all REQUIRED rules are met', () => {
    const ctx = createCtx({
      rules: [
        { id: 1, program_id: 1, scope: 'PROGRAM', field: 'salary', operator: '>=', value: '5000', action: 'REQUIRED', priority: 0 },
      ],
    })
    const result = runPolicyEngine(ctx)
    expect(result).not.toBeNull()
    expect(result!.type).toBe('CONDITIONAL')
  })

  it('should short-circuit on first REJECT (no further evaluation)', () => {
    const ctx = createCtx({
      input: { ...baseInput, salary: 3000, owns_property: true },
      rules: [
        { id: 1, program_id: 1, scope: 'PROGRAM', field: 'salary', operator: '<', value: '5000', action: 'REJECT', priority: 0 },
        { id: 2, program_id: 1, scope: 'PROGRAM', field: 'owns_property', operator: '=', value: 'true', action: 'REQUIRED', priority: 1 },
      ],
    })
    const result = runPolicyEngine(ctx)
    expect(result).not.toBeNull()
    expect(result!.type).toBe('REJECT')
    expect(result!.reason.message).toContain('salary')
  })

  it('should push reasons for WARN rules but not reject', () => {
    const ctx = createCtx({
      input: { ...baseInput, car_age: 7, salary: 12000 },
      rules: [
        { id: 1, program_id: 1, scope: 'PROGRAM', field: 'car_age', operator: '>', value: '5', action: 'WARN', priority: 0 },
        { id: 2, program_id: 1, scope: 'PROGRAM', field: 'salary', operator: '<', value: '15000', action: 'WARN', priority: 1 },
      ],
    })
    const result = runPolicyEngine(ctx)
    expect(result).toBeNull()
    expect(ctx.reasons.length).toBe(2)
  })

  it('should handle string fields with = operator', () => {
    const ctx = createCtx({
      input: { ...baseInput, job_type: 'government' },
      rules: [
        { id: 1, program_id: 1, scope: 'PROGRAM', field: 'job_type', operator: '=', value: 'government', action: 'REJECT', priority: 0 },
      ],
    })
    const result = runPolicyEngine(ctx)
    expect(result).not.toBeNull()
    expect(result!.type).toBe('REJECT')
  })

  it('should handle string fields with != operator', () => {
    const ctx = createCtx({
      input: { ...baseInput, job_type: 'freelancer' },
      rules: [
        { id: 1, program_id: 1, scope: 'PROGRAM', field: 'job_type', operator: '!=', value: 'government', action: 'REJECT', priority: 0 },
      ],
    })
    const result = runPolicyEngine(ctx)
    expect(result).not.toBeNull()
    expect(result!.type).toBe('REJECT')
  })

  it('should handle numeric operators on salary', () => {
    const ctx = createCtx({
      input: { ...baseInput, salary: 10000 },
      rules: [
        { id: 1, program_id: 1, scope: 'PROGRAM', field: 'salary', operator: '>', value: '5000', action: 'REJECT', priority: 0 },
      ],
    })
    const result = runPolicyEngine(ctx)
    expect(result).not.toBeNull()
    expect(result!.type).toBe('REJECT')
  })

  it('should handle boolean field salary_transfer', () => {
    const ctx = createCtx({
      input: { ...baseInput, salary_transfer: false },
      rules: [
        { id: 1, program_id: 1, scope: 'PROGRAM', field: 'salary_transfer', operator: '=', value: 'true', action: 'REQUIRED', priority: 0 },
      ],
    })
    const result = runPolicyEngine(ctx)
    expect(result).not.toBeNull()
    expect(result!.type).toBe('REJECT')
  })

  it('should handle boolean field owns_property', () => {
    const ctx = createCtx({
      input: { ...baseInput, owns_property: true },
      rules: [
        { id: 1, program_id: 1, scope: 'PROGRAM', field: 'owns_property', operator: '=', value: 'true', action: 'REQUIRED', priority: 0 },
      ],
    })
    const result = runPolicyEngine(ctx)
    expect(result).not.toBeNull()
    expect(result!.type).toBe('CONDITIONAL')
  })

  it('should handle down_payment field (mapped to requestedDownPayment)', () => {
    const ctx = createCtx({
      rules: [
        { id: 1, program_id: 1, scope: 'PROGRAM', field: 'down_payment', operator: '>=', value: '50000', action: 'REJECT', priority: 0 },
      ],
    })
    const result = runPolicyEngine(ctx)
    expect(result).not.toBeNull()
    expect(result!.type).toBe('REJECT')
  })

  it('should handle < and <= operators', () => {
    const ctx = createCtx({
      input: { ...baseInput, age: 25 },
      rules: [
        { id: 1, program_id: 1, scope: 'PROGRAM', field: 'age', operator: '<=', value: '25', action: 'REJECT', priority: 0 },
      ],
    })
    const result = runPolicyEngine(ctx)
    expect(result).not.toBeNull()
    expect(result!.type).toBe('REJECT')
  })

  it('should return null when rule value is not met for REJECT', () => {
    const ctx = createCtx({
      rules: [
        { id: 1, program_id: 1, scope: 'PROGRAM', field: 'age', operator: '>', value: '65', action: 'REJECT', priority: 0 },
      ],
    })
    const result = runPolicyEngine(ctx)
    expect(result).toBeNull()
  })
})
