import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Layout from "@/components/layout/Layout";
import DataTable from "@/components/data-display/DataTable";
import Card from "@/components/ui/card/Card";
import { banksApi } from "@/features/banks/api/banks.api";
import { programsApi } from "@/features/programs/api/programs.api";
import type {
    Bank, Program, CreateProgramPayload, UpdateProgramPayload,
    FinancingType, CalculationMethod, AllowedConditions,
} from "@/types";

// ── Constants ────────────────────────────────────────────────────────────────

const FINANCING_TYPES: { value: FinancingType; label: string }[] = [
    { value: "conventional", label: "Conventional" },
    { value: "islamic", label: "Islamic" },
];

const CALC_METHODS: { value: CalculationMethod; label: string }[] = [
    { value: "reducing", label: "Reducing Balance" },
    { value: "flat", label: "Flat Rate" },
    { value: "murabaha", label: "Murabaha" },
];

const CONDITIONS: { value: AllowedConditions; label: string }[] = [
    { value: "both", label: "New & Used" },
    { value: "new", label: "New Only" },
    { value: "used", label: "Used Only" },
];

// ── Default form values ───────────────────────────────────────────────────────

type FormState = Omit<CreateProgramPayload, "id">;

function defaultForm(bankId = ""): FormState & { bank_id_str: string } {
    return {
        bank_id_str: bankId,
        bank_id: 0,
        name: "",
        financing_type: "conventional",
        calculation_method: "reducing",
        min_salary: 10_000,
        max_customer_age: 60,
        salary_transfer_required: false,
        max_car_age: 5,
        allowed_conditions: "both",
        max_vehicle_price: null,
        interest_rate: 0.1,
        profit_rate: null,
        min_months: 12,
        max_months: 60,
        min_down_payment_percent: 10,
        max_finance_amount: null,
        admin_fees_percent: 0,
        active: true,
    };
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="col-span-full text-xs font-semibold uppercase tracking-widest text-slate-400 mt-2">
            {children}
        </p>
    );
}

// ── Reusable field ────────────────────────────────────────────────────────────

function Field({
    label, children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
            {label}
            {children}
        </label>
    );
}

const INPUT_CLS =
    "rounded-xl border border-slate-300 px-4 py-2.5 font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const SELECT_CLS =
    "rounded-xl border border-slate-300 px-4 py-2.5 font-normal outline-none transition focus:border-blue-500 bg-white";

// ── Program Form ──────────────────────────────────────────────────────────────

type ProgramFormProps = {
    banks: Bank[];
    initial: FormState & { bank_id_str: string };
    saving: boolean;
    error: string | null;
    submitLabel: string;
    onSubmit: (payload: CreateProgramPayload) => void;
    onCancel?: () => void;
};

