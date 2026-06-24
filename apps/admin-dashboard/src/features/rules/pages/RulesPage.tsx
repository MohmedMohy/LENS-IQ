import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import Layout from "@/components/layout/Layout";
import DataTable from "@/components/data-display/DataTable";
import Card from "@/components/ui/card/Card";
import { TableSkeleton } from "@/components/ui/skeleton";
import { banksApi } from "@/features/banks/api/banks.api";
import { programsApi } from "@/features/programs/api/programs.api";
import { rulesApi } from "@/features/rules/api/rules.api";
import type { Bank, Program, Rule, RuleAction, RuleField, RuleOperator } from "@/types";
import { useAuthStore } from "@/store/auth.store";

const ruleFields: RuleField[] = [
    "salary", "age", "car_age", "price",
    "job_type", "owns_property", "salary_transfer", "down_payment",
];
const operators: RuleOperator[] = ["<", ">", "<=", ">=", "=", "!="];
const actions: RuleAction[] = ["REJECT", "REQUIRED", "WARN"];

const fieldPlaceholders: Record<RuleField, string> = {
    salary: "e.g. 10000",
    age: "e.g. 60",
    car_age: "e.g. 5",
    price: "e.g. 500000",
    job_type: "e.g. private",
    owns_property: "true or false",
    salary_transfer: "true or false",
    down_payment: "e.g. 50000",
};

const actionLabels: Record<RuleAction, string> = {
    REJECT: "rules.reject",
    REQUIRED: "rules.required",
    WARN: "rules.warn",
};

