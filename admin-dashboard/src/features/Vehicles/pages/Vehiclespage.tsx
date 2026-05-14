import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";

import Layout from "@/components/layout/Layout";
import DataTable from "@/components/data-display/DataTable";
import PageHeader from "@/components/navigation/PageHeader";
import Card from "@/components/ui/card/Card";
import { vehiclesApi } from "@/features/Vehicles/api/vehicels.api";
import { queryKeys } from "@/lib/Querykeys";
import type { Vehicle, CreateVehiclePayload, UpdateVehiclePayload } from "@/types";

// ── Zod schema ────────────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();

const vehicleSchema = z.object({
    brand: z.string().min(1, "Brand is required"),
    model: z.string().min(1, "Model is required"),
    manufacturing_year: z.coerce
        .number()
        .int()
        .min(1990, "Min year is 1990")
        .max(CURRENT_YEAR + 1, `Max year is ${CURRENT_YEAR + 1}`),
    condition: z.enum(["new", "used"]),
    price: z.coerce.number().positive("Must be greater than 0"),
    category: z.enum(["sedan", "suv", "truck", "van", "microbus"]).optional().nullable(),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

// ── Helpers ───────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<NonNullable<Vehicle["category"]>, string> = {
    sedan: "Sedan",
    suv: "SUV",
    truck: "Truck",
    van: "Van",
    microbus: "Microbus",
};

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

const INPUT_CLS =
    "rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 w-full";

const SELECT_CLS =
    "rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 bg-white w-full";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
            {label}
            {children}
        </label>
    );
}

// ── Vehicle Form ──────────────────────────────────────────────────────────────

type VehicleFormProps = {
    initial?: Partial<VehicleFormValues>;
    saving: boolean;
    error: string | null;
    submitLabel: string;
    onSubmit: (data: VehicleFormValues) => void;
    onCancel?: () => void;
};

function VehicleForm({ initial, saving, error, submitLabel, onSubmit, onCancel }: VehicleFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<VehicleFormValues>({
        resolver: zodResolver(vehicleSchema),
        defaultValues: {
            brand: "",
            model: "",
            condition: "new",
            manufacturing_year: CURRENT_YEAR,
            price: 0,
            ...initial,
        },
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Brand *">
                    <input {...register("brand")} placeholder="Toyota" className={INPUT_CLS} />
                    <FieldError message={errors.brand?.message} />
                </Field>

                <Field label="Model *">
                    <input {...register("model")} placeholder="Corolla" className={INPUT_CLS} />
                    <FieldError message={errors.model?.message} />
                </Field>

                <Field label="Manufacturing Year *">
                    <input
                        type="number"
                        {...register("manufacturing_year")}
                        placeholder={String(CURRENT_YEAR)}
                        className={INPUT_CLS}
                    />
                    <FieldError message={errors.manufacturing_year?.message} />
                </Field>

                <Field label="Condition *">
                    <select {...register("condition")} className={SELECT_CLS}>
                        <option value="new">New</option>
                        <option value="used">Used</option>
                    </select>
                </Field>

                <Field label="Price (EGP) *">
                    <input
                        type="number"
                        step={1000}
                        {...register("price")}
                        placeholder="500000"
                        className={INPUT_CLS}
                    />
                    <FieldError message={errors.price?.message} />
                </Field>

                <Field label="Category">
                    <select {...register("category")} className={SELECT_CLS}>
                        <option value="">Select category</option>
                        {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                            <option key={v} value={v}>{l}</option>
                        ))}
                    </select>
                </Field>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {error}
                </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                    {saving ? "Saving..." : submitLabel}
                </button>
            </div>
        </form>
    );
}

// ── Condition Badge ───────────────────────────────────────────────────────────

