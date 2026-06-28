export function calculateAffordability(
    dti: number,
    riskScore?: number,
    salaryTransfer?: boolean,
    vehicleCondition?: string,
    carAge?: number
): number {
    let score = 100;

    if (dti > 40) {
        score -= (dti - 40) * 1.5;
    }

    if (riskScore !== undefined && riskScore > 40) {
        score -= (riskScore - 40) * 0.5;
    }

    if (salaryTransfer === false) {
        score -= 5;
    }

    if (
        vehicleCondition === 'used' &&
        carAge !== undefined &&
        carAge > 3
    ) {
        score -= 5;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
}
