/**
 * Egyptian Market Scenario Tests
 *
 * Tests 5 critical market scenarios:
 *   A: Standard Approval (gov employee, good iScore)
 *   B: DTI Breach (high obligations, rejected)
 *   C: Car Age Constraint (old car, tenor capped)
 *   D: i-Score Block (bad credit, forced HIGH)
 *   E: Flat vs Reducing (APR disclosure)
 */

import { calculateDTI, MAX_DTI_STANDARD, MAX_DTI_GOVERNMENT, ELIGIBILITY_CEILING } from "../scoring/dti.js";
import { evaluateRisk } from "../scoring/riskScore.js";
import { calculateReducing, calculateFlat, calculateMurabaha } from "../pricing/loanCalculator.js";
import type { CalculationInput } from "../../shared/types/calculator.js";

let passed = 0;
let failed = 0;

function assert(label: string, ok: boolean, detail?: string): void {
    if (ok) {
        console.log(`  ✅ ${label}`);
        passed++;
    } else {
        console.log(`  ❌ ${label}${detail ? ` — ${detail}` : ''}`);
        failed++;
    }
}

function approx(a: number, b: number, tol: number = 0.5): boolean {
    return Math.abs(a - b) <= tol;
}

// ============================================================
// SCENARIO A: Standard Approval
// ============================================================
console.log('\n─── SCENARIO A: Standard Approval (Government, Good iScore) ───');

{
    // netSalary=15,000, obligations=2,000, gov employee
    const dtiResult = calculateDTI(15000, 0, 2000, 'government');
    assert('A1: DTI value computed for gov employee', dtiResult.value === 13.33);
    assert('A2: DTI within limits for government (55%)', dtiResult.status === 'within_limits');
    assert('A3: DTI below MAX_DTI_GOVERNMENT', dtiResult.value <= MAX_DTI_GOVERNMENT);

    // Risk evaluation with good iScore=680
    const risk = evaluateRisk(35, 15000, dtiResult.value, 'government', 680);
    assert('A4: Risk score is LOW', risk.level === 'LOW', `got ${risk.level} score=${risk.score}`);
    assert('A5: Risk factors explain decisions', risk.riskFactors.length > 0);
    assert('A6: i-Score adjustment applied', risk.riskFactors.some(f => f.includes('i-Score')));
    assert('A7: Employment discount applied', risk.riskFactors.some(f => f.includes('Employment')));

    // Simulated offer: 200k car, 25% down (50k), 48m, 24% rate → DTI within 55% gov limit
    const loanAmount = 200000 - (200000 * 0.25);
    const calc = calculateReducing({ loanAmount, annualRate: 24, months: 48 });
    const dtiWithInstallment = calculateDTI(15000, calc.installment, 2000, 'government');
    assert('A8: DTI with installment within government limit',
        dtiWithInstallment.status === 'within_limits',
        `DTI=${dtiWithInstallment.value}`);

    assert('A9: Amortization schedule generated (48 rows)',
        (calc.amortizationSchedule?.length ?? 0) === 48);

    // Nominal 24% reducing = effective ~26.82% (compounded monthly)
    assert('A10: Effective annual rate ~26.8% for 24% nominal reducing',
        approx(calc.effectiveAnnualRate ?? 0, 26.82, 0.5),
        `got ${calc.effectiveAnnualRate}%`);
}

// ============================================================
// SCENARIO B: DTI Breach
// ============================================================
console.log('\n─── SCENARIO B: DTI Breach (High Obligations) ───');

{
    const salary = 10000;
    const obligations = 3000;

    // 600k car, 20% down = 480k loan, 60m @24%
    const loanAmountB = 600000 - (600000 * 0.20);
    const calcB = calculateReducing({ loanAmount: loanAmountB, annualRate: 24, months: 60 });

    console.log(`  [B] Loan: ${loanAmountB}, Installment: ${calcB.installment}`);

    const dtiB = calculateDTI(salary, calcB.installment, obligations);
    assert('B1: DTI exceeds standard max (50%)', dtiB.value > MAX_DTI_STANDARD, `DTI=${dtiB.value}`);
    assert('B2: DTI status is exceeds_standard or exceeds_ceiling',
        dtiB.status === 'exceeds_standard' || dtiB.status === 'exceeds_ceiling');

    // Higher down payment (40%) reduces loan → lower DTI
    const loanB2 = 600000 - (600000 * 0.40);
    const calcB2 = calculateReducing({ loanAmount: loanB2, annualRate: 24, months: 60 });
    const dtiB2 = calculateDTI(salary, calcB2.installment, obligations);
    assert('B3: Higher down payment improves DTI', dtiB2.value < dtiB.value,
        `DTI went from ${dtiB.value} to ${dtiB2.value}`);
}

