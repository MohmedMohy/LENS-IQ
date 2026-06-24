// src/app/providers.tsx

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import type { ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/feedback/ErrorBoundary";
import { DirectionProvider } from "@/i18n/DirectionProvider";

type AppProvidersProps = {
    children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        retry: 1,
                        refetchOnWindowFocus: false,
                        staleTime: 30_000,
                    },
                    mutations: {
                        retry: 0,
                    },
                },
            })
    );

    return (
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <DirectionProvider>
                        {children}
                    </DirectionProvider>
                    <Toaster
                        position="bottom-left"
                        richColors
                        closeButton
                        duration={3000}
                    />
                </BrowserRouter>
            </QueryClientProvider>
        </ErrorBoundary>
    );
}