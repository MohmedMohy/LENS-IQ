import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import Layout from "@/components/layout/Layout";
import DataTable from "@/components/data-display/DataTable";
import Card from "@/components/ui/card/Card";
import { TableSkeleton } from "@/components/ui/skeleton";
import { banksApi } from "@/features/banks/api/banks.api";
import { programsApi } from "@/features/programs/api/programs.api";
import type {
    Bank, Program, CreateProgramPayload, UpdateProgramPayload,
    FinancingType, CalculationMethod, AllowedConditions,
} from "@/types";
import { useAuthStore } from "@/store/auth.store";

const FINANCING_TYPES: { value: FinancingType }[] = [
    { value: "conventional" },
    { value: "islamic" },
];

const CALC_METHODS: { value: CalculationMethod }[] = [
    { value: "reducing" },
    { value: "flat" },
    { value: "murabaha" },
];

const CONDITIONS: { value: AllowedConditions }[] = [
    { value: "both" },
    { value: "new" },
    { value: "used" },
];

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
        max_down_payment_percent: 100,
        max_finance_amount: null,
        admin_fees_percent: 0,
        active: true,
    };
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="col-span-full text-xs font-semibold uppercase tracking-widest text-slate-400 mt-2">
            {children}
        </p>
    );
}

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
    const { t } = useTranslation();
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
            max_down_payment_percent: f.max_down_payment_percent,
            max_finance_amount: f.max_finance_amount || null,
            admin_fees_percent: f.admin_fees_percent,
            active: f.active,
        });
    };

    const financingLabel = (v: FinancingType) => {
        switch (v) {
            case "conventional": return t("programs.conventional");
            case "islamic": return t("programs.islamic");
        }
    };

    const calcLabel = (v: CalculationMethod) => {
        switch (v) {
            case "reducing": return t("programs.reducingBalance");
            case "flat": return t("programs.flatRate");
            case "murabaha": return t("programs.murabaha");
        }
    };

    const conditionLabel = (v: AllowedConditions) => {
        switch (v) {
            case "both": return t("programs.newAndUsed");
            case "new": return t("programs.newOnly");
            case "used": return t("programs.usedOnly");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

                <SectionLabel>{t("programs.programIdentity")}</SectionLabel>

                <Field label={t("programs.programName")}>
                    <input
                        value={f.name}
                        onChange={(e) => set("name", e.target.value)}
                        placeholder="Personal Finance 60M"
                        className={INPUT_CLS}
                        required
                    />
                </Field>

                <Field label={t("programs.bank")}>
                    <select
                        value={f.bank_id_str}
                        onChange={(e) => set("bank_id_str", e.target.value)}
                        className={SELECT_CLS}
                        required
                    >
                        <option value="">{t("programs.selectBank")}</option>
                        {banks.map((b) => (
                            <option key={b.id} value={String(b.id)}>{b.name}</option>
                        ))}
                    </select>
                </Field>

                <Field label={t("programs.financingType")}>
                    <select
                        value={f.financing_type}
                        onChange={(e) => set("financing_type", e.target.value as FinancingType)}
                        className={SELECT_CLS}
                    >
                        {FINANCING_TYPES.map((ft) => (
                            <option key={ft.value} value={ft.value}>{financingLabel(ft.value)}</option>
                        ))}
                    </select>
                </Field>

                <Field label={t("programs.calculationMethod")}>
                    <select
                        value={f.calculation_method}
                        onChange={(e) => set("calculation_method", e.target.value as CalculationMethod)}
                        className={SELECT_CLS}
                    >
                        {CALC_METHODS.map((m) => (
                            <option key={m.value} value={m.value}>{calcLabel(m.value)}</option>
                        ))}
                    </select>
                </Field>

                <SectionLabel>{t("programs.customerEligibility")}</SectionLabel>

                <Field label={t("programs.minSalary")}>
                    <input
                        type="number" min={0}
                        value={f.min_salary}
                        onChange={(e) => set("min_salary", Number(e.target.value))}
                        className={INPUT_CLS}
                    />
                </Field>

                <Field label={t("programs.maxCustomerAge")}>
                    <input
                        type="number" min={18} max={75}
                        value={f.max_customer_age}
                        onChange={(e) => set("max_customer_age", Number(e.target.value))}
                        className={INPUT_CLS}
                    />
                </Field>

                <Field label={t("programs.salaryTransferRequired")}>
                    <select
                        value={f.salary_transfer_required ? "yes" : "no"}
                        onChange={(e) => set("salary_transfer_required", e.target.value === "yes")}
                        className={SELECT_CLS}
                    >
                        <option value="no">{t("programs.salaryNotRequired")}</option>
                        <option value="yes">{t("programs.salaryRequired")}</option>
                    </select>
                </Field>

                <SectionLabel>{t("programs.vehicleRequirements")}</SectionLabel>

                <Field label={t("programs.allowedConditions")}>
                    <select
                        value={f.allowed_conditions}
                        onChange={(e) => set("allowed_conditions", e.target.value as AllowedConditions)}
                        className={SELECT_CLS}
                    >
                        {CONDITIONS.map((c) => (
                            <option key={c.value} value={c.value}>{conditionLabel(c.value)}</option>
                        ))}
                    </select>
                </Field>

                <Field label={t("programs.maxCarAge")}>
                    <input
                        type="number" min={0}
                        value={f.max_car_age}
                        onChange={(e) => set("max_car_age", Number(e.target.value))}
                        className={INPUT_CLS}
                    />
                </Field>

                <Field label={t("programs.maxVehiclePrice")}>
                    <input
                        type="number" min={0}
                        value={f.max_vehicle_price ?? ""}
                        onChange={(e) =>
                            set("max_vehicle_price", e.target.value ? Number(e.target.value) : null)
                        }
                        placeholder={t("programs.noLimit")}
                        className={INPUT_CLS}
                    />
                </Field>

                <SectionLabel>{t("programs.financialTerms")}</SectionLabel>

                {isIslamic ? (
                    <Field label={t("programs.profitRate")}>
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
                    <Field label={t("programs.interestRateLabel")}>
                        <input
                            type="number" step="0.001" min={0} max={1}
                            value={f.interest_rate}
                            onChange={(e) => set("interest_rate", Number(e.target.value))}
                            placeholder="e.g. 0.14"
                            className={INPUT_CLS}
                        />
                    </Field>
                )}

                <Field label={t("programs.minMonths")}>
                    <input
                        type="number" min={1}
                        value={f.min_months}
                        onChange={(e) => set("min_months", Number(e.target.value))}
                        className={INPUT_CLS}
                    />
                </Field>

                <Field label={t("programs.maxMonths")}>
                    <input
                        type="number" min={1}
                        value={f.max_months}
                        onChange={(e) => set("max_months", Number(e.target.value))}
                        className={INPUT_CLS}
                    />
                </Field>

                <Field label={t("programs.minDownPayment")}>
                    <input
                        type="number" step="0.01" min={0} max={100}
                        value={f.min_down_payment_percent}
                        onChange={(e) => set("min_down_payment_percent", Number(e.target.value))}
                        className={INPUT_CLS}
                    />
                </Field>

                <Field label={t("programs.maxDownPayment")}>
                    <input
                        type="number" step="0.01" min={0} max={100}
                        value={f.max_down_payment_percent}
                        onChange={(e) => set("max_down_payment_percent", Number(e.target.value))}
                        className={INPUT_CLS}
                    />
                </Field>

                <Field label={t("programs.adminFees")}>
                    <input
                        type="number" step="0.01" min={0} max={100}
                        value={f.admin_fees_percent}
                        onChange={(e) => set("admin_fees_percent", Number(e.target.value))}
                        className={INPUT_CLS}
                    />
                </Field>

                <Field label={t("programs.maxFinanceAmount")}>
                    <input
                        type="number" min={0}
                        value={f.max_finance_amount ?? ""}
                        onChange={(e) =>
                            set("max_finance_amount", e.target.value ? Number(e.target.value) : null)
                        }
                        placeholder={t("programs.noLimit")}
                        className={INPUT_CLS}
                    />
                </Field>

                <SectionLabel>{t("common.status")}</SectionLabel>

                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 col-span-full">
                    <input
                        type="checkbox"
                        checked={f.active}
                        onChange={(e) => set("active", e.target.checked)}
                        className="h-4 w-4"
                    />
                    {t("common.active")}
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
                        {t("common.cancel")}
                    </button>
                )}
                <button
                    type="submit"
                    disabled={saving || banks.length === 0}
                    className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                    {saving ? t("common.saving") : submitLabel}
                </button>
            </div>
        </form>
    );
}