// ============================================================
// SCENARIO C: Car Age Constraint
// ============================================================
console.log('\n─── SCENARIO C: Car Age Constraint ───');

{
    const currentYear = new Date().getFullYear();

    // Used car from 2024 (2 years old in 2026), 5yr rule
    const carYear = currentYear - 2;
    const requestedTenor = 60;
    const condition: string = 'used';
    const ruleYears = condition === 'new' ? 7 : 5;
    const maxTenorMonths = Math.max(0, ((carYear + ruleYears) - currentYear) * 12);

    console.log(`  [C] carYear=${carYear}, currentYear=${currentYear}, ruleYears=${ruleYears}`);
    console.log(`  [C] maxTenorMonths=${maxTenorMonths}, requested=${requestedTenor}`);

    assert('C1: Max tenor capped below requested (60)', maxTenorMonths < requestedTenor,
        `max=${maxTenorMonths}`);

    // Used car preset tenors: [12, 24, 36]; only those ≤ maxTenorMonths qualify
    const usedTenors = [12, 24, 36];
    const effectiveTenors = usedTenors.filter(t => t <= maxTenorMonths);
    console.log(`  [C] effectiveTenors from used preset: ${JSON.stringify(effectiveTenors)}`);
    assert('C2: Tenors filtered by car age constraint', effectiveTenors.length > 0,
        `got empty — maxTenor=${maxTenorMonths}`);

    // A newer car (3 years old) on new-car rule should allow 48m+
    const carYear2 = currentYear - 3;
    const ruleYears2 = 7;
    const maxTenorMonths2 = Math.max(0, ((carYear2 + ruleYears2) - currentYear) * 12);
    assert('C3: 3yo new car allows tenor ≥ 48 months', maxTenorMonths2 >= 48,
        `got max=${maxTenorMonths2}`);
}

// ============================================================
// SCENARIO D: i-Score Block
// ============================================================
console.log('\n─── SCENARIO D: i-Score Block (Score 380) ───');

{
    const riskD = evaluateRisk(35, 20000, 15, 'government', 380);
    assert('D1: Risk level is HIGH regardless of good factors', riskD.level === 'HIGH',
        `got ${riskD.level}`);
    assert('D2: i-Score reason included', riskD.riskFactors.some(f => f.includes('i-Score')));
    assert('D3: Forced HIGH reason included', riskD.riskFactors.some(f => f.includes('forced')));

    // Even with perfect DTI, iScore < 400 forces HIGH
    const riskD2 = evaluateRisk(30, 50000, 5, 'government', 350);
    assert('D4: Perfect profile still HIGH with bad iScore', riskD2.level === 'HIGH',
        `got ${riskD2.level}`);
}

// ============================================================
// SCENARIO E: Flat vs Reducing APR Comparison
// ============================================================
console.log('\n─── SCENARIO E: Flat vs Reducing APR Disclosure ───');

