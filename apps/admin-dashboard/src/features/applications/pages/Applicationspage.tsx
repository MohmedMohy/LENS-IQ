import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";

import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/navigation/PageHeader";
import Card from "@/components/ui/card/Card";
import { applicationsApi } from "@/features/applications/api/Applications";
import { customersApi } from "@/features/Customers/api/customers.api";
import { vehiclesApi } from "@/features/Vehicles/api/vehicels.api";
import { queryKeys } from "@/lib/Querykeys";
import { routePaths } from "@/router/route-paths";
import type { Application, ApplicationStatus, Customer, Vehicle, CreateApplicationPayload } from "@/types";

// ── Zod schema ────────────────────────────────────────────────────────────────

const applicationSchema = z.object({
    customer_id: z.coerce.number().int().positive("Select a customer"),
    vehicle_id: z.coerce.number().int().positive("Select a vehicle"),
    requested_down_payment: z.coerce.number().positive("Must be greater than 0"),
    requested_months: z.coerce.number().int().min(1).max(120),
    payment_method: z.enum(["salary_transfer", "bank_account", "cash_proof"]).default("bank_account"),
    notes: z.string().optional(),
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<ApplicationStatus, { badge: string; label: string }> = {
    PENDING: { badge: "border-amber-200 bg-amber-50 text-amber-700", label: "Pending" },
    APPROVED: { badge: "border-green-200 bg-green-50 text-green-700", label: "Approved" },
    REJECTED: { badge: "border-red-200 bg-red-50 text-red-700", label: "Rejected" },
    CANCELLED: { badge: "border-slate-200 bg-slate-50 text-slate-500", label: "Cancelled" },
};

const PAYMENT_METHOD_LABELS: Record<Application["payment_method"], string> = {
    salary_transfer: "Salary Transfer",
    bank_account: "Bank Account",
    cash_proof: "Cash Proof",
};

function StatusBadge({ status }: { status: ApplicationStatus }) {
    const s = STATUS_STYLES[status];
    return (
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${s.badge}`}>
            {s.label}
        </span>
    );
}

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

const INPUT_CLS =
    "rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 w-full";

const SELECT_CLS =
    "rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 bg-white w-full";

// ── Application Form ──────────────────────────────────────────────────────────

type ApplicationFormProps = {
    customers: Customer[];
    vehicles: Vehicle[];
    saving: boolean;
    error: string | null;
    onSubmit: (data: ApplicationFormValues) => void;
    onCancel: () => void;
};

function ApplicationForm({
    customers,
    vehicles,
    saving,
    error,
    onSubmit,
    onCancel,
}: ApplicationFormProps) {
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<ApplicationFormValues>({
        resolver: zodResolver(applicationSchema) as unknown as Resolver<ApplicationFormValues>,
        defaultValues: {
            payment_method: "bank_account",
            requested_months: 36,
        },
    });

    const vehicleId = watch("vehicle_id");
    const downPayment = watch("requested_down_payment");
    const selectedVehicle = vehicles.find((v) => v.id === Number(vehicleId));
    const loanAmount = selectedVehicle && downPayment
        ? Math.max(0, selectedVehicle.price - Number(downPayment))
        : null;
    const downPercent = selectedVehicle && downPayment
        ? ((Number(downPayment) / selectedVehicle.price) * 100).toFixed(1)
        : null;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-slate-700">Customer *</label>
                    <select {...register("customer_id")} className={SELECT_CLS}>
                        <option value="">Select customer</option>
                        {customers.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name} — {c.national_id}
                            </option>
                        ))}
                    </select>
                    <FieldError message={errors.customer_id?.message} />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-slate-700">Vehicle *</label>
                    <select {...register("vehicle_id")} className={SELECT_CLS}>
                        <option value="">Select vehicle</option>
                        {vehicles.map((v) => (
                            <option key={v.id} value={v.id}>
                                {v.brand} {v.model} {v.manufacturing_year} · {v.price.toLocaleString("en-EG")} EGP
                            </option>
                        ))}
                    </select>
                    <FieldError message={errors.vehicle_id?.message} />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-slate-700">Down Payment (EGP) *</label>
                    <input
                        type="number"
                        min={0}
                        {...register("requested_down_payment")}
                        placeholder="100000"
                        className={INPUT_CLS}
                    />
                    {loanAmount !== null && (
                        <p className="mt-1 text-xs text-slate-500">
                            {downPercent}% down — Finance amount:{" "}
                            <span className="font-semibold text-blue-600">
                                {loanAmount.toLocaleString("en-EG")} EGP
                            </span>
                        </p>
                    )}
                    <FieldError message={errors.requested_down_payment?.message} />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-slate-700">Duration (months) *</label>
                    <select {...register("requested_months")} className={SELECT_CLS}>
                        {[12, 24, 36, 48, 60, 72, 84].map((m) => (
                            <option key={m} value={m}>{m} months</option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-slate-700">Payment Method</label>
                    <select {...register("payment_method")} className={SELECT_CLS}>
                        <option value="bank_account">Bank Account</option>
                        <option value="salary_transfer">Salary Transfer</option>
                        <option value="cash_proof">Cash Proof</option>
                    </select>
                </div>

                <div className="flex flex-col gap-1 sm:col-span-2">
                    <label className="text-sm font-semibold text-slate-700">Notes</label>
                    <textarea
                        {...register("notes")}
                        rows={2}
                        placeholder="Additional details..."
                        className={INPUT_CLS + " resize-none"}
                    />
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {error}
                </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                    {saving ? "Creating..." : "Create Application"}
                </button>
            </div>
        </form>
    );
}

// ── Application Row Card ──────────────────────────────────────────────────────

function ApplicationCard({
    app,
    onStatusChange,
    onEvaluate,
    updatingId,
}: {
    app: Application;
    onStatusChange: (id: number, status: ApplicationStatus) => void;
    onEvaluate: (id: number) => void;
    updatingId: number | null;
}) {
    const isUpdating = updatingId === app.id;

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm">
            <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">{app.customer_name}</p>
                        <StatusBadge status={app.status} />
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500">
                        {app.brand} {app.model} · {app.manufacturing_year} · {app.condition}
                    </p>
                </div>
                <div className="text-right shrink-0">
                    <p className="font-semibold text-slate-900">
                        {Number(app.price).toLocaleString("en-EG")} EGP
                    </p>
                    <p className="text-xs text-slate-400">Vehicle price</p>
                </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 sm:grid-cols-4">
                <div>
                    <span className="font-semibold text-slate-400 uppercase tracking-wide">Salary</span>
                    <p>{Number(app.salary).toLocaleString("en-EG")} EGP</p>
                </div>
                <div>
                    <span className="font-semibold text-slate-400 uppercase tracking-wide">Down</span>
                    <p>{Number(app.requested_down_payment).toLocaleString("en-EG")} EGP</p>
                </div>
                <div>
                    <span className="font-semibold text-slate-400 uppercase tracking-wide">Duration</span>
                    <p>{app.requested_months} months</p>
                </div>
                <div>
                    <span className="font-semibold text-slate-400 uppercase tracking-wide">Payment</span>
                    <p>{PAYMENT_METHOD_LABELS[app.payment_method]}</p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {app.status === "PENDING" && (
                    <>
                        <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => onStatusChange(app.id, "APPROVED")}
                            className="rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-100 disabled:opacity-50"
                        >
                            Approve
                        </button>
                        <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => onStatusChange(app.id, "REJECTED")}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                        >
                            Reject
                        </button>
                        <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => onStatusChange(app.id, "CANCELLED")}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                    </>
                )}
                <button
                    type="button"
                    onClick={() => onEvaluate(app.id)}
                    className="ml-auto rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                >
                    Run Evaluation →
                </button>
            </div>

            {app.notes && (
                <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                    <span className="font-semibold">Note:</span> {app.notes}
                </p>
            )}
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ApplicationsPage() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [showForm, setShowForm] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<ApplicationStatus | "all">("all");
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [search, setSearch] = useState("");

    const { data: applications = [], isLoading, error } = useQuery({
        queryKey: queryKeys.applications,
        queryFn: applicationsApi.getAll,
    });

    const { data: customers = [] } = useQuery({
        queryKey: queryKeys.customers,
        queryFn: customersApi.getAll,
    });

    const { data: vehicles = [] } = useQuery({
        queryKey: queryKeys.vehicles,
        queryFn: vehiclesApi.getAll,
    });

    const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.applications });

    const createMutation = useMutation({
        mutationFn: applicationsApi.create,
        onSuccess: () => {
            setShowForm(false);
            setFormError(null);
            void invalidate();
            toast.success("Application created successfully.");
        },
        onError: (err: Error) => setFormError(err.message),
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: number; status: ApplicationStatus }) =>
            applicationsApi.updateStatus(id, status),
        onMutate: ({ id }) => setUpdatingId(id),
        onSuccess: (_data, { status }) => {
            setUpdatingId(null);
            void invalidate();
            toast.success(`Application ${status.toLowerCase()}.`);
        },
        onError: () => {
            setUpdatingId(null);
            toast.error("Could not update status.");
        },
    });

    const statusCounts = useMemo(
        () => ({
            all: applications.length,
            PENDING: applications.filter((a) => a.status === "PENDING").length,
            APPROVED: applications.filter((a) => a.status === "APPROVED").length,
            REJECTED: applications.filter((a) => a.status === "REJECTED").length,
            CANCELLED: applications.filter((a) => a.status === "CANCELLED").length,
        }),
        [applications]
    );

    const filtered = applications
        .filter((a) => filterStatus === "all" || a.status === filterStatus)
        .filter((a) =>
            search
                ? a.customer_name.toLowerCase().includes(search.toLowerCase()) ||
                `${a.brand} ${a.model}`.toLowerCase().includes(search.toLowerCase())
                : true
        );

    const filters: { label: string; value: ApplicationStatus | "all" }[] = [
        { label: "All", value: "all" },
        { label: "Pending", value: "PENDING" },
        { label: "Approved", value: "APPROVED" },
        { label: "Rejected", value: "REJECTED" },
        { label: "Cancelled", value: "CANCELLED" },
    ];

    return (
        <Layout>
            <PageHeader
                title="Applications"
                description="Manage financing applications from customers."
                action={
                    <button
                        type="button"
                        onClick={() => setShowForm((v) => !v)}
                        className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                        {showForm ? "Cancel" : "+ New Application"}
                    </button>
                }
            />

            {/* Status filter tabs */}
            <div className="mb-6 flex flex-wrap gap-2">
                {filters.map((f) => {
                    const count = statusCounts[f.value];
                    const isActive = filterStatus === f.value;
                    return (
                        <button
                            key={f.value}
                            type="button"
                            onClick={() => setFilterStatus(f.value)}
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${isActive
                                    ? "bg-slate-900 text-white"
                                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                                }`}
                        >
                            {f.label} ({count})
                        </button>
                    );
                })}
            </div>

            {showForm && (
                <Card className="mb-6">
                    <p className="mb-4 text-sm font-semibold text-slate-700">New Application</p>
                    {customers.length === 0 || vehicles.length === 0 ? (
                        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                            You need at least one customer and one vehicle to create an application.
                        </p>
                    ) : (
                        <ApplicationForm
                            customers={customers}
                            vehicles={vehicles}
                            saving={createMutation.isPending}
                            error={formError}
                            onSubmit={(data) => createMutation.mutate(data as CreateApplicationPayload)}
                            onCancel={() => { setShowForm(false); setFormError(null); }}
                        />
                    )}
                </Card>
            )}

            <Card className="mb-6">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by customer name or vehicle..."
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
            </Card>

            {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {(error as Error).message}
                </div>
            )}

            {isLoading ? (
                <Card><p className="text-sm text-slate-500">Loading applications...</p></Card>
            ) : filtered.length === 0 ? (
                <Card>
                    <p className="py-8 text-center text-sm text-slate-500">
                        No applications{filterStatus !== "all" ? ` with status ${filterStatus.toLowerCase()}` : ""}.
                    </p>
                </Card>
            ) : (
                <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-500">
                        {filtered.length} application{filtered.length !== 1 ? "s" : ""}
                    </p>
                    {filtered.map((app) => (
                        <ApplicationCard
                            key={app.id}
                            app={app}
                            updatingId={updatingId}
                            onStatusChange={(id, status) =>
                                statusMutation.mutate({ id, status })
                            }
                            onEvaluate={() => navigate(routePaths.evaluate)}
                        />
                    ))}
                </div>
            )}
        </Layout>
    );
}