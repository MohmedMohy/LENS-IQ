// الحالات الأساسية للقرار
export type DecisionStatus =
    | "APPROVED"
    | "CONDITIONAL"
    | "REJECTED";


// مستويات المخاطرة
export type RiskLevel =
    | "LOW"
    | "MEDIUM"
    | "HIGH";


// شكل السبب الواحد
export type DecisionReason = {
    message: string;

    impact: RiskLevel;
};


// شكل البيانات الراجعة من الـ Engine
export type DecisionResult = {

    // حالة القرار النهائية
    status: DecisionStatus;

    // سكور المخاطرة (رقم)
    riskScore: number;

    // مستوى المخاطرة
    riskLevel: RiskLevel;

    // نسبة الدين للدخل
    dti: number;

    // القسط الشهري
    installment: number;

    // إجمالي المبلغ
    totalPayment: number;

    // أسباب القرار
    reasons: DecisionReason[];
};