export default function RulesPage() {
    const { t } = useTranslation();
    const tenant = useAuthStore((s) => s.tenant);
    const isWriteRole = tenant?.role === "ADMIN" || tenant?.role === "MANAGER";
    const [data, setData] = useState<Rule[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [banks, setBanks] = useState<Bank[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const [filterBankId, setFilterBankId] = useState<string>("all");

    const [programId, setProgramId] = useState("");
    const [field, setField] = useState<RuleField>("salary");
    const [operator, setOperator] = useState<RuleOperator>(">=");
    const [value, setValue] = useState<string>("");
    const [action, setAction] = useState<RuleAction>("WARN");

    const reload = () => setRefreshKey((k) => k + 1);

    useEffect(() => {
        let mounted = true;
        const run = async () => {
            setLoading(true);
            setError(null);
            try {
                const [programList, bankList] = await Promise.all([
                    programsApi.getAll(),
                    banksApi.getAll(),
                ]);
                const rulesPerProgram = await Promise.all(
                    programList.map((p) => rulesApi.getAllByProgram(p.id))
                );
                if (!mounted) return;
                setData(rulesPerProgram.flat());
                setPrograms(programList);
                setBanks(bankList);
                setProgramId((current) => current || String(programList[0]?.id ?? ""));
            } catch (err) {
                if (mounted) setError(err instanceof Error ? err.message : t("rules.loadError"));
            } finally {
                if (mounted) setLoading(false);
            }
        };
        void run();
        return () => { mounted = false; };
    }, [refreshKey]);

    const programsInSelectedBank = useMemo(() => {
        if (filterBankId === "all") return programs;
        return programs.filter((p) => String(p.bank_id) === filterBankId);
    }, [programs, filterBankId]);

    const filteredData = useMemo(() => {
        if (filterBankId === "all") return data;
        const programIds = new Set(programsInSelectedBank.map((p) => p.id));
        return data.filter((r) => programIds.has(r.program_id));
    }, [data, filterBankId, programsInSelectedBank]);

    const actionCounts = useMemo(
        () =>
            filteredData.reduce(
                (counts, rule) => ({ ...counts, [rule.action]: counts[rule.action] + 1 }),
                { REJECT: 0, REQUIRED: 0, WARN: 0 } satisfies Record<RuleAction, number>
            ),
        [filteredData]
    );

    const createRule = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const selectedProgramId = Number(programId);
        if (!selectedProgramId || !value.trim()) {
            setError(t("rules.programValueRequired"));
            return;
        }
        setSaving(true);
        setError(null);
        try {
            await rulesApi.create({
                program_id: selectedProgramId,
                field,
                operator,
                value: value.trim(),
                action,
            });
            setValue("");
            setField("salary");
            setOperator(">=");
            setAction("WARN");
            reload();
        } catch (err) {
            setError(err instanceof Error ? err.message : t("rules.createError"));
        } finally {
            setSaving(false);
        }
    };

    const removeRule = async (rule: Rule) => {
        setError(null);
        try {
            await rulesApi.remove(rule.id);
            reload();
        } catch (err) {
            setError(err instanceof Error ? err.message : t("rules.deleteError"));
        }
    };

    return (
        <Layout>
            <div className="p-6">
                <div className="mb-6 flex items-start justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                            {t("rules.description")}
                        </p>
                        <h1 className="mt-1 text-2xl font-bold text-slate-900">{t("rules.title")}</h1>
                    </div>
                    <button
                        type="button"
                        onClick={reload}
                        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        {t("rules.refresh")}
                    </button>
                </div>

                <div className="mb-6 flex gap-3">
                    {(["REJECT", "REQUIRED", "WARN"] as RuleAction[]).map((a) => (
                        <div
                            key={a}
                            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-center"
                        >
                            <p className="text-xs font-semibold uppercase text-slate-500">{t(actionLabels[a])}</p>
                            <p className="text-xl font-bold text-slate-900">{actionCounts[a]}</p>
                        </div>
                    ))}
                </div>

                <form
                    onSubmit={createRule}
                    className="mb-6 flex flex-wrap items-end gap-3"
                >
                    <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                        {t("programs.program")}
                        <select
                            value={programId}
                            onChange={(e) => setProgramId(e.target.value)}
                            className="rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                        >
                            <option value="">{t("rules.selectProgram")}</option>
                            {programs.map((p) => (
                                <option key={p.id} value={String(p.id)}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                        {t("rules.field")}
                        <select
                            value={field}
                            onChange={(e) => {
                                setField(e.target.value as RuleField);
                                setValue("");
                            }}
                            className="rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                        >
                            {ruleFields.map((f) => (
                                <option key={f} value={f}>
                                    {f}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                        {t("rules.operator")}
                        <select
                            value={operator}
                            onChange={(e) => setOperator(e.target.value as RuleOperator)}
                            className="rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                        >
                            {operators.map((op) => (
                                <option key={op} value={op}>
                                    {op}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                        {t("rules.value")}
                        <input
                            type="text"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder={fieldPlaceholders[field]}
                            className="w-36 rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                        />
                    </label>

                    <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                        {t("rules.action")}
                        <select
                            value={action}
                            onChange={(e) => setAction(e.target.value as RuleAction)}
                            className="rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                        >
                            {actions.map((a) => (
                                <option key={a} value={a}>
                                    {t(actionLabels[a])}
                                </option>
                            ))}
                        </select>
                    </label>

                    <button
                        type="submit"
                        disabled={saving || programs.length === 0}
                        className="rounded-md bg-slate-950 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                        {saving ? t("common.saving") : t("rules.addRule")}
                    </button>
                </form>

                {error && (
                    <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                        {error}
                    </p>
                )}
                {loading && <Card><TableSkeleton /></Card>}

                {!loading && banks.length > 0 && (
                    <div className="mb-4 flex items-center gap-3">
                        <span className="text-sm font-semibold text-slate-600">
                            {t("rules.filterByBank")}
                        </span>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setFilterBankId("all")}
                                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${filterBankId === "all"
                                        ? "bg-slate-900 text-white"
                                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                                    }`}
                            >
                                {t("rules.all")} ({data.length})
                            </button>
                            {banks.map((bank) => {
                                const bankProgIds = new Set(
                                    programs
                                        .filter((p) => p.bank_id === bank.id)
                                        .map((p) => p.id)
                                );
                                const count = data.filter((r) =>
                                    bankProgIds.has(r.program_id)
                                ).length;
                                return (
                                    <button
                                        key={bank.id}
                                        type="button"
                                        onClick={() => setFilterBankId(String(bank.id))}
                                        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${filterBankId === String(bank.id)
                                                ? "bg-blue-600 text-white"
                                                : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                                            }`}
                                    >
                                        {bank.name} ({count})
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                <DataTable<Rule>
                    data={filteredData}
                    columns={[
                        { key: "id", label: t("common.id") },
                        { key: "program_id", label: t("programs.program") },
                        { key: "field", label: t("rules.field") },
                        { key: "operator", label: t("rules.operator") },
                        { key: "value", label: t("rules.value") },
                        { key: "action", label: t("rules.action") },
                    ]}
                    onDelete={isWriteRole ? removeRule : undefined}
                />
            </div>
        </Layout>
    );
}