{
    const principal = 300000;
    const nominalRate = 18;
    const months = 36;

    const flatCalc = calculateFlat({
        loanAmount: principal,
        annualRate: nominalRate,
        months,
    } as CalculationInput);

    const reducingCalc = calculateReducing({
        loanAmount: principal,
        annualRate: nominalRate,
        months,
    } as CalculationInput);

    console.log(`  [E] Flat: installment=${flatCalc.installment}, effectiveAPR=${flatCalc.effectiveAnnualRate}%`);
    console.log(`  [E] Reducing: installment=${reducingCalc.installment}, effectiveAPR=${reducingCalc.effectiveAnnualRate}%`);

    assert('E1: Flat effective APR >> nominal rate (18%)',
        (flatCalc.effectiveAnnualRate ?? 0) > nominalRate * 1.5,
        `flat effective=${flatCalc.effectiveAnnualRate}%`);

    // Nominal 18% reducing = effective ~19.56% (compounded monthly)
    assert('E2: Reducing effective APR ~19.56% for 18% nominal',
        approx(reducingCalc.effectiveAnnualRate ?? 0, 19.56, 0.5),
        `reducing effective=${reducingCalc.effectiveAnnualRate}%`);

    // 18% flat over 36mo → effective ~35.27% via Newton-Raphson IRR
    assert('E3: Flat effective ~35.3% for 18% flat 36mo',
        approx(flatCalc.effectiveAnnualRate ?? 0, 35.27, 0.5),
        `got ${flatCalc.effectiveAnnualRate}%`);

    assert('E4: Reducing amortization schedule generated (36 rows)',
        (reducingCalc.amortizationSchedule?.length ?? 0) === months);

    if (reducingCalc.amortizationSchedule && reducingCalc.amortizationSchedule.length > 0) {
        const lastRow = reducingCalc.amortizationSchedule[reducingCalc.amortizationSchedule.length - 1];
        assert('E5: Final balance ~0', lastRow.balance < 1, `got ${lastRow.balance}`);
    }

    // Flat ALWAYS costs more than reducing for same nominal rate
    assert('E6: Flat total payment > reducing total',
        flatCalc.totalPayment > reducingCalc.totalPayment,
        `flat=${flatCalc.totalPayment}, reducing=${reducingCalc.totalPayment}`);
}

// ============================================================
// DTI Module Validation
// ============================================================
console.log('\n─── DTI Module Validation ───');

{
    assert('DTI1: MAX_DTI_STANDARD = 50', MAX_DTI_STANDARD === 50);
    assert('DTI2: MAX_DTI_GOVERNMENT = 55', MAX_DTI_GOVERNMENT === 55);
    assert('DTI3: ELIGIBILITY_CEILING = 60', ELIGIBILITY_CEILING === 60);

    const zeroSalary = calculateDTI(0, 1000, 500);
    assert('DTI4: Zero salary returns ceiling', zeroSalary.status === 'exceeds_ceiling');

    const govExact = calculateDTI(10000, 4000, 500, 'government');
    assert('DTI5: Government DTI=45% within 55% limit',
        govExact.value <= MAX_DTI_GOVERNMENT,
        `DTI=${govExact.value}`);

    // Standard: 5,000 installment + 500 obligations on 10,000 salary = 55% → exceeds_standard (between 50-60)
    const stdExceed = calculateDTI(10000, 5000, 500);
    assert('DTI6: Standard DTI=55% exceeds standard (50%)',
        stdExceed.status === 'exceeds_standard',
        `DTI=${stdExceed.value}, status=${stdExceed.status}`);

    // 6,000 installment + 500 obligations on 10,000 salary = 65% → exceeds_ceiling (>60)
    const stdCeiling = calculateDTI(10000, 6000, 500);
    assert('DTI7: Standard DTI=65% exceeds ceiling (60%)',
        stdCeiling.status === 'exceeds_ceiling',
        `DTI=${stdCeiling.value}, status=${stdCeiling.status}`);
}

// ============================================================
// Loan Calculator Edge Cases
// ============================================================
console.log('\n─── Loan Calculator Edge Cases ───');

{
    const zeroRate = calculateReducing({ loanAmount: 100000, annualRate: 0, months: 12 });
    assert('LC1: Zero rate flat installment', zeroRate.installment === 8333.33,
        `got ${zeroRate.installment}`);

    const murabaha = calculateMurabaha({
        loanAmount: 200000,
        annualRate: 18,
        months: 60,
        costPrice: 200000,
        profitMarginPercent: 18,
    });
    assert('LC2: Murabaha profit amount = 36,000', murabaha.interestAmount === 36000,
        `got ${murabaha.interestAmount}`);
    assert('LC3: Murabaha has positive effective APR', (murabaha.effectiveAnnualRate ?? 0) > 0,
        `got ${murabaha.effectiveAnnualRate}%`);
}

// ============================================================
// SUMMARY
// ============================================================
console.log(`\n═══════════════════════════════════════════`);
console.log(`  Total: ${passed + failed}  |  ✅ Passed: ${passed}  |  ❌ Failed: ${failed}`);
console.log(`═══════════════════════════════════════════\n`);

process.exit(failed > 0 ? 1 : 0);
