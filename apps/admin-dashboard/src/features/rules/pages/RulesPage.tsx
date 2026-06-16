// src/pages/rules/RulesPage.tsx

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Layout from "@/components/layout/Layout";
import DataTable from "@/components/data-display/DataTable";
import { banksApi } from "@/features/banks/api/banks.api";
import { programsApi } from "@/features/programs/api/programs.api";
import { rulesApi } from "@/features/rules/api/rules.api";
import type { Bank, Program, Rule, RuleAction, RuleField, RuleOperator } from "@/types";

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

export default function RulesPage() {
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
                if (mounted) setError(err instanceof Error ? err.message : "Unable to load rules.");
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
            setError("Program and value are required.");
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
            setError(err instanceof Error ? err.message : "Could not add rule.");
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
            setError(err instanceof Error ? err.message : "Could not delete rule.");
        }
    };

    return (
        <Layout>
            <div className="p-6">
                <div className="mb-6 flex items-start justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                            Decision engine
                        </p>
                        <h1 className="mt-1 text-2xl font-bold text-slate-900">Rules</h1>
                    </div>
                    <button
                        type="button"
                        onClick={reload}
                        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Refresh
                    </button>
                </div>

                {/* Counts */}
                <div className="mb-6 flex gap-3">
                    {(["REJECT", "REQUIRED", "WARN"] as RuleAction[]).map((a) => (
                        <div
                            key={a}
                            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-center"
                        >
                            <p className="text-xs font-semibold uppercase text-slate-500">{a}</p>
                            <p className="text-xl font-bold text-slate-900">{actionCounts[a]}</p>
                        </div>
                    ))}
                </div>

                {/* Create form */}
                <form
                    onSubmit={createRule}
                    className="mb-6 flex flex-wrap items-end gap-3"
                >
                    <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                        Program
                        <select
                            value={programId}
                            onChange={(e) => setProgramId(e.target.value)}
                            className="rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                        >
                            <option value="">Select program</option>
                            {programs.map((p) => (
                                <option key={p.id} value={String(p.id)}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                        Field
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
                        Operator
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
                        Value
                        <input
                            type="text"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder={fieldPlaceholders[field]}
                            className="w-36 rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                        />
                    </label>

                    <label className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
                        Action
                        <select
                            value={action}
                            onChange={(e) => setAction(e.target.value as RuleAction)}
                            className="rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                        >
                            {actions.map((a) => (
                                <option key={a} value={a}>
                                    {a}
                                </option>
                            ))}
                        </select>
                    </label>

                    <button
                        type="submit"
                        disabled={saving || programs.length === 0}
                        className="rounded-md bg-slate-950 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                        {saving ? "Saving..." : "Add rule"}
                    </button>
                </form>

                {error && (
                    <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                        {error}
                    </p>
                )}
                {loading && <p className="text-slate-500">Loading rules...</p>}

                {/* Bank filter */}
                {!loading && banks.length > 0 && (
                    <div className="mb-4 flex items-center gap-3">
                        <span className="text-sm font-semibold text-slate-600">
                            Filter by bank:
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
                                All ({data.length})
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
                        { key: "id", label: "ID" },
                        { key: "program_id", label: "Program" },
                        { key: "field", label: "Field" },
                        { key: "operator", label: "Operator" },
                        { key: "value", label: "Value" },
                        { key: "action", label: "Action" },
                    ]}
                    onDelete={removeRule}
                />
            </div>
        </Layout>
    );
}