import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import type { Reason } from "@/types";

type Props = {
  reasons: Reason[];
};

const impactColors = {
  HIGH: { color: "#EF4444", bg: "rgba(239,68,68,0.08)" },
  MEDIUM: { color: "#F59E0B", bg: "rgba(245,158,11,0.08)" },
  LOW: { color: "#10B981", bg: "rgba(16,185,129,0.08)" },
};

export default function ReasonList({ reasons }: Props) {
  const { t } = useTranslation();

  if (reasons.length === 0) return null;

  return (
    <div className="space-y-2">
      {reasons.map((r, i) => {
        const imp = impactColors[r.impact];
        return (
          <motion.div
            key={`${r.type}-${r.message}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-start gap-3 rounded-xl p-3"
            style={{ background: imp.bg }}
          >
            <div
              className="mt-1 h-2 w-2 shrink-0 rounded-full"
              style={{ background: imp.color }}
            />
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {r.message}
              </p>
              <p className="text-xs" style={{ color: imp.color }}>
                {t(`evaluate.${r.impact.toLowerCase()}Impact`)} · {r.type}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
