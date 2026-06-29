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
    FinancingType, CalculationMethod, AllowedConditions, CustomerType,
} from "@/types";
import { useAuthStore } from "@/store/auth.store";

const CUSTOMER_TYPES: { value: CustomerType; label: string }[] = [
    { value: "salary_transfer", label: "programs.salaryTransfer" },
    { value: "employee", label: "programs.employee" },
    { value: "self_employed", label: "programs.selfEmployed" },
];

const FINANCING_TYPES: { value: FinancingType; label: string }[] = [
    { value: "conventional", label: "programs.conventional" },
    { value: "islamic", label: "programs.islamic" },
];

const CALC_METHODS: { value: CalculationMethod; label: string }[] = [
    { value: "reducing", label: "programs.reducingBalance" },
    { value: "flat", label: "programs.flatRate" },
    { value: "murabaha", label: "programs.murabaha" },
];

const CONDITIONS: { value: AllowedConditions; label: string }[] = [
    { value: "both", label: "programs.newAndUsed" },
    { value: "new", label: "programs.newOnly" },
    { value: "used", label: "programs.usedOnly" },
];

type FormState = {
    name: string;
    code: string;
    description: string;
    customer_types: CustomerType[];
    required_documents: string[];
    bank_ids: number[];

    financing_type: FinancingType;
    calculation_method: CalculationMethod;

    min_salary: number;
    max_customer_age: number;
    salary_transfer_required: boolean;

    max_car_age: number;
    allowed_conditions: AllowedConditions;
    max_vehicle_price: number | null;

    interest_rate: number;
    profit_rate: number | null;

    min_months: number;
    max_months: number;
    min_down_payment_percent: number;
    max_down_payment_percent: number;
    max_finance_amount: number | null;
    admin_fees_percent: number;

    active: boolean;
};

function defaultForm(): FormState {
    return {
        name: "",
        code: "",
        description: "",
        customer_types: [],
        required_documents: [],
        bank_ids: [],
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
            {label}
            {children}
        </label>
    );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />
            {label}
        </label>
    );
}

const INPUT_CLS = "rounded-xl border border-slate-300 px-4 py-2.5 font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const SELECT_CLS = "rounded-xl border border-slate-300 px-4 py-2.5 font-normal outline-none transition focus:border-blue-500 bg-white";

type ProgramFormProps = {
    banks: Bank[];
    initial: FormState;
    saving: boolean;
    error: string | null;
    submitLabel: string;
    onSubmit: (payload: CreateProgramPayload) => void;
    onCancel?: () => void;
};

