import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/navigation/PageHeader";
import Card from "@/components/ui/card/Card";
import { TableSkeleton } from "@/components/ui/skeleton";
import { auditApi } from "@/features/audit/api/audit.api";
import { queryKeys } from "@/lib/Querykeys";
import type { AuditLog } from "@/types";

function formatTimestamp(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });
}

function formatAction(action: string): string {
    return action
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AuditPage() {
    const { t } = useTranslation();
    const [page, setPage] = useState(1);

    const { data, isLoading, error } = useQuery({
        queryKey: [...queryKeys.audit, page],
        queryFn: () => auditApi.getLogs(page),
    });

    const logs = data?.logs ?? [];
    const pagination = data?.pagination;

    return (
        <Layout>
            <PageHeader
                title={t("audit.title")}
                description={t("audit.description")}
            />

            {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {t("audit.failedToLoad")}
                </div>
            )}

            {isLoading && (
                <Card><TableSkeleton /></Card>
            )}

            {!isLoading && (
                <Card>
                    {logs.length === 0 ? (
                        <p className="rounded-md border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                            {t("audit.noLogs")}
                        </p>
                    ) : (
                        <>
                            <div className="overflow-x-auto rounded-lg border border-slate-200">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-500">{t("audit.timestamp")}</th>
                                            <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-500">{t("audit.employee")}</th>
                                            <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-500">{t("audit.action")}</th>
                                            <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-500">{t("audit.entity")}</th>
                                            <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-500">{t("audit.entityId")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {logs.map((log: AuditLog) => (
                                            <tr key={log.id} className="transition hover:bg-slate-50">
                                                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                                                    {formatTimestamp(log.created_at)}
                                                </td>
                                                <td className="px-4 py-3 text-slate-700">
                                                    {log.user_name || log.user_email || "—"}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                                                        {formatAction(log.action)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-slate-700 capitalize">{log.entity}</td>
                                                <td className="px-4 py-3 text-slate-600">{log.entity_id ?? "—"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {pagination && pagination.totalPages > 1 && (
                                <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                                    <span>
                                        {t("audit.title")} {pagination.page} / {pagination.totalPages} ({pagination.total})
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            disabled={page <= 1}
                                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                                            className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium disabled:opacity-40"
                                        >
                                            {t("common.prev")}
                                        </button>
                                        <span className="text-xs text-slate-400">
                                            {pagination.page} / {pagination.totalPages}
                                        </span>
                                        <button
                                            type="button"
                                            disabled={page >= pagination.totalPages}
                                            onClick={() => setPage((p) => p + 1)}
                                            className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium disabled:opacity-40"
                                        >
                                            {t("common.next")}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </Card>
            )}
        </Layout>
    );
}
