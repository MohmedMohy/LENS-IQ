import { useState, useCallback, useRef } from "react";
import { evaluateApi } from "@/features/evaluate/api/evaluate.api";
import type { WidgetState } from "@/features/widget/types/widget";
import { generateMockEvaluation } from "@/features/widget/lib/mock-data";

export function useEvaluation() {
  const [state, setState] = useState<WidgetState>({
    status: "idle",
    result: null,
    error: null,
    executionTimeMs: null,
  });
  const startRef = useRef(0);

  const evaluate = useCallback(async (applicationId: number) => {
    setState({ status: "loading", result: null, error: null, executionTimeMs: null });
    startRef.current = performance.now();

    try {
      const result = await evaluateApi.evaluate({ application_id: applicationId });
      const elapsed = Math.round(performance.now() - startRef.current);
      setState({ status: "success", result, error: null, executionTimeMs: elapsed });
    } catch (err) {
      const elapsed = Math.round(performance.now() - startRef.current);
      const message = err instanceof Error ? err.message : "Evaluation failed";
      setState({ status: "error", result: null, error: message, executionTimeMs: elapsed });
    }
  }, []);

  const useMock = useCallback(() => {
    const result = generateMockEvaluation();
    setState({ status: "success", result, error: null, executionTimeMs: 0 });
  }, []);

  const reset = useCallback(() => {
    setState({ status: "idle", result: null, error: null, executionTimeMs: null });
  }, []);

  const retry = useCallback(() => {
    if (state.status !== "error") return;
    setState({ status: "idle", result: null, error: null, executionTimeMs: null });
  }, [state.status]);

  return { state, evaluate, useMock, reset, retry };
}
