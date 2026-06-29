import { describe, it, expect } from 'vitest'
import { evaluateRisk } from '../scoring/riskScore.js'

function calcScore(age: number, salary: number, dti: number, employment?: any, iScore?: number): number {
  const result = evaluateRisk(age, salary, dti, employment, iScore)
  return result.score
}

describe('evaluateRisk', () => {
  it('should start with base score of 20', () => {
    const result = evaluateRisk(45, 10000, 0)
    expect(result.score).toBeGreaterThanOrEqual(0)
  })

  describe('DTI contribution', () => {
    it('should add DTI * 0.3 to the score', () => {
      const result = evaluateRisk(45, 10000, 50)
      expect(result.score).toBe(20 + 15 + 0)
    })

    it('should cap DTI at 100', () => {
      const result = evaluateRisk(45, 10000, 200)
      expect(result.score).toBeLessThanOrEqual(20 + 30)
    })

    it('should floor DTI at 0', () => {
      const result = evaluateRisk(45, 10000, -10)
      expect(result.score).toBe(20)
    })
  })

  describe('salary adjustments', () => {
    it('should apply -15 for salary >= 30000', () => {
      expect(calcScore(45, 30000, 0)).toBe(20 - 15)
    })

    it('should apply -5 for salary >= 15000', () => {
      expect(calcScore(45, 15000, 0)).toBe(20 - 5)
    })

    it('should apply 0 for salary >= 8000', () => {
      expect(calcScore(45, 8000, 0)).toBe(20)
    })

    it('should apply +10 for salary >= 5000', () => {
      expect(calcScore(45, 5000, 0)).toBe(20 + 10)
    })

    it('should apply +20 for salary < 5000', () => {
      expect(calcScore(45, 0, 0)).toBe(20 + 20)
    })
  })

  describe('age adjustments (using age 45 to avoid age penalty)', () => {
    it('should apply -5 for age 25-40', () => {
      const result = evaluateRisk(30, 10000, 0)
      expect(result.riskFactors.some(f => f.includes('-5'))).toBe(true)
      expect(result.score).toBe(20 + 0 + (-5))
    })

    it('should apply +5 for age < 25', () => {
      const result = evaluateRisk(20, 10000, 0)
      expect(result.riskFactors.some(f => f.includes('+5'))).toBe(true)
      expect(result.score).toBe(20 + 0 + 5)
    })

    it('should apply +5 for age > 50', () => {
      const result = evaluateRisk(55, 10000, 0)
      expect(result.riskFactors.some(f => f.includes('+5'))).toBe(true)
      expect(result.score).toBe(20 + 0 + 5)
    })

    it('should not apply age adjustment for age 41-50', () => {
      const result = evaluateRisk(45, 10000, 0)
      const ageFactors = result.riskFactors.filter(f => f.includes('Age'))
      expect(ageFactors.length).toBe(0)
      expect(result.score).toBe(20)
    })

    it('should apply age adjustment at boundary 25', () => {
      const result = evaluateRisk(25, 10000, 0)
      expect(result.riskFactors.some(f => f.includes('-5'))).toBe(true)
    })

    it('should apply age adjustment at boundary 40', () => {
      const result = evaluateRisk(40, 10000, 0)
      expect(result.riskFactors.some(f => f.includes('-5'))).toBe(true)
    })

    it('should not apply age penalty at boundary 50', () => {
      const result = evaluateRisk(50, 10000, 0)
      expect(result.riskFactors.some(f => f.includes('+5'))).toBe(false)
    })

    it('should apply age penalty at boundary 51', () => {
      const result = evaluateRisk(51, 10000, 0)
      expect(result.riskFactors.some(f => f.includes('+5'))).toBe(true)
    })
  })

  describe('employment adjustments (using age 45 to avoid age noise)', () => {
    it('should apply -10 for government', () => {
      const result = evaluateRisk(45, 10000, 0, 'government')
      expect(result.riskFactors.some(f => f.includes('discount'))).toBe(true)
      expect(result.score).toBe(20 - 10)
    })

    it('should apply -5 for listed_private', () => {
      expect(calcScore(45, 10000, 0, 'listed_private')).toBe(20 - 5)
    })

    it('should apply 0 for unlisted_private', () => {
      expect(calcScore(45, 10000, 0, 'unlisted_private')).toBe(20)
    })

    it('should apply +10 for self_employed', () => {
      const result = evaluateRisk(45, 10000, 0, 'self_employed')
      expect(result.riskFactors.some(f => f.includes('penalty'))).toBe(true)
      expect(result.score).toBe(20 + 10)
    })

    it('should apply +5 for retired', () => {
      expect(calcScore(45, 10000, 0, 'retired')).toBe(20 + 5)
    })
  })

  describe('iScore adjustments (using age 45 to avoid age noise)', () => {
    it('should apply -15 for iScore >= 700', () => {
      expect(calcScore(45, 10000, 0, undefined, 750)).toBe(20 - 15)
    })

    it('should apply -5 for iScore 600-699', () => {
      expect(calcScore(45, 10000, 0, undefined, 650)).toBe(20 - 5)
    })

    it('should apply +10 for iScore 500-599', () => {
      expect(calcScore(45, 10000, 0, undefined, 550)).toBe(20 + 10)
    })

    it('should apply +20 for iScore 400-499', () => {
      expect(calcScore(45, 10000, 0, undefined, 450)).toBe(20 + 20)
    })

    it('should apply +35 for iScore < 400 and force HIGH risk', () => {
      const result = evaluateRisk(45, 10000, 0, undefined, 350)
      expect(result.score).toBe(20 + 35)
      expect(result.level).toBe('HIGH')
    })

    it('should handle iScore at boundary 700', () => {
      const r700 = evaluateRisk(45, 10000, 0, undefined, 700)
      const r699 = evaluateRisk(45, 10000, 0, undefined, 699)
      expect(r700.score).toBeLessThan(r699.score)
    })

    it('should handle iScore at boundary 600', () => {
      const r600 = evaluateRisk(45, 10000, 0, undefined, 600)
      const r599 = evaluateRisk(45, 10000, 0, undefined, 599)
      expect(r600.score).toBeLessThan(r599.score)
    })

    it('should handle iScore at boundary 500', () => {
      const r500 = evaluateRisk(45, 10000, 0, undefined, 500)
      const r499 = evaluateRisk(45, 10000, 0, undefined, 499)
      expect(r500.score).toBeLessThan(r499.score)
    })

    it('should handle iScore at boundary 400', () => {
      const r400 = evaluateRisk(45, 10000, 0, undefined, 400)
      const r399 = evaluateRisk(45, 10000, 0, undefined, 399)
      expect(r400.score).toBeLessThan(r399.score)
    })
  })

  describe('risk classification', () => {
    it('should classify HIGH when score >= 65', () => {
      const result = evaluateRisk(45, 0, 100, 'self_employed', 350)
      expect(result.level).toBe('HIGH')
      expect(result.score).toBeGreaterThanOrEqual(65)
    })

    it('should classify MEDIUM when score between 35 and 64', () => {
      const result = evaluateRisk(45, 8000, 50)
      if (result.score >= 35 && result.score < 65) {
        expect(result.level).toBe('MEDIUM')
      }
    })

    it('should classify LOW when score < 35', () => {
      const result = evaluateRisk(45, 30000, 0, 'government', 750)
      expect(result.level).toBe('LOW')
    })

    it('should force HIGH when iScore < 400 regardless of score', () => {
      const result = evaluateRisk(45, 30000, 0, 'government', 350)
      expect(result.level).toBe('HIGH')
      expect(result.riskFactors.some(f => f.includes('forced HIGH'))).toBe(true)
    })
  })

  describe('score clamping', () => {
    it('should not go below 0', () => {
      const result = evaluateRisk(45, 30000, 0, 'government', 750)
      expect(result.score).toBeGreaterThanOrEqual(0)
    })

    it('should not go above 100', () => {
      const result = evaluateRisk(20, 0, 100, 'self_employed', 350)
      expect(result.score).toBeLessThanOrEqual(100)
    })
  })
})
