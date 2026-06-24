import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import type { RiskLevel } from "./types";

type Props = {
  score: number;
  level: RiskLevel;
  size?: number;
};

const levelConfig: Record<RiskLevel, { color: string; track: string }> = {
  LOW: { color: "#10B981", track: "rgba(16,185,129,0.15)" },
  MEDIUM: { color: "#F59E0B", track: "rgba(245,158,11,0.15)" },
  HIGH: { color: "#EF4444", track: "rgba(239,68,68,0.15)" },
};

const labelMapKey: Record<RiskLevel, string> = {
  LOW: "evaluate.lowRisk",
  MEDIUM: "evaluate.mediumRisk",
  HIGH: "evaluate.highRisk",
};

export default function RiskScoreGauge({ score, level, size = 180 }: Props) {
  const { t } = useTranslation();
  const cfg = levelConfig[level];
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={cfg.track}
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={cfg.color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-5xl font-bold tracking-tight"
          style={{ color: cfg.color }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.4, ease: "easeOut" }}
        >
          {score}%
        </motion.span>
        <motion.span
          className="mt-1 text-xs font-semibold uppercase tracking-widest"
          style={{ color: cfg.color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.7 }}
        >
          {t(labelMapKey[level])}
        </motion.span>
      </div>
    </div>
  );
}
