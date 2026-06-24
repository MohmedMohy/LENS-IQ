import { useState } from "react";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import Layout from "@/components/layout/Layout";
import DataTable from "@/components/data-display/DataTable";
import PageHeader from "@/components/navigation/PageHeader";
import Card from "@/components/ui/card/Card";
import { TableSkeleton } from "@/components/ui/skeleton";
import { customersApi } from "@/features/Customers/api/customers.api";
import { queryKeys } from "@/lib/Querykeys";
import type { Customer, CreateCustomerPayload, UpdateCustomerPayload } from "@/types";
import { useAuthStore } from "@/store/auth.store";

// ── Zod schema (تم تحديثه لحل مشاكل الحقول الفارغة) ────────────────────────

const customerSchema = z.object({
    name: z.string().min(1, "Name is required"),

    national_id: z.string().length(14, "Must be exactly 14 digits"),

    phone: z
        .string()
        .min(11)
        .regex(/^01[0-2,5]{1}[0-9]{8}$/, "Invalid Egyptian phone number"),

    birth_date: z.string().min(1, "Birth date is required"),

    salary: z.coerce.number().positive("Must be greater than 0"),

    job_type: z.enum([
        "private",
        "government",
        "corporate",
        "freelancer",
        "retired",
    ]),

    current_liabilities: z.coerce.number().min(0).default(0),

    additional_income: z.coerce.number().min(0).default(0),

    employer_name: z.string().nullish(),

    employment_tenure_months: z.coerce
        .number()
        .int()
        .nonnegative()
        .nullish(),

    insurance_number: z.string().nullish(),

    club_membership: z.string().nullish(),

    marital_status: z
        .enum(["single", "married", "divorced", "widowed"])
        .nullish(),

    owns_property: z.boolean().default(false),

    owns_car: z.boolean().default(false),

    salary_transfer: z.boolean().default(false),

    tax_card: z.string().nullish(),

    commercial_registry: z.string().nullish(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

// ── Helpers ───────────────────────────────────────────────────────────────────

const JOB_TYPE_KEYS: Record<string, string> = {
    private: "customers.privateSector",
    government: "customers.government",
    corporate: "customers.corporate",
    freelancer: "customers.freelancer",
    retired: "customers.retired",
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

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="col-span-full mt-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
            {children}
        </p>
    );
}

// ── Customer Form ─────────────────────────────────────────────────────────────

type CustomerFormProps = {
    initial?: Partial<CustomerFormValues>;
    saving: boolean;
    error: string | null;
    submitLabel: string;
    onSubmit: (data: CustomerFormValues) => void;
    onCancel?: () => void;
};

function CustomerForm({ initial, saving, error, submitLabel, onSubmit, onCancel }: CustomerFormProps) {
    const { t } = useTranslation();
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CustomerFormValues>({
        resolver: zodResolver(customerSchema) as unknown as Resolver<CustomerFormValues>,
        defaultValues: {
            job_type: "private",
            current_liabilities: 0,
            additional_income: 0,
            owns_property: false,
            owns_car: false,
            salary_transfer: false,
            tax_card: undefined,
            commercial_registry: undefined,
            ...initial,
        },
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <SectionLabel>{t("customers.personalInfo")}</SectionLabel>

                    <Field label={t("customers.fullName")}>
                        <input {...register("name")} placeholder="Ahmed Mohamed" className={INPUT_CLS} />
                        <FieldError message={errors.name?.message} />
                    </Field>

                    <Field label={t("customers.nationalId")}>
                        <input {...register("national_id")} placeholder="29901011234567" maxLength={14} className={INPUT_CLS} />
                        <FieldError message={errors.national_id?.message} />
                    </Field>

                    <Field label={t("customers.phone")}>
                        <input {...register("phone")} placeholder="01012345678" className={INPUT_CLS} />
                        <FieldError message={errors.phone?.message} />
                    </Field>

                    <Field label={t("customers.birthDate")}>
                        <input type="date" {...register("birth_date")} className={INPUT_CLS} />
                        <FieldError message={errors.birth_date?.message} />
                    </Field>

                    <Field label={t("customers.maritalStatus")}>
                        <select {...register("marital_status")} className={SELECT_CLS}>
                            <option value="">{t("customers.select")}</option>
                            <option value="single">{t("customers.single")}</option>
                            <option value="married">{t("customers.married")}</option>
                            <option value="divorced">{t("customers.divorced")}</option>
                            <option value="widowed">{t("customers.widowed")}</option>
                        </select>
                    </Field>

                    <SectionLabel>{t("customers.employment")}</SectionLabel>

                    <Field label={t("customers.monthlyIncome")}>
                        <input type="number" min={0} step="any" {...register("salary")} placeholder="15000" className={INPUT_CLS} />
                        <FieldError message={errors.salary?.message} />
                    </Field>

                    <Field label={t("customers.jobType")}>
                        <select {...register("job_type")} className={SELECT_CLS}>
                            {Object.entries(JOB_TYPE_KEYS).map(([v, key]) => (
                                <option key={v} value={v}>
                                    {t(key)}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label={t("customers.employerName")}>
                        <input {...register("employer_name")} placeholder="ABC Company" className={INPUT_CLS} />
                    </Field>

                    <Field label={t("customers.tenure")}>
                        <input type="number" min={0} {...register("employment_tenure_months")} placeholder="24" className={INPUT_CLS} />
                    </Field>

                    <SectionLabel>{t("customers.financial")}</SectionLabel>

                    <Field label={t("customers.monthlyLiabilities")}>
                        <input type="number" min={0} step="any" {...register("current_liabilities")} placeholder="0" className={INPUT_CLS} />
                        <FieldError message={errors.current_liabilities?.message} />
                    </Field>

                    <Field label={t("customers.additionalIncome")}>
                        <input type="number" min={0} step="any" {...register("additional_income")} placeholder="0" className={INPUT_CLS} />
                    </Field>

                    <SectionLabel>{t("customers.otherDetails")}</SectionLabel>

                    <Field label={t("customers.insuranceNumber")}>
                        <input {...register("insurance_number")} placeholder="123456789" className={INPUT_CLS} />
                    </Field>

                    <Field label={t("customers.clubMembership")}>
                        <input {...register("club_membership")} placeholder="Gezira Club" className={INPUT_CLS} />
                    </Field>

                    <Field label={t("customers.taxCard")}>
                        <input {...register("tax_card")} placeholder="Tax card number" className={INPUT_CLS} />
                    </Field>

                    <Field label={t("customers.commercialRegistry")}>
                        <input {...register("commercial_registry")} placeholder="Commercial registry number" className={INPUT_CLS} />
                    </Field>

                <div className="col-span-full grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {[
                        { key: "salary_transfer" as const, label: t("customers.salaryTransfer"), desc: t("customers.salaryTransferDesc") },
                        { key: "owns_property" as const, label: t("customers.ownsProperty"), desc: t("customers.ownsPropertyDesc") },
                        { key: "owns_car" as const, label: t("customers.ownsCar"), desc: t("customers.ownsCarDesc") },
                    ].map((item) => (
                        <label key={item.key} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-slate-300">
                            <input type="checkbox" {...register(item.key)} className="h-4 w-4 accent-blue-600" />
                            <div>
                                <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                                <p className="text-xs text-slate-500">{item.desc}</p>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {error}
                </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
                {onCancel && (
                    <button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        {t("common.cancel")}
                    </button>
                )}
                <button type="submit" disabled={saving} className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400">
                    {saving ? t("common.saving") : submitLabel}
                </button>
            </div>
        </form>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CustomersPage() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const tenant = useAuthStore((s) => s.tenant);
    const isWriteRole = tenant?.role === "ADMIN" || tenant?.role === "MANAGER";
    const [showForm, setShowForm] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [editError, setEditError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    const { data: customers = [], isLoading, error } = useQuery({
        queryKey: queryKeys.customers,
        queryFn: customersApi.getAll,
    });

    const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.customers });

    const createMutation = useMutation({
        mutationFn: customersApi.create,
        onSuccess: () => {
            setShowForm(false);
            setFormError(null);
            void invalidate();
            toast.success(t("toasts.created"));
        },
        onError: (err: Error) => setFormError(err.message),
    });

    const updateMutation = useMutation<Customer, Error, { id: number; payload: UpdateCustomerPayload }>({
        mutationFn: ({ id, payload }) => customersApi.update(id, payload),
        onSuccess: () => {
            setEditingCustomer(null);
            setEditError(null);
            void invalidate();
            toast.success(t("toasts.updated"));
        },
        onError: (err: Error) => setEditError(err.message),
    });

    const deleteMutation = useMutation({
        mutationFn: (c: Customer) => customersApi.remove(c.id),
        onSuccess: (_data, c) => {
            void invalidate();
            toast.success(t("toasts.deleted", { name: c.name }));
        },
        onError: () => toast.error(t("toasts.failed")),
    });

    // إصلاح: حماية دالة البحث من القيم الفارغة لمنع الانهيار
    const filtered = customers.filter((c) =>
        (c.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.national_id || "").includes(search) ||
        (c.phone || "").includes(search)
    );

    return (
        <Layout>
        <PageHeader
            title={t("customers.title")}
            description={t("customers.description")}
            action={isWriteRole ? () => setShowForm((v) => !v) : undefined}
            actionLabel={showForm ? t("common.cancel") : t("customers.addCustomer")}
        />

        {isWriteRole && showForm && (
            <Card className="mb-6">
                <p className="mb-4 text-sm font-semibold text-slate-700">{t("customers.newCustomer")}</p>
                <CustomerForm
                    saving={createMutation.isPending}
                    error={formError}
                    submitLabel={t("customers.addCustomer")}
                    onSubmit={(data) => {
                        const payload = {
                            ...data,
                            employer_name: data.employer_name ?? null,
                            employment_tenure_months: data.employment_tenure_months ?? null,
                            insurance_number: data.insurance_number ?? null,
                            club_membership: data.club_membership ?? null,
                            marital_status: data.marital_status ?? null,
                            tax_card: data.tax_card ?? null,
                            commercial_registry: data.commercial_registry ?? null,
                        };
                        createMutation.mutate(payload as CreateCustomerPayload);
                    }}
                    onCancel={() => {
                        setShowForm(false);
                        setFormError(null);
                    }}
                />
            </Card>
        )}

        <Card className="mb-6">
            <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("customers.search")}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
        </Card>

{
    error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700" >
            {(error as Error).message
}
</div>
            )}

{
    isLoading ? (
        <Card><TableSkeleton /></Card>
            ) : (
        <Card>
        <div className= "mb-3 flex items-center justify-between" >
        <p className="text-sm font-medium text-slate-500" >
             {t("customers.count", { count: filtered.length })} {search ? t("customers.found") : t("customers.total")}
    </p>
        </div>
        < DataTable<Customer>
                    data={filtered}
                    columns={[
                        { key: "id", label: t("customers.id") },
                        { key: "name", label: t("customers.nameField") },
                        { key: "national_id", label: t("customers.nationalId") },
                        { key: "phone", label: t("customers.phone") },
                        { key: "job_type", label: t("customers.jobType"), render: (value) => t(JOB_TYPE_KEYS[value as string] ?? (value as string)) },
                        { key: "salary", label: t("customers.salary") },
                        { key: "current_liabilities", label: t("customers.liabilities") },
                        { key: "salary_transfer", label: t("customers.salaryTransfer") },
                    ]}
                    onEdit={isWriteRole ? (c) => setEditingCustomer(c) : undefined}
                    onDelete={isWriteRole ? (c) => deleteMutation.mutate(c) : undefined}
                />
    </Card>
            )}

        {editingCustomer && (
            <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-10">
                <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
                    <h2 className="mb-1 text-xl font-bold text-slate-900">{t("customers.editCustomer")}</h2>
                    <p className="mb-6 text-sm text-slate-500">
                        {editingCustomer.name} — {t("customers.idLabel")}: {editingCustomer.national_id}
                    </p>
                    <CustomerForm
                        initial={{
                            name: editingCustomer.name,
                            national_id: editingCustomer.national_id,
                            phone: editingCustomer.phone,
                            birth_date: editingCustomer.birth_date?.slice(0, 10),
                            salary: editingCustomer.salary,
                            job_type: editingCustomer.job_type,
                            current_liabilities: editingCustomer.current_liabilities,
                            additional_income: editingCustomer.additional_income,
                            employer_name: editingCustomer.employer_name ?? undefined,
                            employment_tenure_months: editingCustomer.employment_tenure_months ?? undefined,
                            insurance_number: editingCustomer.insurance_number ?? undefined,
                            club_membership: editingCustomer.club_membership ?? undefined,
                            marital_status: editingCustomer.marital_status ?? undefined,
                            owns_property: editingCustomer.owns_property,
                            owns_car: editingCustomer.owns_car,
                            salary_transfer: editingCustomer.salary_transfer,
                            tax_card: editingCustomer.tax_card ?? undefined,
                            commercial_registry: editingCustomer.commercial_registry ?? undefined,
                        }}
                        saving={updateMutation.isPending}
                        error={editError}
                        submitLabel={t("common.saveChanges")}
                        onSubmit={(data) => {
                            const payload = {
                                ...data,
                                employer_name: data.employer_name ?? null,
                                employment_tenure_months: data.employment_tenure_months ?? null,
                            insurance_number: data.insurance_number ?? null,
                            club_membership: data.club_membership ?? null,
                            marital_status: data.marital_status ?? null,
                            tax_card: data.tax_card ?? null,
                            commercial_registry: data.commercial_registry ?? null,
                        };
                            updateMutation.mutate({ id: editingCustomer.id, payload: payload as UpdateCustomerPayload });
                        }}
                        onCancel={() => {
                            setEditingCustomer(null);
                            setEditError(null);
                        }}
                    />
                </div>
            </div>
        )}
        </Layout>
    );
}