import { describe, it, expect } from "vitest";
import { RankingService } from "../ranking/RankingService.js";
import type { Offer } from "../../shared/types/offer.js";

function makeOffer(overrides: Partial<Offer>): Offer {
  return {
    programId: 1, bankId: 0, status: "APPROVED",
    installment: 5000, totalPayment: 300000, interestRate: 12,
    months: 60, financeAmount: 400000, downPayment: 100000,
    dti: 30, riskScore: 20, riskLevel: "LOW",
    affordabilityScore: 80, approvalProbability: 80,
    ...overrides,
  };
}

describe("RankingService", () => {
  it("should return empty for empty input", () => {
    const result = new RankingService().rank([]);
    expect(result).toEqual([]);
  });

  it("should sort APPROVED above REJECTED", () => {
    const offers = [
      makeOffer({ programId: 1, status: "REJECTED" }),
      makeOffer({ programId: 2, status: "APPROVED" }),
    ];
    const result = new RankingService().rank(offers);
    expect(result[0].status).toBe("APPROVED");
  });

  it("should sort CONDITIONAL between APPROVED and REJECTED", () => {
    const offers = [
      makeOffer({ programId: 1, status: "REJECTED" }),
      makeOffer({ programId: 2, status: "APPROVED" }),
      makeOffer({ programId: 3, status: "CONDITIONAL" }),
    ];
    const result = new RankingService().rank(offers);
    expect(result[0].status).toBe("APPROVED");
    expect(result[1].status).toBe("CONDITIONAL");
    expect(result[2].status).toBe("REJECTED");
  });

  it("should sort by score descending within same status", () => {
    const offers = [
      makeOffer({ programId: 1, installment: 5000, affordabilityScore: 50, approvalProbability: 50 }),
      makeOffer({ programId: 2, installment: 3000, affordabilityScore: 90, approvalProbability: 90 }),
    ];
    const result = new RankingService().rank(offers);
    expect(result[0].programId).toBe(2);
  });

  it("should break ties by lower installment", () => {
    const offers = [
      makeOffer({ programId: 1, installment: 5000, affordabilityScore: 80, approvalProbability: 80 }),
      makeOffer({ programId: 2, installment: 3000, affordabilityScore: 80, approvalProbability: 80 }),
    ];
    const result = new RankingService().rank(offers);
    expect(result[0].installment).toBe(3000);
  });

  it("should assign sequential ranks", () => {
    const offers = [
      makeOffer({ programId: 1 }),
      makeOffer({ programId: 2 }),
      makeOffer({ programId: 3 }),
    ];
    const result = new RankingService().rank(offers);
    expect(result[0].rank).toBe(1);
    expect(result[1].rank).toBe(2);
    expect(result[2].rank).toBe(3);
  });

  it("should support custom weights", () => {
    const offers = [
      makeOffer({ programId: 1, installment: 5000 }),
      makeOffer({ programId: 2, installment: 3000 }),
    ];
    const defaultResult = new RankingService().rank([...offers]);
    const customResult = new RankingService({
      financingCost: 0.50,
      financialFitness: 0,
      approvalProbability: 0.50,
      downPaymentImpact: 0,
      customerMatch: 0,
    }).rank([...offers]);
    const d1 = defaultResult[0].programScore!;
    const d2 = customResult[0].programScore!;
    expect(d1).not.toBe(d2);
  });

  describe("static ranking methods", () => {
    it("rankByLowestInstallment", () => {
      const offers = [
        makeOffer({ programId: 1, installment: 7000 }),
        makeOffer({ programId: 2, installment: 3000 }),
      ];
      const result = RankingService.rankByLowestInstallment(offers);
      expect(result[0].installment).toBe(3000);
    });

    it("rankByLowestTotalCost", () => {
      const offers = [
        makeOffer({ programId: 1, totalPayment: 500000 }),
        makeOffer({ programId: 2, totalPayment: 300000 }),
      ];
      const result = RankingService.rankByLowestTotalCost(offers);
      expect(result[0].totalPayment).toBe(300000);
    });

    it("rankByHighestApprovalProbability", () => {
      const offers = [
        makeOffer({ programId: 1, approvalProbability: 50 }),
        makeOffer({ programId: 2, approvalProbability: 90 }),
      ];
      const result = RankingService.rankByHighestApprovalProbability(offers);
      expect(result[0].approvalProbability).toBe(90);
    });
  });
});
