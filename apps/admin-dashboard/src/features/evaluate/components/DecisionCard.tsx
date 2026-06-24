import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import type { DecisionResult } from "./types";
import RiskScoreGauge from "./RiskScoreGauge";
import StatusBadge from "./StatusBadge";

type Props = {
  result: DecisionResult;
  index?: number;
};

const impactColors = {
  HIGH: { color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
  MEDIUM: { color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  LOW: { color: "#10B981", bg: "rgba(16,185,129,0.1)" },
};

export default function DecisionCard({ result, index = 0 }: Props) {
  const { t } = useTranslation();

  const impactLabelMap: Record<string, string> = {
    HIGH: t("evaluate.highImpact"),
    MEDIUM: t("evaluate.mediumImpact"),
    LOW: t("evaluate.lowImpact"),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="glass-card overflow-hidden"
    >
      <div className="grid gap-6 p-6 md:grid-cols-[1fr_1.5fr]">
        <div className="flex flex-col items-center justify-center border-e-0 md:border-e" style={{ borderColor: "var(--glass-border)" }}>
          <RiskScoreGauge score={result.riskScore} level={result.riskLevel} />
          <div className="mt-4">
            <StatusBadge status={result.status} size="lg" />
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              {t("evaluate.financialSummary")}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t("evaluate.monthlyInstallment")}</p>
                <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                  {result.installment.toLocaleString("en-EG", { maximumFractionDigits: 0 })} EGP
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t("evaluate.totalPayment")}</p>
                <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                  {result.totalPayment.toLocaleString("en-EG", { maximumFractionDigits: 0 })} EGP
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t("evaluate.dtiRatio")}</p>
                <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                  {result.dti.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {result.reasons.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                {t("evaluate.keyFactors")}
              </h3>
              <div className="space-y-2">
                {result.reasons.map((r, i) => {
                  const imp = impactColors[r.impact];
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.05 }}
                      className="flex items-start gap-3 rounded-xl p-3"
                      style={{ background: imp.bg }}
                    >
                      <div
                        className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
                        style={{ background: imp.color }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                          {r.message}
                        </p>
                        <p className="text-xs" style={{ color: imp.color }}>
                          {impactLabelMap[r.impact]}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
