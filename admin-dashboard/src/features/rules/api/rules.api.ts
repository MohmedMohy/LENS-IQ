// src/api/rules.api.ts

import { apiClient } from "./../../../api/client";
import type { Rule, CreateRulePayload, RuleField, RuleOperator, RuleAction } from "@/types";

function normalizeRule(raw: Rule): Rule {
    return {
        id: Number(raw.id),
        program_id: Number(raw.program_id),
        field: raw.field as RuleField,
        operator: raw.operator as RuleOperator,
        value: String(raw.value),
        action: (raw.action as string).toUpperCase() as RuleAction,
    };
}

export const rulesApi = {
    getAllByProgram: async (programId: string | number): Promise<Rule[]> => {
        const response = await apiClient.get<Rule[]>(`/admin/rules/${programId}`);
        return response.data.map(normalizeRule);
    },

    create: async (payload: CreateRulePayload): Promise<Rule> => {
        const response = await apiClient.post<Rule>("/admin/rules", payload);
        return normalizeRule(response.data);
    },

    remove: async (id: string | number): Promise<void> => {
        await apiClient.delete(`/admin/rules/${id}`);
    },
};