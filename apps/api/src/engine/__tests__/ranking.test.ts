import { describe, it, expect } from 'vitest'
import { rankOffers, calculateProgramScore } from '../offers/Ranking.js'
import type { Offer } from '../../shared/types/offer.js'

function makeOffer(overrides: Partial<Offer>): Offer {
  return {
    programId: 1,
    bankId: 0,
    status: 'APPROVED',
    installment: 5000,
    totalPayment: 300000,
    interestRate: 12,
    months: 60,
    financeAmount: 400000,
    downPayment: 100000,
    dti: 30,
    riskScore: 20,
    riskLevel: 'LOW',
    affordabilityScore: 80,
    approvalProbability: 80,
    ...overrides,
  }
}

describe('rankOffers', () => {
  it('should return empty array for empty input', () => {
    const result = rankOffers([])
    expect(result).toEqual([])
  })

  it('should sort APPROVED above REJECTED offers', () => {
    const offers = [
      makeOffer({ programId: 1, status: 'REJECTED', installment: 3000 }),
      makeOffer({ programId: 2, status: 'APPROVED', installment: 5000 }),
    ]
    const result = rankOffers(offers)
    expect(result[0].status).toBe('APPROVED')
  })

  it('should sort CONDITIONAL between APPROVED and REJECTED', () => {
    const offers = [
      makeOffer({ programId: 1, status: 'REJECTED', installment: 3000 }),
      makeOffer({ programId: 2, status: 'APPROVED', installment: 5000 }),
      makeOffer({ programId: 3, status: 'CONDITIONAL', installment: 4000 }),
    ]
    const result = rankOffers(offers)
    expect(result[0].status).toBe('APPROVED')
    expect(result[1].status).toBe('CONDITIONAL')
    expect(result[2].status).toBe('REJECTED')
  })

  it('should sort by programScore descending within same status', () => {
    const offers = [
      makeOffer({ programId: 1, status: 'APPROVED', installment: 5000, affordabilityScore: 50, approvalProbability: 50 }),
      makeOffer({ programId: 2, status: 'APPROVED', installment: 3000, affordabilityScore: 90, approvalProbability: 90 }),
    ]
    const result = rankOffers(offers)
    expect(result[0].programId).toBe(2)
    expect(result[0].programScore).toBeGreaterThanOrEqual(result[1].programScore!)
  })

  it('should break ties by lower installment', () => {
    const offers = [
      makeOffer({ programId: 1, installment: 5000, affordabilityScore: 80, approvalProbability: 80 }),
      makeOffer({ programId: 2, installment: 3000, affordabilityScore: 80, approvalProbability: 80 }),
    ]
    const result = rankOffers(offers)
    expect(result[0].installment).toBeLessThanOrEqual(result[1].installment)
  })

  it('should add programScore to each offer', () => {
    const offers = [makeOffer({ programId: 1 })]
    const result = rankOffers(offers)
    expect(result[0].programScore).toBeDefined()
    expect(typeof result[0].programScore).toBe('number')
  })

  it('should not mutate the original array', () => {
    const offers = [
      makeOffer({ programId: 2, installment: 5000 }),
      makeOffer({ programId: 1, installment: 3000 }),
    ]
    const original = [...offers]
    rankOffers(offers)
    expect(offers[0].programId).toBe(original[0].programId)
  })

  it('should handle single offer', () => {
    const offers = [makeOffer({ programId: 1 })]
    const result = rankOffers(offers)
    expect(result).toHaveLength(1)
    expect(result[0].programId).toBe(1)
  })
})

describe('calculateProgramScore', () => {
  it('should compute weighted score with default weights', () => {
    const offer = makeOffer({ installment: 5000, affordabilityScore: 80, approvalProbability: 80, downPaymentPct: 20 })
    const score = calculateProgramScore(offer, undefined, 10000, 60)
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('should return higher score for lower installment (better financing cost)', () => {
    const offer1 = makeOffer({ installment: 3000, affordabilityScore: 80, approvalProbability: 80 })
    const offer2 = makeOffer({ installment: 7000, affordabilityScore: 80, approvalProbability: 80 })
    const maxInstallment = 10000
    const score1 = calculateProgramScore(offer1, undefined, maxInstallment, 60)
    const score2 = calculateProgramScore(offer2, undefined, maxInstallment, 60)
    expect(score1).toBeGreaterThan(score2)
  })

  it('should prefer tenor closer to requested months', () => {
    const offer1 = makeOffer({ installment: 5000, affordabilityScore: 80, approvalProbability: 80, months: 60, tenor: 60 })
    const offer2 = makeOffer({ installment: 5000, affordabilityScore: 80, approvalProbability: 80, months: 36, tenor: 36 })
    const score1 = calculateProgramScore(offer1, undefined, 10000, 60)
    const score2 = calculateProgramScore(offer2, undefined, 10000, 60)
    expect(score1).toBeGreaterThan(score2)
  })

  it('should use default match score of 50 when no requestedMonths', () => {
    const offer = makeOffer({ installment: 5000, affordabilityScore: 80, approvalProbability: 80, months: 60 })
    const score = calculateProgramScore(offer, undefined, 10000, undefined)
    expect(score).toBeGreaterThan(0)
  })

  it('should handle custom weights', () => {
    const offer = makeOffer({ installment: 5000, affordabilityScore: 80, approvalProbability: 80 })
    const defaultScore = calculateProgramScore(offer, undefined, 10000, 60)
    const customScore = calculateProgramScore(offer, { financingCost: 0.50, financialFitness: 0.50, approvalProbability: 0, downPaymentImpact: 0, customerMatch: 0 }, 10000, 60)
    expect(customScore).not.toBe(defaultScore)
  })

  it('should handle zero maxInstallment (return 100 for cost score)', () => {
    const offer = makeOffer({ installment: 5000, affordabilityScore: 80, approvalProbability: 80 })
    const score = calculateProgramScore(offer, undefined, 0, 60)
    expect(score).toBeGreaterThan(0)
  })
})