function ProgramForm({
    banks, initial, saving, error, submitLabel, onSubmit, onCancel,
}: ProgramFormProps) {
    const [f, setF] = useState(initial);

    const set = <K extends keyof typeof f>(k: K, v: typeof f[K]) =>
        setF((prev) => ({ ...prev, [k]: v }));

    const isIslamic = f.financing_type === "islamic";

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const bankId = Number(f.bank_id_str);
        if (!f.name.trim() || !bankId) return;

        onSubmit({
            bank_id: bankId,
            name: f.name.trim(),
            financing_type: f.financing_type,
            calculation_method: f.calculation_method,
            min_salary: f.min_salary,
            max_customer_age: f.max_customer_age,
            salary_transfer_required: f.salary_transfer_required,
            max_car_age: f.max_car_age,
            allowed_conditions: f.allowed_conditions,
            max_vehicle_price: f.max_vehicle_price || null,
            interest_rate: isIslamic ? 0 : f.interest_rate,
            profit_rate: isIslamic ? f.profit_rate : null,
            min_months: f.min_months,
            max_months: f.max_months,
            min_down_payment_percent: f.min_down_payment_percent,
            max_finance_amount: f.max_finance_amount || null,
            admin_fees_percent: f.admin_fees_percent,
            active: f.active,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

                {/* ── Identity ── */}
                <SectionLabel>Program Identity</SectionLabel>

                <Field label="Program Name">
                    <input
                        value={f.name}
                        onChange={(e) => set("name", e.target.value)}
                        placeholder="Personal Finance 60M"
                        className={INPUT_CLS}
                        required
                    />
                </Field>

                <Field label="Bank">
                    <select
                        value={f.bank_id_str}
                        onChange={(e) => set("bank_id_str", e.target.value)}
                        className={SELECT_CLS}
                        required
                    >
                        <option value="">Select bank</option>
                        {banks.map((b) => (
                            <option key={b.id} value={String(b.id)}>{b.name}</option>
                        ))}
                    </select>
                </Field>

                <Field label="Financing Type">
                    <select
                        value={f.financing_type}
                        onChange={(e) => set("financing_type", e.target.value as FinancingType)}
                        className={SELECT_CLS}
                    >
                        {FINANCING_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>
                </Field>

                <Field label="Calculation Method">
                    <select
                        value={f.calculation_method}
                        onChange={(e) => set("calculation_method", e.target.value as CalculationMethod)}
                        className={SELECT_CLS}
                    >
                        {CALC_METHODS.map((m) => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>
                </Field>

                {/* ── Customer Eligibility ── */}
                <SectionLabel>Customer Eligibility</SectionLabel>

                <Field label="Min Salary (EGP)">
                    <input
                        type="number" min={0}
                        value={f.min_salary}
                        onChange={(e) => set("min_salary", Number(e.target.value))}
                        className={INPUT_CLS}
                    />
                </Field>

                <Field label="Max Customer Age">
                    <input
                        type="number" min={18} max={75}
                        value={f.max_customer_age}
                        onChange={(e) => set("max_customer_age", Number(e.target.value))}
                        className={INPUT_CLS}
                    />
                </Field>

                <Field label="Salary Transfer Required">
                    <select
                        value={f.salary_transfer_required ? "yes" : "no"}
                        onChange={(e) => set("salary_transfer_required", e.target.value === "yes")}
                        className={SELECT_CLS}
                    >
                        <option value="no">Not Required</option>
                        <option value="yes">Required</option>
                    </select>
                </Field>

                {/* ── Vehicle Requirements ── */}
                <SectionLabel>Vehicle Requirements</SectionLabel>

                <Field label="Allowed Conditions">
                    <select
                        value={f.allowed_conditions}
                        onChange={(e) => set("allowed_conditions", e.target.value as AllowedConditions)}
                        className={SELECT_CLS}
                    >
                        {CONDITIONS.map((c) => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                    </select>
                </Field>

                <Field label="Max Car Age (years)">
                    <input
                        type="number" min={0}
                        value={f.max_car_age}
                        onChange={(e) => set("max_car_age", Number(e.target.value))}
                        className={INPUT_CLS}
                    />
                </Field>

                <Field label="Max Vehicle Price (EGP) — optional">
                    <input
                        type="number" min={0}
                        value={f.max_vehicle_price ?? ""}
                        onChange={(e) =>
                            set("max_vehicle_price", e.target.value ? Number(e.target.value) : null)
                        }
                        placeholder="No limit"
                        className={INPUT_CLS}
                    />
                </Field>

                {/* ── Financial Terms ── */}
                <SectionLabel>Financial Terms</SectionLabel>

                {isIslamic ? (
                    <Field label="Profit Rate (0–1)">
                        <input
                            type="number" step="0.001" min={0} max={1}
                            value={f.profit_rate ?? ""}
                            onChange={(e) =>
                                set("profit_rate", e.target.value ? Number(e.target.value) : null)
                            }
                            placeholder="e.g. 0.12"
                            className={INPUT_CLS}
                        />
                    </Field>
                ) : (
                    <Field label="Interest Rate (0–1)">
                        <input
                            type="number" step="0.001" min={0} max={1}
                            value={f.interest_rate}
                            onChange={(e) => set("interest_rate", Number(e.target.value))}
                            placeholder="e.g. 0.14"
                            className={INPUT_CLS}
                        />
                    </Field>
                )}

                <Field label="Min Months">
                    <input
                        type="number" min={1}
                        value={f.min_months}
                        onChange={(e) => set("min_months", Number(e.target.value))}
                        className={INPUT_CLS}
                    />
                </Field>

                <Field label="Max Months">
                    <input
                        type="number" min={1}
                        value={f.max_months}
                        onChange={(e) => set("max_months", Number(e.target.value))}
                        className={INPUT_CLS}
                    />
                </Field>

                <Field label="Min Down Payment (%)">
                    <input
                        type="number" step="0.01" min={0} max={100}
                        value={f.min_down_payment_percent}
                        onChange={(e) => set("min_down_payment_percent", Number(e.target.value))}
                        className={INPUT_CLS}
                    />
                </Field>

                <Field label="Admin Fees (%)">
                    <input
                        type="number" step="0.01" min={0} max={100}
                        value={f.admin_fees_percent}
                        onChange={(e) => set("admin_fees_percent", Number(e.target.value))}
                        className={INPUT_CLS}
                    />
                </Field>

                <Field label="Max Finance Amount (EGP) — optional">
                    <input
                        type="number" min={0}
                        value={f.max_finance_amount ?? ""}
                        onChange={(e) =>
                            set("max_finance_amount", e.target.value ? Number(e.target.value) : null)
                        }
                        placeholder="No limit"
                        className={INPUT_CLS}
                    />
                </Field>

                {/* ── Status ── */}
                <SectionLabel>Status</SectionLabel>

                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 col-span-full">
                    <input
                        type="checkbox"
                        checked={f.active}
                        onChange={(e) => set("active", e.target.checked)}
                        className="h-4 w-4"
                    />
                    Active
                </label>
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
                    disabled={saving || banks.length === 0}
                    className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                    {saving ? "Saving..." : submitLabel}
                </button>
            </div>
        </form>
    );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ProgramsPage() {
    const [data, setData] = useState<Program[]>([]);
    const [banks, setBanks] = useState<Bank[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [editError, setEditError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [filterBank, setFilterBank] = useState("all");
    const [editProgram, setEditProgram] = useState<Program | null>(null);
    const [showForm, setShowForm] = useState(false);

    const reload = () => setRefreshKey((k) => k + 1);

    useEffect(() => {
        let mounted = true;
        const run = async () => {
            setLoading(true);
            setError(null);
            try {
                const [programs, bankList] = await Promise.all([
                    programsApi.getAll(),
                    banksApi.getAll(),
                ]);
                if (!mounted) return;
                setData(programs);
                setBanks(bankList);
            } catch {
                if (mounted) setError("Could not load programs data.");
            } finally {
                if (mounted) setLoading(false);
            }
        };
        void run();
        return () => { mounted = false; };
    }, [refreshKey]);

    const filteredData = useMemo(() =>
        filterBank === "all"
            ? data
            : data.filter((p) => String(p.bank_id) === filterBank),
        [data, filterBank]
    );

    const handleCreate = async (payload: CreateProgramPayload) => {
        setSaving(true);
        setFormError(null);
        try {
            await programsApi.create(payload);
            setShowForm(false);
            reload();
        } catch (err) {
            setFormError(err instanceof Error ? err.message : "Could not add program.");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async (payload: UpdateProgramPayload) => {
        if (!editProgram) return;
        setSaving(true);
        setEditError(null);
        try {
            await programsApi.update(editProgram.id, payload);
            setEditProgram(null);
            reload();
        } catch (err) {
            setEditError(err instanceof Error ? err.message : "Could not update program.");
        } finally {
            setSaving(false);
        }
    };

    const remove = async (program: Program) => {
        setError(null);
        try {
            await programsApi.remove(program.id);
            reload();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not delete program.");
        }
    };

    const bankName = (id: number) =>
        banks.find((b) => b.id === id)?.name ?? String(id);

    return (
        <Layout>
            <div className="p-6">

                {/* ── Header ── */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
                            Decision Engine
                        </p>
                        <h1 className="mt-1 text-2xl font-bold text-slate-900">Programs</h1>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowForm((v) => !v)}
                        className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                        {showForm ? "Cancel" : "+ Add Program"}
                    </button>
                </div>

                {/* ── Create Form ── */}
                {showForm && (
                    <Card className="mb-6">
                        <p className="mb-4 text-sm font-semibold text-slate-700">New Program</p>
                        <ProgramForm
                            banks={banks}
                            initial={defaultForm(String(banks[0]?.id ?? ""))}
                            saving={saving}
                            error={formError}
                            submitLabel="Add Program"
                            onSubmit={handleCreate}
                            onCancel={() => setShowForm(false)}
                        />
                    </Card>
                )}

                {/* ── Errors ── */}
                {error && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                        {error}
                    </div>
                )}

                {loading && <p className="text-slate-500">Loading programs...</p>}

                {!loading && banks.length === 0 && (
                    <p className="text-slate-500">Add a bank first, then create programs.</p>
                )}

                {/* ── Bank Filter ── */}
                {!loading && banks.length > 0 && (
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setFilterBank("all")}
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${filterBank === "all"
                                    ? "bg-slate-900 text-white"
                                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                                }`}
                        >
                            All ({data.length})
                        </button>
                        {banks.map((bank) => {
                            const count = data.filter((p) => p.bank_id === bank.id).length;
                            return (
                                <button
                                    key={bank.id}
                                    type="button"
                                    onClick={() => setFilterBank(String(bank.id))}
                                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${filterBank === String(bank.id)
                                            ? "bg-blue-600 text-white"
                                            : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                                        }`}
                                >
                                    {bank.name} ({count})
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* ── Table ── */}
                <DataTable<Program>
                    data={filteredData}
                    columns={[
                        { key: "id", label: "ID" },
                        { key: "name", label: "Name" },
                        { key: "bank_id", label: "Bank" },
                        { key: "financing_type", label: "Type" },
                        { key: "calculation_method", label: "Method" },
                        { key: "interest_rate", label: "Rate" },
                        { key: "min_months", label: "Min M" },
                        { key: "max_months", label: "Max M" },
                        { key: "admin_fees_percent", label: "Fees %" },
                        { key: "active", label: "Active" },
                    ]}
                    onEdit={(p) => setEditProgram(p)}
                    onDelete={remove}
                />
            </div>

            {/* ── Edit Modal ── */}
            {editProgram && (
                <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-10">
                    <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
                        <h2 className="mb-1 text-xl font-bold text-slate-900">Edit Program</h2>
                        <p className="mb-6 text-sm text-slate-500">
                            {editProgram.name} — {bankName(editProgram.bank_id)}
                        </p>
                        <ProgramForm
                            banks={banks}
                            initial={{
                                ...editProgram,
                                bank_id_str: String(editProgram.bank_id),
                            }}
                            saving={saving}
                            error={editError}
                            submitLabel="Save Changes"
                            onSubmit={handleUpdate}
                            onCancel={() => setEditProgram(null)}
                        />
                    </div>
                </div>
            )}
        </Layout>
    );
}