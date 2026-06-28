import type { OfferStatus } from "@/types";

const config: Record<OfferStatus, { label: string; bg: string; text: string; dot: string }> = {
  APPROVED: { label: "Approved", bg: "bg-emerald-500/10", text: "text-emerald-500", dot: "bg-emerald-500" },
  CONDITIONAL: { label: "Conditional", bg: "bg-amber-500/10", text: "text-amber-500", dot: "bg-amber-500" },
  REJECTED: { label: "Rejected", bg: "bg-red-500/10", text: "text-red-500", dot: "bg-red-500" },
};

type Props = {
  status: OfferStatus;
};

export default function DecisionBadge({ status }: Props) {
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
