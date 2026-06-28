import { useCallback } from "react";
import LayoutSidebar from "@/components/layout/Layout";
import PageHeader from "@/components/navigation/PageHeader";
import { useAuthStore } from "@/store/auth.store";
import { useEvaluation } from "@/features/widget/hooks/useEvaluation";
import CustomerSelector from "@/features/widget/components/CustomerSelector";
import WidgetCard from "@/features/widget/components/WidgetCard";
import DeveloperPanel from "@/features/widget/components/DeveloperPanel";

export default function WidgetPreview() {
  const role = useAuthStore((s) => s.tenant?.role);
  const { state, evaluate, useMock, reset } = useEvaluation();

  const handleEvaluate = useCallback(
    (applicationId: number) => {
      void evaluate(applicationId);
    },
    [evaluate]
  );

  if (role !== "ADMIN") {
    return (
      <LayoutSidebar>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-4xl font-bold" style={{ color: "var(--text-muted)" }}>403</p>
          <p className="mt-2 text-lg font-semibold" style={{ color: "var(--text-secondary)" }}>
            You are not authorized.
          </p>
        </div>
      </LayoutSidebar>
    );
  }

  return (
    <LayoutSidebar>
      <PageHeader
        title="Lens IQ Widget Preview"
        description="This page simulates the embeddable widget."
      />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr_320px]">
        <div>
          <div
            className="rounded-xl p-4"
            style={{ background: "var(--bg-card)", border: "1px solid var(--glass-border)" }}
          >
            <CustomerSelector
              onEvaluate={handleEvaluate}
              onReset={reset}
              loading={state.status === "loading"}
            />
          </div>
        </div>

        <div className="flex justify-center">
          <WidgetCard
            state={state}
            onRetry={reset}
            onMock={useMock}
          />
        </div>

        <div>
          <div
            className="rounded-xl"
            style={{ background: "var(--bg-card)", border: "1px solid var(--glass-border)" }}
          >
            <div className="border-b px-4 py-3" style={{ borderColor: "var(--glass-border)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Developer Mode
              </p>
            </div>
            <DeveloperPanel
              result={state.result}
              executionTimeMs={state.executionTimeMs}
              lastPayload={null}
            />
          </div>
        </div>
      </div>
    </LayoutSidebar>
  );
}