function ConditionBadge({ condition }: { condition: Vehicle["condition"] }) {
    return (
        <span
            className={
                condition === "new"
                    ? "rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700"
                    : "rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700"
            }
        >
            {condition === "new" ? "New" : "Used"}
        </span>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VehiclesPage() {
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [editError, setEditError] = useState<string | null>(null);
    const [filterCondition, setFilterCondition] = useState<"all" | "new" | "used">("all");
    const [search, setSearch] = useState("");

    const { data: vehicles = [], isLoading, error } = useQuery({
        queryKey: queryKeys.vehicles,
        queryFn: vehiclesApi.getAll,
    });

    const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.vehicles });

    const createMutation = useMutation({
        mutationFn: (payload: CreateVehiclePayload) => vehiclesApi.create(payload),
        onSuccess: () => {
            setShowForm(false);
            setFormError(null);
            void invalidate();
            toast.success("Vehicle added successfully.");
        },
        onError: (err: Error) => setFormError(err.message),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: UpdateVehiclePayload }) =>
            vehiclesApi.update(id, payload),
        onSuccess: () => {
            setEditingVehicle(null);
            setEditError(null);
            void invalidate();
            toast.success("Vehicle updated successfully.");
        },
        onError: (err: Error) => setEditError(err.message),
    });

    const deleteMutation = useMutation({
        mutationFn: (v: Vehicle) => vehiclesApi.remove(v.id),
        onSuccess: (_data, v) => {
            void invalidate();
            toast.success(`"${v.brand} ${v.model}" deleted.`);
        },
        onError: () => toast.error("Could not delete vehicle."),
    });

    const filtered = vehicles
        .filter((v) =>
            filterCondition === "all" ? true : v.condition === filterCondition
        )
        .filter((v) =>
            search
                ? `${v.brand} ${v.model}`.toLowerCase().includes(search.toLowerCase())
                : true
        );

    const newCount = vehicles.filter((v) => v.condition === "new").length;
    const usedCount = vehicles.filter((v) => v.condition === "used").length;

    return (
        <Layout>
            <PageHeader
                title="Vehicles"
                description="Manage vehicle inventory available for financing."
                action={
                    <button
                        type="button"
                        onClick={() => setShowForm((v) => !v)}
                        className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                        {showForm ? "Cancel" : "+ Add Vehicle"}
                    </button>
                }
            />

            {/* Stats */}
            <div className="mb-6 flex gap-3">
                {[
                    { label: "Total", count: vehicles.length, active: filterCondition === "all", onClick: () => setFilterCondition("all") },
                    { label: "New", count: newCount, active: filterCondition === "new", onClick: () => setFilterCondition("new") },
                    { label: "Used", count: usedCount, active: filterCondition === "used", onClick: () => setFilterCondition("used") },
                ].map((s) => (
                    <button
                        key={s.label}
                        type="button"
                        onClick={s.onClick}
                        className={`rounded-xl border px-4 py-3 text-center transition ${s.active
                                ? "border-slate-900 bg-slate-950 text-white"
                                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                            }`}
                    >
                        <p className="text-xs font-semibold uppercase">{s.label}</p>
                        <p className="text-xl font-bold">{s.count}</p>
                    </button>
                ))}
            </div>

            {showForm && (
                <Card className="mb-6">
                    <p className="mb-4 text-sm font-semibold text-slate-700">New Vehicle</p>
                    <VehicleForm
                        saving={createMutation.isPending}
                        error={formError}
                        submitLabel="Add Vehicle"
                        onSubmit={(data) =>
                            createMutation.mutate({ 
                                ...data, 
                                category: data.category || null 
                            } as CreateVehiclePayload)
                        }
                        onCancel={() => { setShowForm(false); setFormError(null); }}
                    />
                </Card>
            )}

            <Card className="mb-6">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by brand or model..."
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
            </Card>

            {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {(error as Error).message}
                </div>
            )}

            {isLoading ? (
                <Card><p className="text-sm text-slate-500">Loading vehicles...</p></Card>
            ) : (
                <Card>
                    <div className="mb-3">
                        <p className="text-sm font-medium text-slate-500">
                            {filtered.length} vehicle{filtered.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                    <DataTable<Vehicle>
                        data={filtered}
                        columns={[
                            { key: "id", label: "ID" },
                            { key: "brand", label: "Brand" },
                            { key: "model", label: "Model" },
                            { key: "manufacturing_year", label: "Year" },
                            { key: "condition", label: "Condition" },
                            { key: "price", label: "Price (EGP)" },
                            { key: "category", label: "Category" },
                        ]}
                        onEdit={(v) => setEditingVehicle(v)}
                        onDelete={(v) => deleteMutation.mutate(v)}
                    />
                </Card>
            )}

            {editingVehicle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
                        <h2 className="mb-1 text-xl font-bold text-slate-900">Edit Vehicle</h2>
                        <p className="mb-6 flex items-center gap-2 text-sm text-slate-500">
                            {editingVehicle.brand} {editingVehicle.model} · {editingVehicle.manufacturing_year}
                            <ConditionBadge condition={editingVehicle.condition} />
                        </p>
                        <VehicleForm
                            initial={{
                                brand: editingVehicle.brand,
                                model: editingVehicle.model,
                                manufacturing_year: editingVehicle.manufacturing_year,
                                condition: editingVehicle.condition,
                                price: editingVehicle.price,
                                category: editingVehicle.category,
                            }}
                            saving={updateMutation.isPending}
                            error={editError}
                            submitLabel="Save Changes"
                            onSubmit={(data) =>
                                    updateMutation.mutate({ 
                                        id: editingVehicle.id, 
                                        payload: { ...data, category: data.category || null } as UpdateVehiclePayload 
                                    })
                                }
                            onCancel={() => { setEditingVehicle(null); setEditError(null); }}
                        />
                    </div>
                </div>
            )}
        </Layout>
    );
}