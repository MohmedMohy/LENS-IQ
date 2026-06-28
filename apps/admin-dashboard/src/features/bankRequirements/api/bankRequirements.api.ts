import { apiClient } from "@/api/client";

export type BankInfo = {
  id: number;
  name: string;
  code: string;
  logoUrl: string;
};

export type BankDocumentChecklist = {
  documentId: string;
  name: string;
  required: boolean;
  status: "required" | "likely_available" | "needs_verification";
  notes: string;
  copies: number;
};

export type BankRequirementsResponse = {
  bank: BankInfo;
  requirements: {
    documents: any[];
    employmentTypes: string[];
    minSalary: number;
    minAge: number;
    maxAge: number;
    additionalConditions: string[];
    processingTime: string;
    bankNotes: string;
  };
  applicationContext: {
    clientName: string;
    employmentType: string;
    carType: string;
    carDetails: string;
    requestedAmount: number;
    clientPhone: string;
  } | null;
  documentChecklist: BankDocumentChecklist[];
};

export const bankRequirementsApi = {
  getRequirements: async (bankId: number, applicationId?: number): Promise<BankRequirementsResponse> => {
    const params = applicationId ? { applicationId } : {};
    const { data } = await apiClient.get(`/banks/${bankId}/requirements`, { params });
    return data as BankRequirementsResponse;
  },

  submitDecision: async (payload: {
    applicationId: number;
    bankId: number;
    decision: "approved" | "rejected" | "conditional";
    notes?: string;
    conditions?: string[];
    approvedAmount?: number;
    approvedTenor?: number;
    approvedRate?: number;
  }): Promise<{ applicationId: number; bankId: number; decision: string; message: string }> => {
    const { data } = await apiClient.post(`/applications/bank-decision`, payload);
    return data as any;
  },
};
