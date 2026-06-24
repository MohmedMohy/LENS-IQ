import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export type Column<T> = {
    key: Extract<keyof T, string>;
    label: string;
    sortable?: boolean;
    render?: (value: unknown, row: T) => React.ReactNode;
};

type Props<T> = {
    data: T[];
    columns: Column<T>[];
    onEdit?: (item: T) => void;
    onDelete?: (item: T) => void;
    pageSize?: number;
};

function formatValue(value: unknown, t: (key: string) => string): string {
    if (value === null || value === undefined) return "—";
    if (typeof value === "boolean") return value ? t("common.yes") : t("common.no");
    if (typeof value === "number") return value.toLocaleString();
    return String(value);
}

export default function DataTable<T extends { id: string | number }>({
    data,
    columns,
    onEdit,
    onDelete,
    pageSize = 10,
}: Props<T>) {
    const { t } = useTranslation();
    const [pendingDelete, setPendingDelete] = useState<T | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        if (!search) return data;
        const q = search.toLowerCase();
        return data.filter((row) =>
            columns.some((c) => {
                const v = row[c.key];
                return v != null && String(v).toLowerCase().includes(q);
            })
        );
    }, [data, columns, search]);

    const sorted = useMemo(() => {
        if (!sortKey) return filtered;
        return [...filtered].sort((a, b) => {
            const aVal = a[sortKey as keyof T];
            const bVal = b[sortKey as keyof T];
            if (aVal == null) return 1;
            if (bVal == null) return -1;
            const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            return sortDir === "asc" ? cmp : -cmp;
        });
    }, [filtered, sortKey, sortDir]);

    const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
    const safePage = Math.min(currentPage, totalPages);
    const paginated = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
    };

    const handleConfirmDelete = () => {
        if (pendingDelete) {
            onDelete?.(pendingDelete);
            setPendingDelete(null);
        }
    };

    const hasActions = onEdit !== undefined || onDelete !== undefined;

    return (
        <>
            <ConfirmDialog
                open={!!pendingDelete}
                title={t("common.confirmDelete")}
                message={t("common.confirmDeleteMsg")}
                confirmLabel={t("common.delete")}
                cancelLabel={t("common.cancel")}
                onConfirm={handleConfirmDelete}
                onCancel={() => setPendingDelete(null)}
                destructive
            />

            {data.length > 0 && (
                <div className="mb-3">
                    <input
                        type="text"
                        placeholder={t("common.search")}
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full max-w-xs rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>
            )}

            {sorted.length === 0 ? (
                <p className="rounded-md border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                    {search ? t("common.noResults") : t("common.noData")}
                </p>
            ) : (
                <>
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50">
                                <tr>
                                    {columns.map((c) => (
                                        <th
                                            key={c.key}
                                            onClick={() => c.sortable !== false && handleSort(c.key)}
                                            className={`px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-slate-500 ${
                                                c.sortable !== false ? "cursor-pointer select-none hover:text-slate-700" : ""
                                            }`}
                                        >
                                            {c.label}
                                            {sortKey === c.key && (
                                                <span className="ms-1">{sortDir === "asc" ? "\u25B2" : "\u25BC"}</span>
                                            )}
                                        </th>
                                    ))}
                                    {hasActions && (
                                        <th className="px-4 py-3 text-end text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            {t("common.actions")}
                                        </th>
                                    )}
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100 bg-white">
                                {paginated.map((row) => (
                                    <tr key={row.id} className="transition hover:bg-slate-50">
                                        {columns.map((c) => (
                                            <td key={c.key} className="px-4 py-3 text-slate-700">
                                                {c.render ? c.render(row[c.key], row) : formatValue(row[c.key], t)}
                                            </td>
                                        ))}

                                        {hasActions && (
                                            <td className="px-4 py-3 text-end">
                                                <div className="flex justify-end gap-2">
                                                    {onEdit && (
                                                        <button
                                                            type="button"
                                                            onClick={() => onEdit(row)}
                                                            className="rounded-md px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                                                        >
                                                            {t("common.edit")}
                                                        </button>
                                                    )}
                                                    {onDelete && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setPendingDelete(row)}
                                                            className="rounded-md px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                                                        >
                                                            {t("common.delete")}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                        <span>
                            {sorted.length} {sorted.length !== 1 ? t("common.results_plural") : t("common.results")}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={safePage <= 1}
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium disabled:opacity-40"
                            >
                                {t("common.prev")}
                            </button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                const start = Math.max(1, Math.min(safePage - 2, totalPages - 4));
                                const page = start + i;
                                if (page > totalPages) return null;
                                return (
                                    <button
                                        key={page}
                                        type="button"
                                        onClick={() => setCurrentPage(page)}
                                        className={`rounded-md px-3 py-1 text-xs font-medium ${
                                            page === safePage
                                                ? "bg-blue-600 text-white"
                                                : "border border-slate-300 hover:bg-slate-50"
                                        }`}
                                    >
                                        {page}
                                    </button>
                                );
                            })}
                            <button
                                type="button"
                                disabled={safePage >= totalPages}
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium disabled:opacity-40"
                            >
                                {t("common.next")}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
