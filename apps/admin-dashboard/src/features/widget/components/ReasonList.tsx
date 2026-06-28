import type { Reason } from "@/types";

type Props = {
  reasons: Reason[];
};

const impactIcons: Record<string, string> = {
  LOW: "✔",
  MEDIUM: "⚠",
  HIGH: "✘",
};

export default function ReasonList({ reasons }: Props) {
  if (reasons.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {reasons.map((r) => (
        <div key={`${r.type}-${r.message}`} className="flex items-start gap-2 text-xs">
          <span className="mt-0.5 shrink-0 text-emerald-500">{impactIcons[r.impact] ?? "•"}</span>
          <span style={{ color: "var(--text-secondary)" }}>{r.message}</span>
        </div>
      ))}
    </div>
  );
}
