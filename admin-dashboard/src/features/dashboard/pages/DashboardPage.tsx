// src/pages/dashboard/DashboardPage.tsx

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/navigation/PageHeader";
import Card from "@/components/ui/card/Card";
import { banksApi } from "@/features/banks/api/banks.api";
import { programsApi } from "@/features/programs/api/programs.api";
import { rulesApi } from "@/features/rules/api/rules.api";
import { queryKeys } from "@/lib/Querykeys";
import { useAuthStore } from "@/store/auth.store";
import { routePaths } from "@/router/route-paths";
import type { Program } from "@/types";

export default function DashboardPage() {
    const tenant = useAuthStore((state) => state.tenant);
    const navigate = useNavigate();

    // ── Queries — share cache with the rest of the app ────────────────────────
    const { data: banks = [], isLoading: loadingBanks } = useQuery({
        queryKey: queryKeys.banks,
        queryFn: banksApi.getAll,
    });

    const { data: programs = [], isLoading: loadingPrograms } = useQuery({
        queryKey: queryKeys.programs,
        queryFn: programsApi.getAll,
    });

    const { data: rules = [], isLoading: loadingRules } = useQuery({
        queryKey: queryKeys.rules.all,
        queryFn: () =>
            Promise.all(programs.map((p: Program) => rulesApi.getAllByProgram(p.id)))
                .then((res) => res.flat()),
        enabled: programs.length > 0,
    });

    const isLoading = loadingBanks || loadingPrograms || loadingRules;

    // ── Stat cards ────────────────────────────────────────────────────────────
    const statCards = useMemo(
        () => [
            {
                label: "Banks",
                value: banks.length,
                description: "Active banks in the system",
                path: routePaths.banks,
            },
            {
                label: "Programs",
                value: programs.length,
                description: "Financing programs available",
                path: routePaths.programs,
            },
            {
                label: "Rules",
                value: rules.length,
                description: "Decision rules configured",
                path: routePaths.rules,
            },
        ],
        [banks.length, programs.length, rules.length]
    );

    // ── RENDER ────────────────────────────────────────────────────────────────
    return (
        <Layout>
            <PageHeader
                title="Dashboard"
                description="Overview of financing operations and system activity."
            />

            {/* Welcome card */}
            {tenant && (
                <Card className="mb-6">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">Welcome back</p>
                            <h2 className="text-2xl font-bold text-slate-900">{tenant.name}</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                            <span className="text-sm font-medium text-slate-600">System Online</span>
                        </div>
                    </div>
                </Card>
            )}

            {/* Stat grid */}
            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
                    ))}
                </div>
            ) : (
                <>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {statCards.map((card) => (
                            <button key={card.label} type="button"
                                onClick={() => navigate(card.path)} className="text-left">
                                <Card className="h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-slate-500">{card.label}</p>
                                            <h3 className="mt-3 text-4xl font-bold text-slate-900">{card.value}</h3>
                                        </div>
                                        <div className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
                                            LIVE
                                        </div>
                                    </div>
                                    <p className="mt-5 text-sm text-slate-500">{card.description}</p>
                                </Card>
                            </button>
                        ))}
                    </div>

                    {/* Quick actions */}
                    <div className="mt-8">
                        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                            Quick Actions
                        </h2>
                        <div className="grid gap-4 md:grid-cols-2">
                            <button type="button" onClick={() => navigate(routePaths.evaluate)} className="text-left">
                                <Card className="transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
                                    <h3 className="text-lg font-semibold text-slate-900">Run Evaluation</h3>
                                    <p className="mt-2 text-sm text-slate-500">
                                        Test customer profiles against financing programs and rule engine.
                                    </p>
                                </Card>
                            </button>
                            <button type="button" onClick={() => navigate(routePaths.banks)} className="text-left">
                                <Card className="transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
                                    <h3 className="text-lg font-semibold text-slate-900">Manage Banks</h3>
                                    <p className="mt-2 text-sm text-slate-500">
                                        Add, update, or remove financing banks and system configurations.
                                    </p>
                                </Card>
                            </button>
                        </div>
                    </div>

                    {/* System status */}
                    <div className="mt-8">
                        <Card>
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900">System Status</h3>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Financing decision engine is operating normally.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                                    <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                                    API Connected
                                </div>
                            </div>
                        </Card>
                    </div>
                </>
            )}
        </Layout>
    );
}