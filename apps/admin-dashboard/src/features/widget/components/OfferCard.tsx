import type { Offer } from "@/types";
import DecisionBadge from "./DecisionBadge";
import ReasonList from "./ReasonList";

type Props = {
  offer: Offer;
  isBest?: boolean;
};

function formatCurrency(value: number): string {
  return value.toLocaleString("en-EG", { maximumFractionDigits: 0 });
}

export default function OfferCard({ offer, isBest }: Props) {
  return (
    <div
      className="rounded-xl border p-4 text-sm"
      style={{
        background: isBest ? "rgba(16,185,129,0.04)" : "var(--bg-card)",
        borderColor: isBest ? "rgba(16,185,129,0.25)" : "var(--glass-border)",
      }}
    >
      {isBest && (
        <span className="mb-2 inline-block rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-500">
          Best Offer
        </span>
      )}

      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
            {offer.bankName ?? `Bank #${offer.bankId}`}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {offer.programName ?? `Program #${offer.programId}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DecisionBadge status={offer.status} />
        </div>
      </div>

      <div className="mb-3">
        <p className="text-lg font-bold" style={{ color: "var(--primary-light)" }}>
          {formatCurrency(offer.installment)} <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>EGP/mo</span>
        </p>
      </div>

      <div className="mb-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
        <div>
          <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Down</span>
          <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{formatCurrency(offer.downPayment)} EGP</p>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Amount</span>
          <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{formatCurrency(offer.financeAmount)} EGP</p>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Interest</span>
          <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{offer.interestRate.toFixed(1)}%</p>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Tenor</span>
          <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{offer.months} months</p>
        </div>
      </div>

      {offer.reasons.length > 0 && (
        <div className="border-t pt-2" style={{ borderColor: "var(--glass-border)" }}>
          <ReasonList reasons={offer.reasons} />
        </div>
      )}
    </div>
  );
}
