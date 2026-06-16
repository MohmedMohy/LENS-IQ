// src/pages/banks/BanksPage.tsx

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import Layout from "@/components/layout/Layout";
import DataTable from "@/components/data-display/DataTable";
import PageHeader from "@/components/navigation/PageHeader";
import Card from "@/components/ui/card/Card";
import { banksApi } from "@/features/banks/api/banks.api";
import { queryKeys } from "@/lib/Querykeys";
import { bankSchema } from "@/lib/schemas";
import type { BankFormValues } from "@/lib/schemas";
import type { Bank } from "@/types";

// ── Reusable field error ──────────────────────────────────────────────────────
function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

export default function BanksPage() {
    const queryClient = useQueryClient();

    // ── Server state ──────────────────────────────────────────────────────────
    const { data: banks = [], isLoading, error } = useQuery({
        queryKey: queryKeys.banks,
        queryFn: banksApi.getAll,
    });

    // ── Create form ───────────────────────────────────────────────────────────
    const createForm = useForm<BankFormValues>({
        resolver: zodResolver(bankSchema),
        defaultValues: { name: "", code: "", logo_url: "", active: true },
    });

    // ── Edit modal ────────────────────────────────────────────────────────────
    const [editingBank, setEditingBank] = useState<Bank | null>(null);

    const editForm = useForm<BankFormValues>({
        resolver: zodResolver(bankSchema),
    });

    // ── Invalidation ──────────────────────────────────────────────────────────
    const invalidate = () =>
        queryClient.invalidateQueries({ queryKey: queryKeys.banks });

    // ── Mutations ─────────────────────────────────────────────────────────────
    const createMutation = useMutation({
        mutationFn: banksApi.create,
        onSuccess: () => {
            createForm.reset();
            void invalidate();
            toast.success("Bank added successfully.");
        },
        onError: () => toast.error("Could not add bank."),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: BankFormValues }) =>
            banksApi.update(id, payload),
        onSuccess: () => {
            closeEdit();
            void invalidate();
            toast.success("Bank updated successfully.");
        },
        onError: () => toast.error("Could not update bank."),
    });

    const deleteMutation = useMutation({
        mutationFn: (bank: Bank) => banksApi.remove(bank.id),
        onSuccess: (_data, bank) => {
            void invalidate();
            toast.success(`"${bank.name}" deleted.`);
        },
        onError: () => toast.error("Could not delete bank."),
    });

    // ── Handlers ──────────────────────────────────────────────────────────────
    const openEdit = (bank: Bank) => {
        setEditingBank(bank);
        editForm.reset({
            name: bank.name,
            code: bank.code,
            logo_url: bank.logo_url ?? "",
            active: bank.active ?? true,
        });
    };

    const closeEdit = () => {
        setEditingBank(null);
        editForm.reset();
    };

    // ── RENDER ────────────────────────────────────────────────────────────────
    return (
        <Layout>
            <PageHeader
                title="Banks"
                description="Manage financing banks and configurations."
            />

            {/* ── Create form ── */}
            <Card className="mb-6">
                <form
                    onSubmit={createForm.handleSubmit((data) => createMutation.mutate(data))}
                    className="flex flex-wrap items-start gap-4"
                >
                    {/* Name */}
                    <div className="flex min-w-[220px] flex-1 flex-col gap-1">
                        <label className="text-sm font-semibold text-slate-700">Bank Name</label>
                        <input
                            {...createForm.register("name")}
                            placeholder="National Bank"
                            className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
                        />
                        <FieldError message={createForm.formState.errors.name?.message} />
                    </div>

                    {/* Code */}
                    <div className="flex min-w-[180px] flex-1 flex-col gap-1">
                        <label className="text-sm font-semibold text-slate-700">Bank Code</label>
                        <input
                            {...createForm.register("code")}
                            placeholder="NBE"
                            className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
                        />
                        <FieldError message={createForm.formState.errors.code?.message} />
                    </div>

                    {/* Logo URL */}
                    <div className="flex min-w-[260px] flex-1 flex-col gap-1">
                        <label className="text-sm font-semibold text-slate-700">Logo URL</label>
                        <input
                            {...createForm.register("logo_url")}
                            placeholder="https://example.com/logo.png"
                            className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
                        />
                        <FieldError message={createForm.formState.errors.logo_url?.message} />
                    </div>

                    {/* Active */}
                    <label className="flex items-center gap-2 pt-8 text-sm font-semibold text-slate-700">
                        <input
                            type="checkbox"
                            {...createForm.register("active")}
                            className="h-4 w-4"
                        />
                        Active
                    </label>

                    <button
                        type="submit"
                        disabled={createMutation.isPending}
                        className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                        {createMutation.isPending ? "Saving..." : "Add Bank"}
                    </button>
                </form>
            </Card>

            {/* Load error */}
            {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {(error as Error).message}
                </div>
            )}

            {/* Loading */}
            {isLoading && (
                <Card><p className="text-sm text-slate-500">Loading banks...</p></Card>
            )}

            {/* Table */}
            {!isLoading && (
                <Card>
                    <DataTable<Bank>
                        data={banks}
                        columns={[
                            { key: "id", label: "ID" },
                            { key: "name", label: "Name" },
                            { key: "code", label: "Code" },
                            { key: "active", label: "Active" },
                        ]}
                        onEdit={openEdit}
                        onDelete={(bank) => deleteMutation.mutate(bank)}
                    />
                </Card>
            )}

            {/* ── Edit modal ── */}
            {editingBank && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <h2 className="mb-1 text-xl font-bold text-slate-900">Edit Bank</h2>
                        <p className="mb-6 text-sm text-slate-500">Update bank information and settings.</p>

                        <form
                            onSubmit={editForm.handleSubmit((data) =>
                                updateMutation.mutate({ id: editingBank.id, payload: data })
                            )}
                            className="flex flex-col gap-4"
                        >
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-semibold text-slate-700">Bank Name</label>
                                <input
                                    {...editForm.register("name")}
                                    className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
                                />
                                <FieldError message={editForm.formState.errors.name?.message} />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-semibold text-slate-700">Bank Code</label>
                                <input
                                    {...editForm.register("code")}
                                    className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
                                />
                                <FieldError message={editForm.formState.errors.code?.message} />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-semibold text-slate-700">Logo URL</label>
                                <input
                                    {...editForm.register("logo_url")}
                                    placeholder="https://example.com/logo.png"
                                    className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
                                />
                                <FieldError message={editForm.formState.errors.logo_url?.message} />
                            </div>

                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <input
                                    type="checkbox"
                                    {...editForm.register("active")}
                                    className="h-4 w-4"
                                />
                                Active
                            </label>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeEdit}
                                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updateMutation.isPending}
                                    className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                                >
                                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}