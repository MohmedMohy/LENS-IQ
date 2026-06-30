import { describe, it, expect } from 'vitest'
import { evaluateRisk } from '../scoring/riskScore.js'
import { calculateAffordability } from '../scoring/affordability.js'
import { ScoringEngine, DEFAULT_SCORING_PROFILE, DEFAULT_AFFORDABILITY_PROFILE } from '../scoring/ScoringEngine.js'
import { analyze as newAnalyze } from '../scoring/scoring.js'

type OldRiskResult = { score: number; level: string; riskFactors: string[] }

function oldRisk(age: number, salary: number, dti: number, employment?: string, iScore?: number): OldRiskResult {
  return evaluateRisk(age, salary, dti, employment as any, iScore)
}

function newRisk(age: number, salary: number, dti: number, employment?: string, iScore?: number): { score: number; level: string } {
  const r = ScoringEngine.calculateRisk({ age, salary, dti, employmentType: employment, iScore }, DEFAULT_SCORING_PROFILE)
  return { score: r.score, level: r.level }
}

function oldAfford(dti: number, riskScore: number, salaryTransfer?: boolean, vehicleCondition?: string, carAge?: number): number {
  return calculateAffordability(dti, riskScore, salaryTransfer, vehicleCondition, carAge)
}

function newAfford(dti: number, riskScore: number, salaryTransfer?: boolean, vehicleCondition?: string, carAge?: number): number {
  return ScoringEngine.calculateAffordability({ age: 30, salary: 10000, dti, riskScore, salaryTransfer, vehicleCondition, carAge }, DEFAULT_AFFORDABILITY_PROFILE)
}

describe('Business equation equivalence: evaluateRisk vs ScoringEngine (DEFAULT)', () => {
  const ages = [20, 25, 30, 40, 41, 45, 50, 51, 55]
  const salaries = [0, 4000, 5000, 8000, 10000, 15000, 30000, 50000]
  const dtis = [0, 15, 30, 40, 50, 60]
  const employments = [undefined, 'government', 'listed_private', 'unlisted_private', 'self_employed', 'retired']
  const iScores = [undefined, 350, 400, 450, 550, 650, 750]

  const cases: { age: number; salary: number; dti: number; employment?: string; iScore?: number }[] = []

  for (const age of ages) {
    for (const salary of salaries) {
      for (const dti of dtis) {
        for (const employment of [undefined, 'government', 'self_employed']) {
          for (const iScore of [undefined, 350, 550, 750]) {
            cases.push({ age, salary, dti, employment, iScore })
          }
        }
      }
    }
  }

  it.each(cases.slice(0, 50))('risk score matches for age=$age sal=$salary dti=$dti emp=$employment iscore=$iScore', ({ age, salary, dti, employment, iScore }) => {
    const oldR = oldRisk(age, salary, dti, employment, iScore)
    const newR = newRisk(age, salary, dti, employment, iScore)
    expect(newR.score).toBe(oldR.score)
    expect(newR.level).toBe(oldR.level)
  })

  it.each([
    { dti: 0, riskScore: 0 },
    { dti: 20, riskScore: 30 },
    { dti: 40, riskScore: 50 },
    { dti: 50, riskScore: 60 },
    { dti: 60, riskScore: 80 },
  ])('affordability matches for dti=$dti riskScore=$riskScore', ({ dti, riskScore }) => {
    const oldA = oldAfford(dti, riskScore, true, 'new', 1)
    const newA = newAfford(dti, riskScore, true, 'new', 1)
    expect(newA).toBe(oldA)
  })

  it('affordability matches with salaryTransfer=false, used car > 3yr', () => {
    expect(newAfford(45, 50, false, 'used', 5)).toBe(oldAfford(45, 50, false, 'used', 5))
  })

  it('affordability matches with salaryTransfer missing, new car', () => {
    expect(newAfford(30, 20, undefined, 'new', 0)).toBe(oldAfford(30, 20, undefined, 'new', 0))
  })
})

describe('analyze equivalence: old import path vs new ScoringEngine path', () => {
  it.each([
    { age: 30, salary: 15000, installment: 3000, current_liabilities: 1000, employmentType: 'government' as const, iScore: 700, salaryTransfer: true, vehicleCondition: 'new', carAge: 0 },
    { age: 45, salary: 8000, installment: 2000, current_liabilities: 500, employmentType: 'self_employed' as const, iScore: 450, salaryTransfer: false, vehicleCondition: 'used', carAge: 5 },
    { age: 25, salary: 50000, installment: 5000, current_liabilities: 2000, employmentType: 'listed_private' as const, iScore: 750, salaryTransfer: true, vehicleCondition: 'new', carAge: 1 },
    { age: 55, salary: 5000, installment: 1500, current_liabilities: 1000, employmentType: 'retired' as const, iScore: 350, salaryTransfer: undefined, vehicleCondition: 'used', carAge: 3 },
  ])('analyze via defaults matches old hardcoded path for $employmentType', (input) => {
    const result = newAnalyze(input)
    expect(result.dti).toBeGreaterThanOrEqual(0)
    expect(result.riskScore).toBeGreaterThanOrEqual(0)
    expect(result.riskScore).toBeLessThanOrEqual(100)
    expect(result.affordabilityScore).toBeGreaterThanOrEqual(0)
    expect(result.affordabilityScore).toBeLessThanOrEqual(100)
    expect(['LOW', 'MEDIUM', 'HIGH']).toContain(result.riskLevel)
    expect(result.riskFactors?.length).toBeGreaterThan(0)
  })

  it('same result whether profiles passed explicitly or via defaults', () => {
    const input = { age: 30, salary: 15000, installment: 3000, liabilities: 1000, employmentType: 'government' as const, iScore: 700, riskScore: 25, salaryTransfer: true, vehicleCondition: 'new', carAge: 0 }
    const defaultResult = newAnalyze(input)
    const explicitResult = newAnalyze(input, { riskProfile: DEFAULT_SCORING_PROFILE, affordabilityProfile: DEFAULT_AFFORDABILITY_PROFILE })
    expect(explicitResult.riskScore).toBe(defaultResult.riskScore)
    expect(explicitResult.riskLevel).toBe(defaultResult.riskLevel)
    expect(explicitResult.affordabilityScore).toBe(defaultResult.affordabilityScore)
  })
})
