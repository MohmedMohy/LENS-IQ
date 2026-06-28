import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { applicationsApi } from "@/features/applications/api/Applications";
import type { Application } from "@/types";

type Props = {
  onEvaluate: (applicationId: number) => void;
  onReset: () => void;
  loading: boolean;
};

export default function CustomerSelector({ onEvaluate, onReset, loading }: Props) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loadingApps, setLoadingApps] = useState(true);
  const [appError, setAppError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoadingApps(true);
      setAppError(null);
      try {
        const data = await applicationsApi.getAll();
        if (mounted) setApplications(data);
      } catch {
        if (mounted) setAppError("Could not load applications");
      } finally {
        if (mounted) setLoadingApps(false);
      }
    };
    void load();
    return () => { mounted = false; };
  }, []);

  const handleEvaluate = useCallback(() => {
    if (selectedId == null) return;
    onEvaluate(selectedId);
  }, [selectedId, onEvaluate]);

  return (
    <div className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
        Customer Selector
      </h2>

      {loadingApps && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl" style={{ background: "var(--glass-border)" }} />
          ))}
        </div>
      )}

      {appError && (
        <p className="rounded-xl p-3 text-xs font-medium" style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}>
          {appError}
        </p>
      )}

      {!loadingApps && applications.length === 0 && !appError && (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          No applications found
        </p>
      )}

      {!loadingApps && applications.length > 0 && (
        <div className="max-h-[300px] space-y-2 overflow-y-auto">
          {applications.map((app, idx) => (
            <motion.button
              key={`${app.id}-${idx}`}
              type="button"
              onClick={() => {
                setSelectedId(app.id);
                onReset();
              }}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`w-full rounded-xl border px-4 py-3 text-start transition-all ${
                selectedId === app.id
                  ? "border-indigo-500"
                  : "border-transparent hover:border-[var(--glass-border)]"
              }`}
              style={{
                background: selectedId === app.id ? "rgba(99,102,241,0.08)" : "var(--bg-card)",
              }}
            >
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {app.customer_name}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {app.brand} {app.model} · {Number(app.price).toLocaleString("en-EG")} EGP
              </p>
            </motion.button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={handleEvaluate}
        disabled={selectedId == null || loading}
        className="w-full rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? "Evaluating..." : selectedId ? "Run Evaluation" : "Select Application"}
      </button>
    </div>
  );
}
