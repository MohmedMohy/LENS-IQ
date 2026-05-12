export function calculateAffordability(dti: number): number {
    const safeDTI = Math.max(0, Math.min(dti, 100));
    return Math.max(0, 100 - safeDTI);
}