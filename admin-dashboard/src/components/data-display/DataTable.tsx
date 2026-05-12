import { useState } from "react";

export type Column<T> = {
    key: Extract<keyof T, string>;
    label: string;
};

type Props<T> = {
    data: T[];
    columns: Column<T>[];
    onEdit?: (item: T) => void;
    onDelete?: (item: T) => void;
};

function formatValue(value: unknown): string {
    if (value === null || value === undefined) return "—";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "number") return value.toLocaleString();
    return String(value);
}

export default function DataTable<T extends { id: string | number }>({
    data,
    columns,
    onEdit,
    onDelete,
}: Props<T>) {
    const [pendingDelete, setPendingDelete] = useState<T | null>(null);

    const handleConfirm = () => {
        if (pendingDelete) {
            onDelete?.(pendingDelete);
            setPendingDelete(null);
        }
    };

    const hasActions = onEdit !== undefined || onDelete !== undefined;

    return (
        <>
            {/* Confirmation Dialog */}
            {pendingDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
                        <h2 className="mb-2 text-lg font-bold text-slate-900">
                            Confirm Delete
                        </h2>
                        <p className="mb-6 text-sm text-slate-600">
                            Are you sure you want to delete this item? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setPendingDelete(null)}
                                className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {data.length === 0 ? (
                <p className="rounded-md border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                    No data available.
                </p>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                {columns.map((c) => (
                                    <th
                                        key={c.key}
                                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                                    >
                                        {c.label}
                                    </th>
                                ))}
                                {hasActions && (
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Actions
                                    </th>
                                )}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 bg-white">
                            {data.map((row) => (
                                <tr key={row.id} className="transition hover:bg-slate-50">
                                    {columns.map((c) => (
                                        <td key={c.key} className="px-4 py-3 text-slate-700">
                                            {formatValue(row[c.key])}
                                        </td>
                                    ))}

                                    {hasActions && (
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                {onEdit && (
                                                    <button
                                                        type="button"
                                                        onClick={() => onEdit(row)}
                                                        className="rounded-md px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                                                    >
                                                        Edit
                                                    </button>
                                                )}
                                                {onDelete && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setPendingDelete(row)}
                                                        className="rounded-md px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                                                    >
                                                        Delete
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
            )}
        </>
    );
}