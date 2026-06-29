import { describe, it, expect } from 'vitest'
import { calculateReducing, calculateFlat, calculateMurabaha, calculateLoan } from '../pricing/loanCalculator.js'
import type { CalculationInput } from '../../shared/types/calculator.js'

describe('loanCalculator', () => {
  describe('calculateLoan', () => {
    it('should throw on zero loan amount', () => {
      const input: CalculationInput = { loanAmount: 0, annualRate: 12, months: 24 }
      expect(() => calculateLoan(input, 'reducing')).toThrow('Invalid calculation input')
    })

    it('should throw on zero months', () => {
      const input: CalculationInput = { loanAmount: 100000, annualRate: 12, months: 0 }
      expect(() => calculateLoan(input, 'reducing')).toThrow('Invalid calculation input')
    })

    it('should throw on negative loan amount', () => {
      const input: CalculationInput = { loanAmount: -1, annualRate: 12, months: 24 }
      expect(() => calculateLoan(input, 'reducing')).toThrow('Invalid calculation input')
    })
  })

  describe('calculateReducing', () => {
    it('should calculate correct monthly installment for standard case', () => {
      const input: CalculationInput = { loanAmount: 100000, annualRate: 12, months: 24 }
      const result = calculateReducing(input)
      expect(result.installment).toBeCloseTo(4707.35, 2)
      expect(result.totalPayment).toBeCloseTo(112976.40, 2)
      expect(result.interestAmount).toBeCloseTo(12976.40, 2)
    })

    it('should handle zero interest rate', () => {
      const input: CalculationInput = { loanAmount: 100000, annualRate: 0, months: 24 }
      const result = calculateReducing(input)
      expect(result.installment).toBeCloseTo(4166.67, 2)
      expect(result.interestAmount).toBe(0)
      expect(result.totalPayment).toBeCloseTo(100000, 0)
    })

    it('should handle loanAmount=0 with zero rate', () => {
      const input: CalculationInput = { loanAmount: 0, annualRate: 0, months: 24 }
      const result = calculateReducing(input)
      expect(result.installment).toBe(0)
      expect(result.interestAmount).toBe(0)
    })

    it('should handle loanAmount=0 with non-zero rate', () => {
      const input: CalculationInput = { loanAmount: 0, annualRate: 12, months: 24 }
      const result = calculateReducing(input)
      expect(result.installment).toBe(0)
      expect(result.interestAmount).toBe(0)
    })

    it('should handle minimum months (1)', () => {
      const input: CalculationInput = { loanAmount: 100000, annualRate: 12, months: 1 }
      const result = calculateReducing(input)
      expect(result.months).toBe(1)
      expect(result.installment).toBeGreaterThan(0)
      expect(result.totalPayment).toBeGreaterThan(100000)
    })

    it('should handle maximum months (84)', () => {
      const input: CalculationInput = { loanAmount: 100000, annualRate: 12, months: 84 }
      const result = calculateReducing(input)
      expect(result.months).toBe(84)
      expect(result.installment).toBeGreaterThan(0)
      expect(result.totalPayment).toBeGreaterThan(100000)
    })

    it('should apply interestModifier', () => {
      const input: CalculationInput = { loanAmount: 100000, annualRate: 12, months: 24, interestModifier: 2 }
      const result = calculateReducing(input)
      const base = calculateReducing({ loanAmount: 100000, annualRate: 12, months: 24 })
      expect(result.installment).toBeGreaterThan(base.installment)
    })

    it('should apply monthsModifier', () => {
      const input: CalculationInput = { loanAmount: 100000, annualRate: 12, months: 24, monthsModifier: 6 }
      const result = calculateReducing(input)
      expect(result.months).toBe(30)
    })

    it('should ensure minimum 1 month after modifier', () => {
      const input: CalculationInput = { loanAmount: 100000, annualRate: 12, months: 1, monthsModifier: -5 }
      const result = calculateReducing(input)
      expect(result.months).toBe(1)
    })

    it('should produce amortization schedule with correct length', () => {
      const input: CalculationInput = { loanAmount: 100000, annualRate: 12, months: 12 }
      const result = calculateReducing(input)
      expect(result.amortizationSchedule).toHaveLength(12)
    })

    it('should produce amortization schedule where balance goes to zero', () => {
      const input: CalculationInput = { loanAmount: 100000, annualRate: 12, months: 24 }
      const result = calculateReducing(input)
      const lastRow = result.amortizationSchedule![result.amortizationSchedule!.length - 1]
      expect(lastRow.balance).toBe(0)
    })

    it('should have amortization schedule match totalPayment', () => {
      const input: CalculationInput = { loanAmount: 100000, annualRate: 12, months: 12 }
      const result = calculateReducing(input)
      const sumPayments = result.amortizationSchedule!.reduce((s, r) => s + r.payment, 0)
      expect(sumPayments).toBeCloseTo(result.totalPayment, 0)
    })

    it('should handle high interest rates gracefully', () => {
      const input: CalculationInput = { loanAmount: 100000, annualRate: 50, months: 60 }
      const result = calculateReducing(input)
      expect(result.installment).toBeGreaterThan(0)
      expect(result.totalPayment).toBeGreaterThan(100000)
    })

    it('should handle very large loan amounts', () => {
      const input: CalculationInput = { loanAmount: 10000000, annualRate: 12, months: 60 }
      const result = calculateReducing(input)
      expect(result.installment).toBeGreaterThan(0)
    })
  })

  describe('calculateFlat', () => {
    it('should calculate correct flat installment', () => {
      const input: CalculationInput = { loanAmount: 100000, annualRate: 12, months: 24 }
      const result = calculateFlat(input)
      const totalInterest = 100000 * 0.12 * (24 / 12)
      const totalPayment = 100000 + totalInterest
      const expectedInstallment = totalPayment / 24
      expect(result.installment).toBeCloseTo(expectedInstallment, 2)
      expect(result.interestAmount).toBeCloseTo(totalInterest, 2)
    })

    it('should handle zero interest rate (flat)', () => {
      const input: CalculationInput = { loanAmount: 100000, annualRate: 0, months: 24 }
      const result = calculateFlat(input)
      expect(result.installment).toBeCloseTo(4166.67, 2)
      expect(result.interestAmount).toBe(0)
    })

    it('should calculate effective annual rate', () => {
      const input: CalculationInput = { loanAmount: 100000, annualRate: 12, months: 24 }
      const result = calculateFlat(input)
      expect(result.effectiveAnnualRate).toBeDefined()
      expect(result.effectiveAnnualRate).toBeGreaterThan(12)
    })
  })

  describe('calculateMurabaha', () => {
    it('should calculate correct murabaha installment', () => {
      const costPrice = 100000
      const profitPct = 12
      const months = 24
      const input: CalculationInput = {
        loanAmount: costPrice,
        annualRate: profitPct,
        months,
        costPrice,
        profitMarginPercent: profitPct,
      }
      const result = calculateMurabaha(input)
      const profitAmount = costPrice * (profitPct / 100)
      const sellingPrice = costPrice + profitAmount
      const expectedInstallment = sellingPrice / months
      expect(result.installment).toBeCloseTo(expectedInstallment, 2)
      expect(result.interestAmount).toBeCloseTo(profitAmount, 2)
    })

    it('should use costPrice when provided', () => {
      const input: CalculationInput = {
        loanAmount: 80000,
        annualRate: 12,
        months: 24,
        costPrice: 100000,
        profitMarginPercent: 12,
      }
      const result = calculateMurabaha(input)
      const profitAmount = 100000 * (12 / 100)
      expect(result.interestAmount).toBeCloseTo(profitAmount, 2)
    })

    it('should fall back to loanAmount when costPrice not provided', () => {
      const input: CalculationInput = { loanAmount: 100000, annualRate: 12, months: 24 }
      const result = calculateMurabaha(input)
      const profitAmount = 100000 * (12 / 100)
      expect(result.interestAmount).toBeCloseTo(profitAmount, 2)
    })
  })
})
