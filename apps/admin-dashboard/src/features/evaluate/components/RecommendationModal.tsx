import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { RankedOffer } from "@/types";

type RecommendationResult = {
  originalOffer: RankedOffer | null;
  recommendedOffer: RankedOffer | null;
  improvement: {
    monthlySaving: number;
    totalSaving: number;
    dtiChange: number;
    approvalChance: number;
  };
  recommendation: {
    type: string;
    message: string;
    suggestedParams: Record<string, unknown>;
  };
};

type RecommendationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  result: RecommendationResult;
  onApply: (offer: RankedOffer) => void;
};

function formatNumber(n: number): string {
  return Math.round(n).toLocaleString("en-EG");
}

export default function RecommendationModal({ isOpen, onClose, result, onApply }: RecommendationModalProps) {
  const [selectedTab, setSelectedTab] = useState<"comparison" | "details">("comparison");

  const { originalOffer, recommendedOffer, improvement, recommendation } = result;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-2xl rounded-2xl overflow-hidden"
            style={{ background: "var(--glass-card-bg, #1a1a2e)", border: "1px solid var(--glass-border)" }}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 pb-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                    توصية ذكية
                  </h2>
                  <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                    {recommendation.message}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-lg"
                  style={{ background: "var(--bg-card)", color: "var(--text-muted)" }}
                >
                  ✕
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mt-4">
                {(["comparison", "details"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setSelectedTab(tab)}
                    className="rounded-lg px-4 py-2 text-sm font-medium transition-all"
                    style={{
                      background: selectedTab === tab ? "rgba(79,70,229,0.2)" : "transparent",
                      color: selectedTab === tab ? "var(--primary-light)" : "var(--text-muted)",
                      border: selectedTab === tab ? "1px solid rgba(79,70,229,0.3)" : "1px solid transparent",
                    }}
                  >
                    {tab === "comparison" ? "مقارنة العروض" : "تفاصيل التوصية"}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="px-6 pb-6">
              {selectedTab === "comparison" && (
                <div className="space-y-4">
                  {/* Improvement Banner */}
                  {improvement.totalSaving > 0 && (
                    <div className="rounded-xl p-4 text-center" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
                      <p className="text-sm font-medium" style={{ color: "var(--success)" }}>
                        {(recommendation.type === "SHORTEN_TENOR" || recommendation.type === "SWITCH_METHOD")
                          ? `توفير ${formatNumber(improvement.totalSaving)} جنيه في إجمالي التكلفة`
                          : recommendation.type === "INCREASE_DOWN_PAYMENT"
                            ? `${formatNumber(improvement.monthlySaving)} جنيه توفير شهرياً`
                            : recommendation.type === "EXTEND_TENOR"
                              ? `${formatNumber(improvement.monthlySaving)} جنيه توفير شهرياً`
                              : `${Math.abs(improvement.approvalChance)}% تحسين في فرصة الموافقة`}
                      </p>
                    </div>
                  )}

                  {/* Comparison Table */}
                  <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--glass-border)" }}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ background: "var(--bg-card)" }}>
                          <th className="p-3 text-right font-semibold" style={{ color: "var(--text-muted)" }}>المعلومة</th>
                          <th className="p-3 text-center font-semibold" style={{ color: "var(--text-muted)" }}>العرض الحالي</th>
                          <th className="p-3 text-center font-semibold" style={{ color: "var(--success)" }}>العرض المقترح</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { label: "البنك", current: originalOffer?.bankName || "—", suggested: recommendedOffer?.bankName || "—" },
                          { label: "القسط الشهري", current: `${formatNumber(originalOffer?.installment || 0)} EGP`, suggested: `${formatNumber(recommendedOffer?.installment || 0)} EGP` },
                          { label: "إجمالي التمويل", current: `${formatNumber(originalOffer?.financeAmount || 0)} EGP`, suggested: `${formatNumber(recommendedOffer?.financeAmount || 0)} EGP` },
                          { label: "المدة", current: `${originalOffer?.months || 0} شهر`, suggested: `${recommendedOffer?.months || 0} شهر` },
                          { label: "نسبة الفائدة", current: `${(originalOffer?.interestRate || 0).toFixed(1)}%`, suggested: `${(recommendedOffer?.interestRate || 0).toFixed(1)}%` },
                          { label: "الدفعة المقدمة", current: `${formatNumber(originalOffer?.downPayment || 0)} EGP`, suggested: `${formatNumber(recommendedOffer?.downPayment || 0)} EGP` },
                          { label: "نسبة DTI", current: `${(originalOffer?.dti || 0).toFixed(1)}%`, suggested: `${(recommendedOffer?.dti || 0).toFixed(1)}%` },
                          { label: "فرصة الموافقة", current: `${Math.round(originalOffer?.approvalProbability || 0)}%`, suggested: `${Math.round(recommendedOffer?.approvalProbability || 0)}%` },
                          { label: "مستوى المخاطرة", current: originalOffer?.riskLevel || "—", suggested: recommendedOffer?.riskLevel || "—" },
                        ].map((row) => (
                          <tr key={row.label} style={{ borderTop: "1px solid var(--glass-border)" }}>
                            <td className="p-3 font-medium" style={{ color: "var(--text-secondary)" }}>{row.label}</td>
                            <td className="p-3 text-center" style={{ color: "var(--text-muted)" }}>{row.current}</td>
                            <td className="p-3 text-center font-semibold" style={{ color: "var(--success)" }}>{row.suggested}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedTab === "details" && (
                <div className="space-y-4">
                  <div className="rounded-xl p-4" style={{ background: "var(--bg-card)" }}>
                    <h4 className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>نوع التوصية</h4>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      {recommendation.type === "SHORTEN_TENOR" && "تقليل مدة التمويل لخفض التكلفة الإجمالية"}
                      {recommendation.type === "EXTEND_TENOR" && "تمديد مدة التمويل لتقليل القسط الشهري"}
                      {recommendation.type === "INCREASE_DOWN_PAYMENT" && "زيادة الدفعة الأولى لتحسين شروط التمويل"}
                      {recommendation.type === "SWITCH_METHOD" && "التحويل لنظام الرصيد المتناقص"}
                      {recommendation.type === "BEST_BANK_ALTERNATIVE" && "اختيار بنك بديل بفرصة موافقة أعلى"}
                    </p>
                  </div>

                  {improvement.monthlySaving > 0 && (
                    <div className="rounded-xl p-4" style={{ background: "rgba(16,185,129,0.08)" }}>
                      <p className="text-sm" style={{ color: "var(--success)" }}>
                        <strong>{formatNumber(improvement.monthlySaving)} جنيه</strong> توفير شهري
                      </p>
                    </div>
                  )}

                  {improvement.totalSaving > 0 && (
                    <div className="rounded-xl p-4" style={{ background: "rgba(16,185,129,0.08)" }}>
                      <p className="text-sm" style={{ color: "var(--success)" }}>
                        <strong>{formatNumber(improvement.totalSaving)} جنيه</strong> توفير في إجمالي التكلفة
                      </p>
                    </div>
                  )}

                  {improvement.approvalChance !== 0 && (
                    <div className="rounded-xl p-4" style={{ background: improvement.approvalChance > 0 ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)" }}>
                      <p className="text-sm" style={{ color: improvement.approvalChance > 0 ? "var(--success)" : "var(--error-light)" }}>
                        <strong>{Math.abs(improvement.approvalChance).toFixed(0)}%</strong>
                        {improvement.approvalChance > 0 ? " تحسين في فرصة الموافقة" : " انخفاض في فرصة الموافقة"}
                      </p>
                    </div>
                  )}

                  <div className="rounded-xl p-4" style={{ background: "var(--bg-card)" }}>
                    <h4 className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>المعلمات المقترحة</h4>
                    <div className="space-y-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                      {Object.entries(recommendation.suggestedParams).map(([key, val]) => (
                        <div key={key} className="flex justify-between">
                          <span>{key === "tenor" ? "المدة" : key === "downPaymentPct" ? "نسبة الدفعة الأولى" : key === "method" ? "نظام الحساب" : key === "bankId" ? "البنك" : key}</span>
                          <span className="font-medium" style={{ color: "var(--text-primary)" }}>{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Apply Button */}
              {recommendedOffer && (
                <motion.button
                  type="button"
                  className="mt-6 w-full rounded-xl py-3 text-sm font-bold"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  style={{
                    background: "linear-gradient(135deg, var(--success), #059669)",
                    color: "#fff",
                    boxShadow: "0 2px 16px rgba(16,185,129,0.3)",
                  }}
                  onClick={() => onApply(recommendedOffer)}
                >
                  تطبيق هذا العرض
                </motion.button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
