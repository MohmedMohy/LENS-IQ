import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

export type RecommendationAction =
  | { type: "INCREASE_DOWN_PAYMENT"; pct: number }
  | { type: "EXTEND_DURATION"; months: number }
  | { type: "REDUCE_DURATION"; months: number }
  | { type: "SWITCH_PROGRAM"; programId: number }
  | { type: "SUBMIT_FINANCIER" }
  | { type: "NONE" };

export type Recommendation = {
  title: string;
  description: string;
  impact: string;
  type: "positive" | "info" | "warning";
  action: RecommendationAction;
};

type Props = {
  recommendations: Recommendation[];
  onApply?: (action: RecommendationAction) => void;
};

const typeConfig = {
  positive: { icon: "↑", color: "var(--success)" },
  info: { icon: "→", color: "var(--secondary)" },
  warning: { icon: "↓", color: "var(--warning)" },
};

export default function Recommendations({ recommendations, onApply }: Props) {
  const { t } = useTranslation();

  if (recommendations.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
        {t("evaluate.recommendations")}
      </h3>

      <div className="grid gap-3 md:grid-cols-3">
        {recommendations.map((rec, i) => {
          const tc = typeConfig[rec.type];
          const isClickable = rec.action.type !== "NONE" && !!onApply;
          return (
            <motion.button
              key={rec.title}
              type="button"
              onClick={() => {
                if (isClickable) onApply(rec.action);
              }}
              disabled={!isClickable}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.08 }}
              className={`glass-card p-4 text-start ${isClickable ? "cursor-pointer hover:scale-[1.02] active:scale-[0.98]" : "cursor-default"}`}
              style={{ transition: "transform 0.15s" }}
              whileHover={isClickable ? { scale: 1.02 } : {}}
              whileTap={isClickable ? { scale: 0.98 } : {}}
            >
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold"
                  style={{ background: `${tc.color}15`, color: tc.color }}
                >
                  {tc.icon}
                </span>
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {rec.title}
                </span>
              </div>
              <p className="mb-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                {rec.description}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: tc.color }}>
                {rec.impact}
              </p>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
