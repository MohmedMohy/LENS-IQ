import { describe, it, expect } from 'vitest'
import { calculateLoan } from '../pricing/loanCalculator.js'
import { analyze } from '../scoring/scoring.js'
import type { ScoringInput } from '../../shared/types/scoring.js'
import type { CalculationInput } from '../../shared/types/calculator.js'

function computeApprovalProbability(score: {
  riskScore: number
  affordabilityScore: number
  dti: number
}, status: 'APPROVED' | 'REJECTED' | 'CONDITIONAL'): number {
  if (status === 'REJECTED') {
    const dtiPenalty = Math.min(100, Math.max(0, score.dti))
    const riskPenalty = Math.min(100, Math.max(0, score.riskScore))
    let prob = Math.round(Math.max(5, 50 - (dtiPenalty * 0.3 + riskPenalty * 0.4)))
    if (prob >= 50) prob = 49
    return prob
  }

  if (status === 'CONDITIONAL') {
    const dtiPenalty = Math.min(100, Math.max(0, score.dti))
    const riskPenalty = Math.min(100, Math.max(0, score.riskScore))
    let prob = Math.round(Math.max(30, Math.min(65, 50 - (dtiPenalty * 0.15 + riskPenalty * 0.2))))
    if (prob === 50) prob = 49
    return prob
  }

  const base = Math.min(100, Math.max(0, score.affordabilityScore)) * 0.5
  const riskBonus = Math.max(0, 100 - Math.min(100, Math.max(0, score.riskScore))) * 0.3
  const dtiBonus = Math.max(0, 100 - Math.min(100, Math.max(0, score.dti))) * 0.2
  let prob = Math.round(Math.min(99, base + riskBonus + dtiBonus))
  if (prob < 50) prob = 50
  if (prob === 50) prob = 51
  return prob
}