function ProgramForm({ banks, initial, saving, error, submitLabel, onSubmit, onCancel }: ProgramFormProps) {
    const { t } = useTranslation();
    const [f, setF] = useState(initial);

    const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
        setF((prev) => ({ ...prev, [k]: v }));

    const isIslamic = f.financing_type === "islamic";

    const toggleBank = (bankId: number) => {
        setF((prev) => ({
            ...prev,
            bank_ids: prev.bank_ids.includes(bankId)
                ? prev.bank_ids.filter((id) => id !== bankId)
                : [...prev.bank_ids, bankId],
        }));
    };

    const toggleCustomerType = (ct: CustomerType) => {
        setF((prev) => ({
            ...prev,
            customer_types: prev.customer_types.includes(ct)
                ? prev.customer_types.filter((c) => c !== ct)
                : [...prev.customer_types, ct],
        }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!f.name.trim() || f.customer_types.length === 0) return;

        onSubmit({
            name: f.name.trim(),
            code: f.code || undefined,
            description: f.description || undefined,
            customer_types: f.customer_types,
            required_documents: f.required_documents,
            bank_ids: f.bank_ids,
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

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <SectionLabel>{t("programs.programIdentity")}</SectionLabel>

                <Field label={t("programs.programName")}>
                    <input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Salary Transfer Program" className={INPUT_CLS} required />
                </Field>

                <Field label={t("programs.code")}>
                    <input value={f.code} onChange={(e) => set("code", e.target.value)} placeholder="SALARY_TRANSFER" className={INPUT_CLS} />
                </Field>

                <Field label={t("programs.description")}>
                    <input value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="Program for salary transfer customers" className={INPUT_CLS} />
                </Field>

                <Field label={t("programs.financingType")}>
                    <select value={f.financing_type} onChange={(e) => set("financing_type", e.target.value as FinancingType)} className={SELECT_CLS}>
                        {FINANCING_TYPES.map((ft) => (<option key={ft.value} value={ft.value}>{t(ft.label)}</option>))}
                    </select>
                </Field>

                <Field label={t("programs.calculationMethod")}>
                    <select value={f.calculation_method} onChange={(e) => set("calculation_method", e.target.value as CalculationMethod)} className={SELECT_CLS}>
                        {CALC_METHODS.map((m) => (<option key={m.value} value={m.value}>{t(m.label)}</option>))}
                    </select>
                </Field>

                <SectionLabel>{t("programs.customerSegments")}</SectionLabel>

                <div className="col-span-full flex flex-wrap gap-3">
                    {CUSTOMER_TYPES.map((ct) => (
                        <button key={ct.value} type="button" onClick={() => toggleCustomerType(ct.value)}
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${f.customer_types.includes(ct.value) ? "bg-blue-600 text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-50"}`}>
                            {t(ct.label)}
                        </button>
                    ))}
                </div>

                <SectionLabel>{t("programs.linkedBanks")}</SectionLabel>

                <div className="col-span-full flex flex-wrap gap-3">
                    {banks.map((bank) => (
                        <button key={bank.id} type="button" onClick={() => toggleBank(bank.id)}
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${f.bank_ids.includes(bank.id) ? "bg-slate-900 text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-50"}`}>
                            {bank.name}
                        </button>
                    ))}
                </div>

                <SectionLabel>{t("programs.customerEligibility")}</SectionLabel>

                <Field label={t("programs.minSalary")}>
                    <input type="number" min={0} value={f.min_salary} onChange={(e) => set("min_salary", Number(e.target.value))} className={INPUT_CLS} />
                </Field>

                <Field label={t("programs.maxCustomerAge")}>
                    <input type="number" min={18} max={75} value={f.max_customer_age} onChange={(e) => set("max_customer_age", Number(e.target.value))} className={INPUT_CLS} />
                </Field>

                <Field label={t("programs.salaryTransferRequired")}>
                    <select value={f.salary_transfer_required ? "yes" : "no"} onChange={(e) => set("salary_transfer_required", e.target.value === "yes")} className={SELECT_CLS}>
                        <option value="no">{t("programs.salaryNotRequired")}</option>
                        <option value="yes">{t("programs.salaryRequired")}</option>
                    </select>
                </Field>

                <SectionLabel>{t("programs.vehicleRequirements")}</SectionLabel>

                <Field label={t("programs.allowedConditions")}>
                    <select value={f.allowed_conditions} onChange={(e) => set("allowed_conditions", e.target.value as AllowedConditions)} className={SELECT_CLS}>
                        {CONDITIONS.map((c) => (<option key={c.value} value={c.value}>{t(c.label)}</option>))}
                    </select>
                </Field>

                <Field label={t("programs.maxCarAge")}>
                    <input type="number" min={0} value={f.max_car_age} onChange={(e) => set("max_car_age", Number(e.target.value))} className={INPUT_CLS} />
                </Field>

                <Field label={t("programs.maxVehiclePrice")}>
                    <input type="number" min={0} value={f.max_vehicle_price ?? ""} onChange={(e) => set("max_vehicle_price", e.target.value ? Number(e.target.value) : null)} placeholder={t("programs.noLimit")} className={INPUT_CLS} />
                </Field>

                <SectionLabel>{t("programs.financialTerms")}</SectionLabel>

                {isIslamic ? (
                    <Field label={t("programs.profitRate")}>
                        <input type="number" step="0.001" min={0} max={1} value={f.profit_rate ?? ""} onChange={(e) => set("profit_rate", e.target.value ? Number(e.target.value) : null)} placeholder="e.g. 0.12" className={INPUT_CLS} />
                    </Field>
                ) : (
                    <Field label={t("programs.interestRateLabel")}>
                        <input type="number" step="0.001" min={0} max={1} value={f.interest_rate} onChange={(e) => set("interest_rate", Number(e.target.value))} placeholder="e.g. 0.14" className={INPUT_CLS} />
                    </Field>
                )}

                <Field label={t("programs.minMonths")}>
                    <input type="number" min={1} value={f.min_months} onChange={(e) => set("min_months", Number(e.target.value))} className={INPUT_CLS} />
                </Field>
                <Field label={t("programs.maxMonths")}>
                    <input type="number" min={1} value={f.max_months} onChange={(e) => set("max_months", Number(e.target.value))} className={INPUT_CLS} />
                </Field>
                <Field label={t("programs.minDownPayment")}>
                    <input type="number" step="0.01" min={0} max={100} value={f.min_down_payment_percent} onChange={(e) => set("min_down_payment_percent", Number(e.target.value))} className={INPUT_CLS} />
                </Field>
                <Field label={t("programs.maxDownPayment")}>
                    <input type="number" step="0.01" min={0} max={100} value={f.max_down_payment_percent} onChange={(e) => set("max_down_payment_percent", Number(e.target.value))} className={INPUT_CLS} />
                </Field>
                <Field label={t("programs.adminFees")}>
                    <input type="number" step="0.01" min={0} max={100} value={f.admin_fees_percent} onChange={(e) => set("admin_fees_percent", Number(e.target.value))} className={INPUT_CLS} />
                </Field>
                <Field label={t("programs.maxFinanceAmount")}>
                    <input type="number" min={0} value={f.max_finance_amount ?? ""} onChange={(e) => set("max_finance_amount", e.target.value ? Number(e.target.value) : null)} placeholder={t("programs.noLimit")} className={INPUT_CLS} />
                </Field>

                <SectionLabel>{t("common.status")}</SectionLabel>
                <Checkbox label={t("common.active")} checked={f.active} onChange={(v) => set("active", v)} />
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>
            )}

            <div className="flex justify-end gap-3 pt-2">
                {onCancel && (
                    <button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">{t("common.cancel")}</button>
                )}
                <button type="submit" disabled={saving || banks.length === 0 || f.customer_types.length === 0}
                    className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400">
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
    const [filterCustomerType, setFilterCustomerType] = useState<string>("all");
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

    const filteredData = useMemo(() => {
        if (filterCustomerType === "all") return data;
        return data.filter((p) => p.customer_types.includes(filterCustomerType as any));
    }, [data, filterCustomerType]);

    const allCustomerTypes = useMemo(() => {
        const types = new Set<string>();
        data.forEach((p) => p.customer_types.forEach((ct) => types.add(ct)));
        return [...types];
    }, [data]);

    const customerTypeCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        data.forEach((p) => p.customer_types.forEach((ct) => { counts[ct] = (counts[ct] || 0) + 1; }));
        return counts;
    }, [data]);

    const programToFormState = (program: Program): FormState => ({
        name: program.name,
        code: program.code ?? "",
        description: program.description ?? "",
        customer_types: program.customer_types,
        required_documents: program.required_documents,
        bank_ids: program.bank_ids ?? [],
        financing_type: program.financing_type,
        calculation_method: program.calculation_method,
        min_salary: program.min_salary,
        max_customer_age: program.max_customer_age,
        salary_transfer_required: program.salary_transfer_required,
        max_car_age: program.max_car_age,
        allowed_conditions: program.allowed_conditions,
        max_vehicle_price: program.max_vehicle_price,
        interest_rate: program.interest_rate,
        profit_rate: program.profit_rate,
        min_months: program.min_months,
        max_months: program.max_months,
        min_down_payment_percent: program.min_down_payment_percent,
        max_down_payment_percent: program.max_down_payment_percent,
        max_finance_amount: program.max_finance_amount,
        admin_fees_percent: program.admin_fees_percent,
        active: program.active,
    });

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

    return (
        <Layout>
            <div className="p-6">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">{t("programs.description")}</p>
                        <h1 className="mt-1 text-2xl font-bold text-slate-900">{t("programs.title")}</h1>
                    </div>
                    {isWriteRole && (
                        <button type="button" onClick={() => setShowForm((v) => !v)}
                            className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
                            {showForm ? t("common.cancel") : t("programs.addProgram")}
                        </button>
                    )}
                </div>

                {isWriteRole && showForm && (
                    <Card className="mb-6">
                        <p className="mb-4 text-sm font-semibold text-slate-700">{t("programs.newProgram")}</p>
                        <ProgramForm banks={banks} initial={defaultForm()} saving={saving} error={formError}
                            submitLabel={t("programs.addProgram")} onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
                    </Card>
                )}

                {error && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>
                )}

                {loading && <Card><TableSkeleton /></Card>}

                {!loading && banks.length === 0 && (
                    <p className="text-slate-500">{t("programs.noBanksFirst")}</p>
                )}

                {!loading && banks.length > 0 && (
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        <button type="button" onClick={() => setFilterCustomerType("all")}
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${filterCustomerType === "all" ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                            {t("rules.all")} ({data.length})
                        </button>
                        {allCustomerTypes.map((ct) => (
                            <button key={ct} type="button" onClick={() => setFilterCustomerType(ct)}
                                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${filterCustomerType === ct ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                                {t(`programs.${ct}`)} ({customerTypeCounts[ct] ?? 0})
                            </button>
                        ))}
                    </div>
                )}

                <DataTable<Program>
                    data={filteredData}
                    columns={[
                        { key: "id", label: t("common.id") },
                        { key: "name", label: t("common.name") },
                        { key: "code", label: t("programs.code") },
                        { key: "customer_types", label: t("programs.customerSegments") },
                        { key: "interest_rate", label: t("programs.interestRateLabel") },
                        { key: "min_months", label: t("programs.minMonths") },
                        { key: "max_months", label: t("programs.maxMonths") },
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
                        <p className="mb-6 text-sm text-slate-500">{t("programs.editProgramDesc", { name: editProgram.name })}</p>
                        <ProgramForm banks={banks} initial={programToFormState(editProgram)} saving={saving} error={editError}
                            submitLabel={t("common.saveChanges")} onSubmit={handleUpdate} onCancel={() => setEditProgram(null)} />
                    </div>
                </div>
            )}
        </Layout>
    );
}
