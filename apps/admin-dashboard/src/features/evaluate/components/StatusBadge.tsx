import type { DecisionStatus } from "./types";

type Props = {
  status: DecisionStatus;
  size?: "sm" | "md" | "lg";
};

const config: Record<DecisionStatus, { label: string; cls: string }> = {
  APPROVED: { label: "Approved", cls: "status-approved" },
  CONDITIONAL: { label: "Conditional", cls: "status-conditional" },
  REJECTED: { label: "Rejected", cls: "status-rejected" },
};

const sizeMap = {
  sm: "px-3 py-1 text-[10px]",
  md: "px-4 py-1.5 text-xs",
  lg: "px-5 py-2 text-sm",
};

export default function StatusBadge({ status, size = "md" }: Props) {
  const c = config[status];
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold tracking-wide ${c.cls} ${sizeMap[size]}`}
      style={{
        background: "var(--status-bg)",
        color: "var(--status-text)",
        border: "1px solid var(--status-border)",
      }}
    >
      <span
        className="mr-1.5 h-1.5 w-1.5 rounded-full"
        style={{ background: "var(--status-color)" }}
      />
      {c.label}
    </span>
  );
}
