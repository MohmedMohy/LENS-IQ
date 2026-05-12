// src/components/error/ErrorBoundary.tsx
//
// Usage:
//   <ErrorBoundary>
//     <SomeComponent />
//   </ErrorBoundary>
//
//   <ErrorBoundary fallback={<p>Something broke</p>}>
//     <SomeComponent />
//   </ErrorBoundary>
//
//   <ErrorBoundary onError={(err, info) => reportToSentry(err, info)}>
//     <SomeComponent />
//   </ErrorBoundary>

import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
    /** Content to render when everything is fine */
    children: ReactNode;

    /**
     * Custom fallback UI.
     * If omitted, the built-in error card is shown.
     * Can be a ReactNode or a render-prop that receives the error.
     */
    fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);

    /** Called when an error is caught — useful for Sentry / logging */
    onError?: (error: Error, info: ErrorInfo) => void;

    /**
     * Optional key — changing this prop resets the boundary automatically.
     * Useful when you navigate to a new page and want a clean slate.
     */
    resetKey?: string | number;
};

type State = {
    hasError: boolean;
    error: Error | null;
};

// ─── Component ────────────────────────────────────────────────────────────────

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo): void {
        this.props.onError?.(error, info);

        // Always log to console in dev so engineers notice immediately
        if (import.meta.env.DEV) {
            console.error("[ErrorBoundary] Caught error:", error);
            console.error("[ErrorBoundary] Component stack:", info.componentStack);
        }
    }

    // When resetKey changes from outside, reset the boundary
    componentDidUpdate(prevProps: Props): void {
        if (
            this.state.hasError &&
            prevProps.resetKey !== this.props.resetKey
        ) {
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

        // Render-prop fallback
        if (typeof fallback === "function") {
            return fallback(this.state.error, this.reset);
        }

        // Static fallback node
        if (fallback !== undefined) {
            return fallback;
        }

        // ── Built-in fallback UI ───────────────────────────────────────────
        return (
            <DefaultFallback error={this.state.error} onReset={this.reset} />
        );
    }
}

// ─── Default Fallback UI ──────────────────────────────────────────────────────

type FallbackProps = {
    error: Error;
    onReset: () => void;
};

function DefaultFallback({ error, onReset }: FallbackProps) {
    return (
        <div className="flex min-h-[320px] items-center justify-center p-6">
            <div className="w-full max-w-md rounded-2xl border border-red-200 bg-red-50 p-8 shadow-sm">
                {/* Icon */}
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.75}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-6 w-6 text-red-600"
                        aria-hidden="true"
                    >
                        <path d="M12 9v4m0 4h.01" />
                        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    </svg>
                </div>

                {/* Heading */}
                <h2 className="mb-1 text-lg font-bold text-red-900">
                    Something went wrong
                </h2>

                {/* Message */}
                <p className="mb-5 text-sm text-red-700">
                    {error.message || "An unexpected error occurred."}
                </p>

                {/* Stack trace (dev only) */}
                {import.meta.env.DEV && error.stack && (
                    <details className="mb-5">
                        <summary className="cursor-pointer text-xs font-medium text-red-600 hover:underline">
                            Show stack trace
                        </summary>
                        <pre className="mt-2 overflow-auto rounded-lg bg-red-100 p-3 text-[11px] leading-relaxed text-red-800">
                            {error.stack}
                        </pre>
                    </details>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onReset}
                        className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                    >
                        Try again
                    </button>

                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                    >
                        Reload page
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ErrorBoundary;