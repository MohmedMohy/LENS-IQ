import { apiClient } from "@/api/client";
import type { Application } from "@/types";

export type FinancierSubmission = {
  applicationId: number;
  customerName: string;
  customerPhone: string;
  vehicleDetails: string;
  financeAmount: number;
  monthlyInstallment: number;
  downPayment: number;
  interestRate: number;
  months: number;
  bankName: string;
  programName: string;
  requiredDocuments: string[];
  status: "PENDING" | "APPROVED" | "REJECTED";
  financierNotes?: string;
  submittedAt: string;
};

export const sendToFinancierApi = {
  getApplicationDetails: async (applicationId: number): Promise<Application> => {
    const { data } = await apiClient.get(`/admin/applications`);
    const apps = data as Application[];
    const app = apps.find((a) => a.id === applicationId);
    if (!app) throw new Error("Application not found");
    return app;
  },

  getSubmission: async (applicationId: number): Promise<FinancierSubmission | null> => {
    try {
      const { data } = await apiClient.get(`/financier/submission/${applicationId}`);
      return data as FinancierSubmission;
    } catch {
      return null;
    }
  },

  submitToFinancier: async (applicationId: number, offer: { bankName: string; programName: string; installment: number; downPayment: number; financeAmount: number; months: number; interestRate: number }): Promise<FinancierSubmission> => {
    const { data } = await apiClient.post(`/financier/submit`, {
      application_id: applicationId,
      ...offer,
    });
    return data as FinancierSubmission;
  },

  updateFinancierDecision: async (applicationId: number, status: "APPROVED" | "REJECTED", financierNotes?: string): Promise<void> => {
    await apiClient.patch(`/financier/decision/${applicationId}`, { status, financierNotes });
  },
};
