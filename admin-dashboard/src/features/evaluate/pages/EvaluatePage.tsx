// src/pages/evaluate/EvaluatePage.tsx

import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/navigation/PageHeader";
import Card from "@/components/ui/card/Card";
import { applicationsApi } from "@/features/applications/api/Applications";
import { evaluateApi } from "@/features/evaluate/api/evaluate.api";
import type { Application } from "@/types";
import type { EvaluateResponse, Offer } from "@/features/evaluate/api/evaluate.api";

// ── helpers ──────────────────────────────────────────────────────────────────

function getStatusStyle(status: Offer["status"]) {
    switch (status) {
        case "APPROVED":
            return {
                badge: "bg-green-100 text-green-800 border-green-200",
                bg: "bg-green-50",
                border: "border-green-200",
                label: "Approved",
            };
        case "CONDITIONAL":
            return {
                badge: "bg-amber-100 text-amber-800 border-amber-200",
                bg: "bg-amber-50",
                border: "border-amber-200",
                label: "Conditional",
            };
        default:
            return {
                badge: "bg-red-100 text-red-800 border-red-200",
                bg: "bg-red-50",
                border: "border-red-200",
                label: "Rejected",
            };
    }
}

function getRiskColor(level: Offer["riskLevel"]) {
    if (level === "LOW") return "text-green-700";
    if (level === "MEDIUM") return "text-amber-700";
    return "text-red-700";
}

// ── sub-components ────────────────────────────────────────────────────────────

