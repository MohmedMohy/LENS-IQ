import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

type Props = {
  dti: number;
};

export default function DtiMeter({ dti }: Props) {
  const { t } = useTranslation();
  const color = dti <= 30 ? "#10B981" : dti <= 50 ? "#F59E0B" : "#EF4444";
  const label = dti <= 30 ? t("evaluate.healthy") : dti <= 50 ? t("evaluate.moderate") : t("evaluate.high");

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
        <span>{t("evaluate.debtToIncome")}</span>
        <span style={{ color }} className="font-semibold">{dti.toFixed(1)}% — {label}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full" style={{ background: "var(--glass-border)" }}>
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(dti, 100)}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ background: color }}
        />
      </div>
    </div>
  );
}
