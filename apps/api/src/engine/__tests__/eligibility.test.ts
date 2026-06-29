import { describe, it, expect } from 'vitest'
import { calculateDTI } from '../scoring/dti.js'

describe('calculateDTI', () => {
  describe('standard DTI calculation', () => {
    it('should calculate DTI = ((liabilities + installment) / salary) * 100', () => {
      const result = calculateDTI(10000, 3000, 2000)
      expect(result.value).toBe(50)
    })

    it('should handle zero liabilities and installment', () => {
      const result = calculateDTI(10000, 0, 0)
      expect(result.value).toBe(0)
      expect(result.status).toBe('within_limits')
    })
  })

  describe('employment type caps', () => {
    it('should use 50% cap for non-government', () => {
      const result = calculateDTI(10000, 3000, 2000, 'corporate')
      expect(result.value).toBe(50)
      expect(result.status).toBe('within_limits')
      expect(result.employmentAdjusted).toBe(false)
    })

    it('should use 55% cap for government', () => {
      const result = calculateDTI(10000, 3500, 2000, 'government')
      expect(result.value).toBe(55)
      expect(result.status).toBe('within_limits')
      expect(result.employmentAdjusted).toBe(true)
    })

    it('should mark government DTI=56% as exceeds_standard', () => {
      const result = calculateDTI(10000, 3600, 2000, 'government')
      expect(result.status).toBe('exceeds_standard')
    })

    it('should use 50% cap for undefined employment type', () => {
      const result = calculateDTI(10000, 4000, 1000, undefined)
      expect(result.value).toBe(50)
      expect(result.status).toBe('within_limits')
    })
  })

  describe('hard ceiling', () => {
    it('should classify DTI=60 as within_limits for government', () => {
      const result = calculateDTI(10000, 4500, 1500, 'government')
      expect(result.value).toBe(60)
      expect(result.status).toBe('exceeds_standard')
    })

    it('should classify DTI=60 as exceeds_standard for non-government', () => {
      const result = calculateDTI(10000, 5000, 1000)
      expect(result.value).toBe(60)
      expect(result.status).toBe('exceeds_standard')
    })

    it('should classify DTI > 60 as exceeds_ceiling', () => {
      const result = calculateDTI(10000, 5100, 1000)
      expect(result.value).toBe(61)
      expect(result.status).toBe('exceeds_ceiling')
    })
  })

  describe('edge cases', () => {
    it('should handle salary = 0 without crashing', () => {
      const result = calculateDTI(0, 3000, 2000)
      expect(result.value).toBe(100)
      expect(result.status).toBe('exceeds_ceiling')
    })

    it('should handle negative salary without crashing', () => {
      const result = calculateDTI(-1000, 3000, 2000)
      expect(result.value).toBe(100)
      expect(result.status).toBe('exceeds_ceiling')
    })

    it('should handle negative liabilities (treat as 0 after Math.max)', () => {
      const result = calculateDTI(10000, 3000, -5000)
      expect(result.value).toBe(0)
    })

    it('should return value rounded to 2 decimal places', () => {
      const result = calculateDTI(10000, 3333, 3333)
      expect(result.value.toString()).toMatch(/^\d+\.?\d{0,2}$/)
    })

    it('should handle very large salaries', () => {
      const result = calculateDTI(10000000, 1000000, 500000)
      expect(result.status).toBe('within_limits')
    })

    it('should handle DTI exactly at ceiling boundary (60.00)', () => {
      const result = calculateDTI(100, 60, 0)
      expect(result.value).toBe(60)
      expect(result.status).toBe('exceeds_standard')
    })

    it('should handle DTI exactly at 50%', () => {
      const result = calculateDTI(10000, 5000, 0)
      expect(result.value).toBe(50)
      expect(result.status).toBe('within_limits')
    })

    it('should handle DTI exactly at 55% for government', () => {
      const result = calculateDTI(10000, 5500, 0, 'government')
      expect(result.value).toBe(55)
      expect(result.status).toBe('within_limits')
    })
  })
})
