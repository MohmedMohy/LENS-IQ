// src/components/error/withErrorBoundary.tsx
//
// HOC that wraps any component with an ErrorBoundary.
//
// Usage:
//   const SafeChart = withErrorBoundary(Chart);
//   const SafeChart = withErrorBoundary(Chart, { fallback: <p>Chart failed</p> });

import type { ComponentType } from "react";
import { ErrorBoundary } from "./ErrorBoundary";
import type { ComponentProps } from "react";

type BoundaryOptions = Omit<ComponentProps<typeof ErrorBoundary>, "children">;

export function withErrorBoundary<P extends object>(
    WrappedComponent: ComponentType<P>,
    options: BoundaryOptions = {}
): ComponentType<P> {
    const displayName =
        WrappedComponent.displayName ?? WrappedComponent.name ?? "Component";

    function WithBoundary(props: P) {
        return (
            <ErrorBoundary {...options}>
                <WrappedComponent {...props} />
            </ErrorBoundary>
        );
    }

    WithBoundary.displayName = `withErrorBoundary(${displayName})`;
    return WithBoundary;
}