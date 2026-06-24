import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import type { Offer } from "@/types";

type Props = {
  offers: Offer[];
  bestOffer: Offer | null;
};

function getStatusColor(status: string): string {
  switch (status) {
    case "APPROVED": return "var(--success)";
    case "CONDITIONAL": return "var(--warning)";
    default: return "var(--error)";
  }
}

export default function OfferComparison({ offers, bestOffer }: Props) {
  const { t } = useTranslation();

  if (offers.length === 0) return null;

  const approved = offers.filter((o) => o.status === "APPROVED");
  const conditional = offers.filter((o) => o.status === "CONDITIONAL");
  const topOffers = [...approved, ...conditional].slice(0, 3);
  const displayOffers = topOffers.length > 0 ? topOffers : offers.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
        {t("evaluate.scenarioComparison")}
      </h3>

      <div className="grid gap-4 md:grid-cols-3">
        {displayOffers.map((offer, i) => {
          const isBest = bestOffer &&
            offer.programId === bestOffer.programId &&
            offer.months === bestOffer.months &&
            offer.downPayment === bestOffer.downPayment;
          const statusColor = getStatusColor(offer.status);

          return (
            <motion.div
              key={`${offer.programId}-${offer.months}-${offer.downPayment}-${i}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="glass-card relative overflow-hidden p-5"
            >
              {isBest && (
                <div
                  className="absolute end-3 top-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                  style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))" }}
                >
                  {t("evaluate.best")}
                </div>
              )}

              <div className="mb-3">
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                  {offer.programName || `Program #${offer.programId}`}
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {offer.months} {t("evaluate.months")} · {Math.round((offer.downPayment / (offer.downPayment + offer.financeAmount)) * 100 || 0)}% {t("evaluate.down")}
                </p>
              </div>

              <div className="mb-3 flex items-center justify-between">
                <span
                  className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                  style={{
                    background: `${statusColor}15`,
                    color: statusColor,
                    border: `1px solid ${statusColor}30`,
                  }}
                >
                  {offer.status}
                </span>
                <span className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                  {offer.installment.toLocaleString("en-EG", { maximumFractionDigits: 0 })} EGP
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{t("evaluate.downPayment")}</span>
                  <span className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                    {offer.downPayment.toLocaleString("en-EG", { maximumFractionDigits: 0 })} EGP
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{t("evaluate.rate")}</span>
                  <span className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                    {offer.interestRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{t("evaluate.termLabel")}</span>
                  <span className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                    {offer.months} {t("evaluate.months")}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{t("evaluate.total")}</span>
                  <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                    {offer.totalPayment.toLocaleString("en-EG", { maximumFractionDigits: 0 })} EGP
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--glass-border)" }}>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: "var(--glass-border)" }}>
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(offer.riskScore, 100)}%` }}
                      transition={{ delay: 0.6 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                      style={{
                        background: offer.riskLevel === "LOW" ? "var(--success)" :
                                     offer.riskLevel === "MEDIUM" ? "var(--warning)" : "var(--error)",
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
                    {t("evaluate.riskScore")} {offer.riskScore}%
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
