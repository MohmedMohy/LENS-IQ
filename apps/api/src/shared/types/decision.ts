export type DecisionType = "APPROVE" | "REJECT" | "CONDITIONAL";

export interface Decision {
    type: DecisionType;
    reason: {
        type: "RISK" | "RULE";
        message: string;
        impact: "LOW" | "MEDIUM" | "HIGH";
    };
}