export default function ProgramsPage() {
    const { t } = useTranslation();
    const tenant = useAuthStore((s) => s.tenant);
    const isWriteRole = tenant?.role === "ADMIN" || tenant?.role === "MANAGER";
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
                if (mounted) setError(t("programs.loadError"));
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
            setFormError(err instanceof Error ? err.message : t("programs.createError"));
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
            setEditError(err instanceof Error ? err.message : t("programs.updateError"));
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
            setError(err instanceof Error ? err.message : t("programs.deleteError"));
        }
    };

    const bankName = (id: number) =>
        banks.find((b) => b.id === id)?.name ?? String(id);

    return (
        <Layout>
            <div className="p-6">

                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
                            {t("programs.description")}
                        </p>
                        <h1 className="mt-1 text-2xl font-bold text-slate-900">{t("programs.title")}</h1>
                    </div>
                    {isWriteRole && (
                        <button
                            type="button"
                            onClick={() => setShowForm((v) => !v)}
                            className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                        >
                            {showForm ? t("common.cancel") : t("programs.addProgram")}
                        </button>
                    )}
                </div>

                {isWriteRole && showForm && (
                    <Card className="mb-6">
                        <p className="mb-4 text-sm font-semibold text-slate-700">{t("programs.newProgram")}</p>
                        <ProgramForm
                            banks={banks}
                            initial={defaultForm(String(banks[0]?.id ?? ""))}
                            saving={saving}
                            error={formError}
                            submitLabel={t("programs.addProgram")}
                            onSubmit={handleCreate}
                            onCancel={() => setShowForm(false)}
                        />
                    </Card>
                )}

                {error && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                        {error}
                    </div>
                )}

                {loading && <Card><TableSkeleton /></Card>}

                {!loading && banks.length === 0 && (
                    <p className="text-slate-500">{t("programs.noBanksFirst")}</p>
                )}

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
                            {t("rules.all")} ({data.length})
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

                <DataTable<Program>
                    data={filteredData}
                    columns={[
                        { key: "id", label: t("common.id") },
                        { key: "name", label: t("common.name") },
                        { key: "bank_id", label: t("programs.bank") },
                        { key: "financing_type", label: t("programs.financingType") },
                        { key: "calculation_method", label: t("programs.calculationMethod") },
                        { key: "interest_rate", label: t("programs.interestRateLabel") },
                        { key: "min_months", label: t("programs.minMonths") },
                        { key: "max_months", label: t("programs.maxMonths") },
                        { key: "admin_fees_percent", label: t("programs.adminFees") },
                        { key: "active", label: t("common.active") },
                    ]}
                    onEdit={isWriteRole ? (p) => setEditProgram(p) : undefined}
                    onDelete={isWriteRole ? remove : undefined}
                />
            </div>

            {editProgram && (
                <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-10">
                    <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
                        <h2 className="mb-1 text-xl font-bold text-slate-900">{t("programs.editProgram")}</h2>
                        <p className="mb-6 text-sm text-slate-500">
                            {t("programs.editProgramDesc", { name: editProgram.name, bank: bankName(editProgram.bank_id) })}
                        </p>
                        <ProgramForm
                            banks={banks}
                            initial={{
                                ...editProgram,
                                bank_id_str: String(editProgram.bank_id),
                            }}
                            saving={saving}
                            error={editError}
                            submitLabel={t("common.saveChanges")}
                            onSubmit={handleUpdate}
                            onCancel={() => setEditProgram(null)}
                        />
                    </div>
                </div>
            )}
        </Layout>
    );
}