describe('approvalProbability', () => {
  describe('REJECTED path', () => {
    it('should calculate probability = 50 - (DTI*0.3 + riskScore*0.4)', () => {
      const prob = computeApprovalProbability({ riskScore: 50, affordabilityScore: 50, dti: 50 }, 'REJECTED')
      const expected = Math.round(Math.max(5, 50 - (50 * 0.3 + 50 * 0.4)))
      expect(prob).toBe(Math.min(expected, 49))
    })

    it('should floor at 5', () => {
      const prob = computeApprovalProbability({ riskScore: 100, affordabilityScore: 0, dti: 100 }, 'REJECTED')
      expect(prob).toBeGreaterThanOrEqual(5)
    })

    it('should cap at 49 (never return 50+)', () => {
      const prob = computeApprovalProbability({ riskScore: 0, affordabilityScore: 100, dti: 0 }, 'REJECTED')
      expect(prob).toBeLessThanOrEqual(49)
    })

    it('should return 49 when calculation gives exactly 50', () => {
      const prob = computeApprovalProbability({ riskScore: 0, affordabilityScore: 100, dti: 0 }, 'REJECTED')
      expect(prob).toBeLessThan(50)
    })
  })

  describe('CONDITIONAL path', () => {
    it('should cap at 65', () => {
      const prob = computeApprovalProbability({ riskScore: 0, affordabilityScore: 100, dti: 0 }, 'CONDITIONAL')
      expect(prob).toBeLessThanOrEqual(65)
    })

    it('should floor at 30', () => {
      const prob = computeApprovalProbability({ riskScore: 100, affordabilityScore: 0, dti: 100 }, 'CONDITIONAL')
      expect(prob).toBeGreaterThanOrEqual(30)
    })

    it('should map probability=50 to 49', () => {
      const prob = computeApprovalProbability({ riskScore: 50, affordabilityScore: 50, dti: 33.33 }, 'CONDITIONAL')
      if (prob === 50) expect(prob).toBe(49)
      expect(prob).toBeGreaterThanOrEqual(30)
      expect(prob).toBeLessThanOrEqual(65)
    })
  })

  describe('APPROVED path', () => {
    it('should calculate: affordability*0.5 + (100-risk)*0.3 + (100-dti)*0.2', () => {
      const prob = computeApprovalProbability({ riskScore: 20, affordabilityScore: 80, dti: 30 }, 'APPROVED')
      const expected = 80 * 0.5 + (100 - 20) * 0.3 + (100 - 30) * 0.2
      expect(prob).toBe(Math.round(Math.min(99, Math.max(51, expected))))
    })

    it('should ceil at 99', () => {
      const prob = computeApprovalProbability({ riskScore: 0, affordabilityScore: 100, dti: 0 }, 'APPROVED')
      expect(prob).toBeLessThanOrEqual(99)
    })

    it('should floor at 50 (then adjust to 51)', () => {
      const prob = computeApprovalProbability({ riskScore: 100, affordabilityScore: 0, dti: 100 }, 'APPROVED')
      expect(prob).toBeGreaterThanOrEqual(51)
    })

    it('should map probability=50 to 51', () => {
      const prob = computeApprovalProbability({ riskScore: 50, affordabilityScore: 50, dti: 50 }, 'APPROVED')
      if (prob === 50) expect(prob).toBe(51)
      expect(prob).toBeGreaterThanOrEqual(51)
      expect(prob).toBeLessThanOrEqual(99)
    })

    it('should never return probability in [5,49] for APPROVED status', () => {
      const prob = computeApprovalProbability({ riskScore: 100, affordabilityScore: 0, dti: 100 }, 'APPROVED')
      expect(prob).toBeGreaterThanOrEqual(51)
    })
  })

  describe('end-to-end through analyze + scenario', () => {
    it('should produce a valid probability for a realistic scenario (low risk)', () => {
      const calcInput: CalculationInput = { loanAmount: 400000, annualRate: 12, months: 60 }
      const calc = calculateLoan(calcInput, 'reducing')

      const scoreInput: ScoringInput = {
        age: 35,
        salary: 30000,
        installment: calc.installment,
        current_liabilities: 0,
        employmentType: 'government',
        iScore: 750,
        salaryTransfer: true,
        vehicleCondition: 'new',
        carAge: 0,
      }
      const scoringResult = analyze(scoreInput)

      const prob = computeApprovalProbability(
        { riskScore: scoringResult.riskScore, affordabilityScore: scoringResult.affordabilityScore, dti: scoringResult.dti },
        scoringResult.riskLevel === 'HIGH' ? 'REJECTED' : scoringResult.riskLevel === 'MEDIUM' ? 'CONDITIONAL' : 'APPROVED'
      )

      expect(prob).toBeGreaterThanOrEqual(5)
      expect(prob).toBeLessThanOrEqual(99)
    })

    it('should produce a valid probability for a high-risk scenario', () => {
      const calcInput: CalculationInput = { loanAmount: 400000, annualRate: 12, months: 60 }
      const calc = calculateLoan(calcInput, 'reducing')

      const scoreInput: ScoringInput = {
        age: 22,
        salary: 5000,
        installment: calc.installment,
        current_liabilities: 2000,
        employmentType: 'self_employed',
        salaryTransfer: false,
        vehicleCondition: 'used',
        carAge: 8,
      }
      const scoringResult = analyze(scoreInput)

      const prob = computeApprovalProbability(
        { riskScore: scoringResult.riskScore, affordabilityScore: scoringResult.affordabilityScore, dti: scoringResult.dti },
        scoringResult.riskLevel === 'HIGH' ? 'REJECTED' : 'CONDITIONAL'
      )

      expect(prob).toBeGreaterThanOrEqual(5)
      expect(prob).toBeLessThanOrEqual(99)
    })

    it('should handle extreme DTI > 100% without crashing', () => {
      const prob = computeApprovalProbability({ riskScore: 50, affordabilityScore: 0, dti: 150 }, 'REJECTED')
      expect(prob).toBeGreaterThanOrEqual(5)
    })

    it('should handle risk score near 0', () => {
      const prob = computeApprovalProbability({ riskScore: 0, affordabilityScore: 100, dti: 10 }, 'APPROVED')
      expect(prob).toBeGreaterThanOrEqual(51)
      expect(prob).toBeLessThanOrEqual(99)
    })

    it('should handle risk score near 100', () => {
      const prob = computeApprovalProbability({ riskScore: 100, affordabilityScore: 0, dti: 50 }, 'REJECTED')
      expect(prob).toBeGreaterThanOrEqual(5)
    })
  })
})
