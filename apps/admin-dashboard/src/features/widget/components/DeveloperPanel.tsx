import { useState } from "react";
import type { EvaluateResponse } from "@/types";

type Props = {
  result: EvaluateResponse | null;
  executionTimeMs: number | null;
  lastPayload: Record<string, unknown> | null;
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span>
      <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{value}</span>
    </div>
  );
}

function Section({ title, children, defaultOpen }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className="border-b" style={{ borderColor: "var(--glass-border)" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider transition-colors hover:opacity-80"
        style={{ color: "var(--text-secondary)" }}
      >
        {title}
        <span className={`transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}

export default function DeveloperPanel({ result, executionTimeMs, lastPayload }: Props) {
  if (!result && !lastPayload) {
    return (
      <div className="flex items-center justify-center p-6 text-xs" style={{ color: "var(--text-muted)" }}>
        Run an evaluation to see developer data
      </div>
    );
  }

  const best = result?.bestOffer;

  return (
    <div className="divide-y-0 overflow-hidden rounded-xl" style={{ border: "1px solid var(--glass-border)", background: "var(--bg-card)" }}>
      <Section title="Request Payload" defaultOpen>
        <pre className="overflow-x-auto text-[10px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {JSON.stringify(lastPayload ?? {}, null, 2)}
        </pre>
      </Section>

      <Section title="Response">
        <pre className="overflow-x-auto text-[10px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      </Section>

      <Section title="Timing" defaultOpen>
        <InfoRow label="Execution Time" value={executionTimeMs != null ? `${executionTimeMs}ms` : "—"} />
      </Section>

      {best && (
        <Section title="Decision Data" defaultOpen>
          <InfoRow label="Decision" value={best.status} />
          <InfoRow label="Risk Score" value={`${best.riskScore}%`} />
          <InfoRow label="Risk Level" value={best.riskLevel} />
          <InfoRow label="DTI" value={`${best.dti}%`} />
          <InfoRow label="Affordability" value={`${best.affordabilityScore}%`} />
          {best.approvalProbability != null && (
            <InfoRow label="Probability" value={`${best.approvalProbability}%`} />
          )}
        </Section>
      )}
    </div>
  );
}