function OfferCard({ offer, highlight = false }: { offer: Offer; highlight?: boolean }) {
    const s = getStatusStyle(offer.status);
    return (
        <div
            className={[
                "rounded-xl border p-5 transition",
                s.bg,
                s.border,
                highlight ? "ring-2 ring-blue-500 ring-offset-2" : "",
            ].join(" ")}
        >
            {highlight && (
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-blue-600">
                    Best offer
                </p>
            )}
            <div className="mb-4 flex items-center justify-between">
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${s.badge}`}>
                    {s.label}
                </span>
                <span className="text-xs text-slate-400">Program #{offer.programId}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                    <p className="text-xs text-slate-500">Monthly installment</p>
                    <p className="mt-0.5 font-semibold text-slate-900">
                        {offer.installment > 0
                            ? `${offer.installment.toLocaleString("en-EG", { maximumFractionDigits: 0 })} EGP`
                            : "—"}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-slate-500">Total payment</p>
                    <p className="mt-0.5 font-semibold text-slate-900">
                        {offer.totalPayment > 0
                            ? `${offer.totalPayment.toLocaleString("en-EG", { maximumFractionDigits: 0 })} EGP`
                            : "—"}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-slate-500">Interest rate</p>
                    <p className="mt-0.5 font-semibold text-slate-900">
                        {(offer.interestRate * 100).toFixed(1)}%
                    </p>
                </div>
                <div>
                    <p className="text-xs text-slate-500">Duration</p>
                    <p className="mt-0.5 font-semibold text-slate-900">{offer.months} months</p>
                </div>
                <div>
                    <p className="text-xs text-slate-500">DTI ratio</p>
                    <p className="mt-0.5 font-semibold text-slate-900">{offer.dti.toFixed(1)}%</p>
                </div>
                <div>
                    <p className="text-xs text-slate-500">Risk level</p>
                    <p className={`mt-0.5 font-semibold ${getRiskColor(offer.riskLevel)}`}>
                        {offer.riskLevel.charAt(0) + offer.riskLevel.slice(1).toLowerCase()}
                    </p>
                </div>
            </div>
            {offer.reasons && offer.reasons.length > 0 && (
                <div className="mt-4 space-y-1 border-t border-slate-200 pt-3">
                    {offer.reasons.map((r, i) => (
                        <p key={i} className="text-xs text-slate-600">
                            <span
                                className={`mr-1 font-semibold ${r.impact === "HIGH"
                                        ? "text-red-600"
                                        : r.impact === "MEDIUM"
                                            ? "text-amber-600"
                                            : "text-green-600"
                                    }`}
                            >
                                [{r.impact}]
                            </span>
                            {r.message}
                        </p>
                    ))}
                </div>
            )}
        </div>
    );
}

function ApplicationRow({
    app,
    selected,
    onSelect,
}: {
    app: Application;
    selected: boolean;
    onSelect: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={[
                "w-full rounded-xl border px-5 py-4 text-left transition",
                selected
                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
            ].join(" ")}
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="font-semibold text-slate-900">
                        {app.customer_name}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-500">
                        {app.brand} {app.model} · {app.manufacturing_year} ·{" "}
                        {app.condition}
                    </p>
                </div>
                <div className="text-right shrink-0">
                    <p className="font-semibold text-slate-900">
                        {Number(app.price).toLocaleString("en-EG")} EGP
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                        Down: {Number(app.requested_down_payment).toLocaleString("en-EG")} EGP
                    </p>
                </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600">
                    Salary: {Number(app.salary).toLocaleString("en-EG")} EGP
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600">
                    {app.job_type}
                </span>
                <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-medium ${app.status === "PENDING"
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : app.status === "APPROVED"
                                ? "border-green-200 bg-green-50 text-green-700"
                                : "border-slate-200 bg-slate-50 text-slate-600"
                        }`}
                >
                    {app.status}
                </span>
            </div>
        </button>
    );
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function EvaluatePage() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loadingApps, setLoadingApps] = useState(true);
    const [appsError, setAppsError] = useState<string | null>(null);

    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [result, setResult] = useState<EvaluateResponse | null>(null);
    const [evaluating, setEvaluating] = useState(false);
    const [evalError, setEvalError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        const run = async () => {
            setLoadingApps(true);
            setAppsError(null);
            try {
                const data = await applicationsApi.getAll();
                if (mounted) setApplications(data);
            } catch (err) {
                if (mounted)
                    setAppsError(
                        err instanceof Error ? err.message : "Could not load applications."
                    );
            } finally {
                if (mounted) setLoadingApps(false);
            }
        };
        void run();
        return () => { mounted = false; };
    }, []);

    const run = async () => {
        if (selectedId == null) return;

        setEvaluating(true);
        setEvalError(null);
        setResult(null);

        try {
            const app = applications.find(
                (a) => a.id === selectedId
            );

            if (!app) {
                throw new Error(
                    "Application not found."
                );
            }

            const payload = {
                salary: Number(app.salary),
                price: Number(app.price),
                requested_down_payment: Number(
                    app.requested_down_payment
                ),

                // temporary fallback values
                age: 30,
                current_liabilities: 0,
            };

            const response =
                await evaluateApi.calculate(payload);

            setResult(response);
        } catch (err) {
            setEvalError(
                err instanceof Error
                    ? err.message
                    : "Could not reach the server."
            );
        } finally {
            setEvaluating(false);
        }
    };

    const approved = result?.offers.filter((o) => o.status === "APPROVED") ?? [];
    const conditional = result?.offers.filter((o) => o.status === "CONDITIONAL") ?? [];
    const rejected = result?.offers.filter((o) => o.status === "REJECTED") ?? [];

    const selectedApp = applications.find((a) => a.id === selectedId) ?? null;

    return (
        <Layout>
            <PageHeader
                title="Evaluate"
                description="Select an application and run it through all active financing programs."
            />

            {/* Application picker */}
            <Card className="mb-6">
                <h2 className="mb-4 text-sm font-semibold text-slate-700">
                    Select application
                </h2>

                {loadingApps && (
                    <p className="text-sm text-slate-500">Loading applications...</p>
                )}

                {appsError && (
                    <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                        {appsError}
                    </p>
                )}

                {!loadingApps && applications.length === 0 && !appsError && (
                    <p className="text-sm text-slate-500">
                        No applications found. Create a customer and vehicle first.
                    </p>
                )}

                {!loadingApps && applications.length > 0 && (
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                        {applications.map((app) => (
                            <ApplicationRow
                                key={app.id}
                                app={app}
                                selected={selectedId === app.id}
                                onSelect={() => {
                                    setSelectedId(app.id);
                                    setResult(null);
                                    setEvalError(null);
                                }}
                            />
                        ))}
                    </div>
                )}

                <button
                    type="button"
                    onClick={run}
                    disabled={!selectedId || evaluating}
                    className="mt-5 w-full rounded-xl bg-slate-950 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                    {evaluating
                        ? "Evaluating..."
                        : selectedApp
                            ? `Run evaluation for ${selectedApp.customer_name}`
                            : "Select an application to evaluate"}
                </button>
            </Card>

            {/* Error */}
            {evalError && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {evalError}
                </div>
            )}

            {/* Results */}
            {result && !result.error && (
                <div className="space-y-8">
                    {/* Summary */}
                    <div className="flex flex-wrap gap-3">
                        {[
                            {
                                label: "Approved",
                                count: approved.length,
                                color: "bg-green-100 text-green-800 border-green-200",
                            },
                            {
                                label: "Conditional",
                                count: conditional.length,
                                color: "bg-amber-100 text-amber-800 border-amber-200",
                            },
                            {
                                label: "Rejected",
                                count: rejected.length,
                                color: "bg-red-100 text-red-800 border-red-200",
                            },
                        ].map((item) => (
                            <span
                                key={item.label}
                                className={`rounded-full border px-3 py-1 text-xs font-semibold ${item.color}`}
                            >
                                {item.label}: {item.count}
                            </span>
                        ))}
                    </div>

                    {/* Best offer */}
                    {result.bestOffer && (
                        <section>
                            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                                Best offer
                            </h2>
                            <OfferCard offer={result.bestOffer} highlight />
                        </section>
                    )}

                    {/* Approved */}
                    {approved.length > 0 && (
                        <section>
                            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                                Approved ({approved.length})
                            </h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {approved.map((o, i) => (
                                    <OfferCard key={i} offer={o} />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Conditional */}
                    {conditional.length > 0 && (
                        <section>
                            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                                Conditional ({conditional.length})
                            </h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {conditional.map((o, i) => (
                                    <OfferCard key={i} offer={o} />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Rejected */}
                    {rejected.length > 0 && (
                        <section>
                            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                                Rejected ({rejected.length})
                            </h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {rejected.map((o, i) => (
                                    <OfferCard key={i} offer={o} />
                                ))}
                            </div>
                        </section>
                    )}

                    {result.offers.length === 0 && (
                        <Card>
                            <p className="py-4 text-center text-sm text-slate-500">
                                No offers available for this application profile.
                            </p>
                        </Card>
                    )}

                    {/* Debug */}
                    <details className="rounded-xl border border-slate-200 bg-white">
                        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-slate-600">
                            Raw server response
                        </summary>
                        <pre className="overflow-auto rounded-b-xl bg-slate-900 p-4 text-xs text-green-400">
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </details>
                </div>
            )}
        </Layout>
    );
}