import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { t } from "i18next";

type Props = {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onError?: (error: Error, info: ErrorInfo) => void;
  resetKey?: string | number;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info);
    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary] Caught error:", error);
      console.error("[ErrorBoundary] Component stack:", info.componentStack);
    }
  }

  componentDidUpdate(prevProps: Props): void {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.reset();
    }
  }

  reset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (!this.state.hasError || !this.state.error) {
      return this.props.children;
    }

    const { fallback } = this.props;
    if (typeof fallback === "function") {
      return fallback(this.state.error, this.reset);
    }
    if (fallback !== undefined) {
      return fallback;
    }

    return <DefaultFallback error={this.state.error} onReset={this.reset} />;
  }
}

type FallbackProps = {
  error: Error;
  onReset: () => void;
};

function DefaultFallback({ error, onReset }: FallbackProps) {
  return (
    <div className="flex min-h-[320px] items-center justify-center p-6" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-md rounded-2xl p-8" style={{ background: "var(--bg-card)", backdropFilter: "blur(24px)", border: "1px solid rgba(239,68,68,0.2)", boxShadow: "var(--glass-shadow-lg)" }}>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "rgba(239,68,68,0.1)" }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" style={{ color: "var(--error)" }} aria-hidden="true">
            <path d="M12 9v4m0 4h.01" />
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          </svg>
        </div>
        <h2 className="mb-1 text-lg font-bold" style={{ color: "var(--error-light)" }}>{t("common.somethingWentWrong")}</h2>
        <p className="mb-5 text-sm" style={{ color: "var(--text-secondary)" }}>{error.message || t("errors.unknownError")}</p>
        {import.meta.env.DEV && error.stack && (
          <details className="mb-5">
            <summary className="cursor-pointer text-xs font-medium hover:underline" style={{ color: "var(--error-light)" }}>{t("common.showStackTrace")}</summary>
            <pre className="mt-2 overflow-auto rounded-xl p-3 text-[11px] leading-relaxed" style={{ background: "rgba(0,0,0,0.3)", color: "#34D399" }}>{error.stack}</pre>
          </details>
        )}
        <div className="flex gap-3">
          <button type="button" onClick={onReset} className="glass-btn rounded-xl px-4 py-2 text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg, var(--error), #DC2626)" }}>{t("common.retry")}</button>
          <button type="button" onClick={() => window.location.reload()} className="glass-btn glass-btn-secondary rounded-xl px-4 py-2 text-sm font-medium">{t("common.reload")}</button>
        </div>
      </div>
    </div>
  );
}

export default ErrorBoundary;
