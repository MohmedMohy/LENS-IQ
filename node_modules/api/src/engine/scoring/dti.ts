export function calculateDTI(
    salary: number,
    installment: number,
    liabilities: number
): number {
    if (!salary || salary <= 0) return 100;

    const dti = ((liabilities + installment) / salary) * 100;

    return Number(Math.max(0, dti).toFixed(2));
}