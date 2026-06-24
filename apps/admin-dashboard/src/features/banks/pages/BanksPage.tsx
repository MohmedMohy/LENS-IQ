import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import Layout from "@/components/layout/Layout";
import DataTable from "@/components/data-display/DataTable";
import PageHeader from "@/components/navigation/PageHeader";
import Card from "@/components/ui/card/Card";
import { TableSkeleton } from "@/components/ui/skeleton";
import { banksApi } from "@/features/banks/api/banks.api";
import { queryKeys } from "@/lib/Querykeys";
import { useAuthStore } from "@/store/auth.store";
import { bankSchema } from "@/lib/schemas";
import type { BankFormValues } from "@/lib/schemas";
import type { Bank } from "@/types";

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

export default function BanksPage() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const tenant = useAuthStore((s) => s.tenant);
    const isWriteRole = tenant?.role === "ADMIN" || tenant?.role === "MANAGER";

    const { data: banks = [], isLoading, error } = useQuery({
        queryKey: queryKeys.banks,
        queryFn: banksApi.getAll,
    });

    const createForm = useForm<BankFormValues>({
        resolver: zodResolver(bankSchema),
        defaultValues: { name: "", code: "", logo_url: "", active: true },
    });

    const [editingBank, setEditingBank] = useState<Bank | null>(null);

    const editForm = useForm<BankFormValues>({
        resolver: zodResolver(bankSchema),
    });

    const invalidate = () =>
        queryClient.invalidateQueries({ queryKey: queryKeys.banks });

    const createMutation = useMutation({
        mutationFn: banksApi.create,
        onSuccess: () => {
            createForm.reset();
            void invalidate();
            toast.success(t("toasts.created"));
        },
        onError: () => toast.error(t("toasts.failed")),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: BankFormValues }) =>
            banksApi.update(id, payload),
        onSuccess: () => {
            closeEdit();
            void invalidate();
            toast.success(t("toasts.updated"));
        },
        onError: () => toast.error(t("toasts.failed")),
    });

    const deleteMutation = useMutation({
        mutationFn: (bank: Bank) => banksApi.remove(bank.id),
        onSuccess: () => {
            void invalidate();
            toast.success(t("toasts.deleted"));
        },
        onError: () => toast.error(t("toasts.failed")),
    });

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

    return (
        <Layout>
            <PageHeader
                title={t("banks.title")}
                description={t("banks.description")}
            />

            {isWriteRole && (
                <Card className="mb-6">
                    <form
                        onSubmit={createForm.handleSubmit((data) => createMutation.mutate(data))}
                        className="flex flex-wrap items-start gap-4"
                    >
                        <div className="flex min-w-[220px] flex-1 flex-col gap-1">
                            <label className="text-sm font-semibold text-slate-700">{t("banks.bankName")}</label>
                            <input
                                {...createForm.register("name")}
                                placeholder="National Bank"
                                className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
                            />
                            <FieldError message={createForm.formState.errors.name?.message} />
                        </div>

                        <div className="flex min-w-[180px] flex-1 flex-col gap-1">
                            <label className="text-sm font-semibold text-slate-700">{t("banks.bankCode")}</label>
                            <input
                                {...createForm.register("code")}
                                placeholder="NBE"
                                className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
                            />
                            <FieldError message={createForm.formState.errors.code?.message} />
                        </div>

                        <div className="flex min-w-[260px] flex-1 flex-col gap-1">
                            <label className="text-sm font-semibold text-slate-700">{t("banks.logoUrl")}</label>
                            <input
                                {...createForm.register("logo_url")}
                                placeholder="https://example.com/logo.png"
                                className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
                            />
                            <FieldError message={createForm.formState.errors.logo_url?.message} />
                        </div>

                        <label className="flex items-center gap-2 pt-8 text-sm font-semibold text-slate-700">
                            <input
                                type="checkbox"
                                {...createForm.register("active")}
                                className="h-4 w-4"
                            />
                            {t("common.active")}
                        </label>

                        <button
                            type="submit"
                            disabled={createMutation.isPending}
                            className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                            {createMutation.isPending ? t("common.saving") : t("banks.addBank")}
                        </button>
                    </form>
                </Card>
            )}

            {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {(error as Error).message}
                </div>
            )}

            {isLoading && (
                <Card><TableSkeleton /></Card>
            )}

            {!isLoading && (
                <Card>
                    <DataTable<Bank>
                        data={banks}
                        columns={[
                            { key: "id", label: t("common.id") },
                            { key: "name", label: t("common.name") },
                            { key: "code", label: t("common.code") },
                            { key: "active", label: t("common.active") },
                        ]}
                        onEdit={isWriteRole ? openEdit : undefined}
                        onDelete={isWriteRole ? (bank) => deleteMutation.mutate(bank) : undefined}
                    />
                </Card>
            )}

            {editingBank && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <h2 className="mb-1 text-xl font-bold text-slate-900">{t("banks.editBank")}</h2>
                        <p className="mb-6 text-sm text-slate-500">{t("banks.editBankDesc")}</p>

                        <form
                            onSubmit={editForm.handleSubmit((data) =>
                                updateMutation.mutate({ id: editingBank.id, payload: data })
                            )}
                            className="flex flex-col gap-4"
                        >
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-semibold text-slate-700">{t("banks.bankName")}</label>
                                <input
                                    {...editForm.register("name")}
                                    className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
                                />
                                <FieldError message={editForm.formState.errors.name?.message} />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-semibold text-slate-700">{t("banks.bankCode")}</label>
                                <input
                                    {...editForm.register("code")}
                                    className="rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500"
                                />
                                <FieldError message={editForm.formState.errors.code?.message} />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-semibold text-slate-700">{t("banks.logoUrl")}</label>
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
                                {t("common.active")}
                            </label>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeEdit}
                                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                    {t("common.cancel")}
                                </button>
                                <button
                                    type="submit"
                                    disabled={updateMutation.isPending}
                                    className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                                >
                                    {updateMutation.isPending ? t("common.saving") : t("common.saveChanges")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}
