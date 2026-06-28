import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { publicApi } from "@/features/apply/api/public.api";
import type { PublicVehicle, ApplyPayload } from "@/features/apply/api/public.api";

// ── Types ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4;

type CustomerForm = ApplyPayload["customer"];
type AppForm = {
    vehicle_id: number | null;
    requested_down_payment: number;
    requested_months: number;
    payment_method: ApplyPayload["payment_method"];
    notes: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const INPUT =
    "w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white";

const SELECT =
    "w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 bg-white";

function Label({ children }: { children: React.ReactNode }) {
    return (
        <p className="mb-1.5 text-sm font-semibold text-slate-700">
            {children}
        </p>
    );
}

function FieldGroup({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <Label>{label}</Label>
            {children}
        </div>
    );
}

function StepIndicator({ current }: { current: Step }) {
    const steps = [
        { n: 1, label: "السيارة" },
        { n: 2, label: "البيانات الشخصية" },
        { n: 3, label: "البيانات المالية" },
        { n: 4, label: "تفاصيل الطلب" },
    ];

    return (
        <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((s, i) => (
                <div key={s.n} className="flex items-center gap-2">
                    <div className="flex flex-col items-center gap-1">
                        <div
                            className={[
                                "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                                current === s.n
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                                    : current > s.n
                                        ? "bg-green-500 text-white"
                                        : "bg-slate-100 text-slate-400",
                            ].join(" ")}
                        >
                            {current > s.n ? "✓" : s.n}
                        </div>
                        <span
                            className={[
                                "text-xs hidden sm:block",
                                current === s.n
                                    ? "text-blue-600 font-semibold"
                                    : "text-slate-400",
                            ].join(" ")}
                        >
                            {s.label}
                        </span>
                    </div>
                    {i < steps.length - 1 && (
                        <div
                            className={[
                                "h-0.5 w-8 sm:w-16 mb-5",
                                current > s.n ? "bg-green-400" : "bg-slate-200",
                            ].join(" ")}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}

// ── Step 1 — Vehicle Selection ────────────────────────────────────────────────

function Step1({
    vehicles,
    selectedId,
    onSelect,
}: {
    vehicles: PublicVehicle[];
    selectedId: number | null;
    onSelect: (id: number) => void;
}) {
    if (vehicles.length === 0) {
        return (
            <div className="py-12 text-center text-slate-400">
                لا توجد سيارات متاحة حالياً
            </div>
        );
    }

    return (
        <div className="grid gap-3 sm:grid-cols-2">
            {vehicles.map((v) => {
                const selected = v.id === selectedId;
                return (
                    <button
                        key={v.id}
                        type="button"
                        onClick={() => onSelect(v.id)}
                        className={[
                            "rounded-2xl border-2 p-4 text-start transition-all",
                            selected
                                ? "border-blue-500 bg-blue-50 shadow-md"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm",
                        ].join(" ")}
                    >
                        <div className="flex items-start justify-between">
                            <div
                                className={[
                                    "h-5 w-5 rounded-full border-2 mt-1 flex-shrink-0 transition-all",
                                    selected
                                        ? "border-blue-500 bg-blue-500"
                                        : "border-slate-300",
                                ].join(" ")}
                            />
                            <div className="text-start">
                                <p className="font-bold text-slate-900">
                                    {v.brand} {v.model}
                                </p>
                                <p className="text-sm text-slate-500 mt-0.5">
                                    {v.manufacturing_year} —{" "}
                                    {v.condition === "new" ? "جديدة" : "مستعملة"}
                                </p>
                                <p className="text-lg font-bold text-blue-600 mt-2">
                                    {v.price.toLocaleString("ar-EG")} ج.م
                                </p>
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

// ── Step 2 — Personal Info ────────────────────────────────────────────────────

function Step2({
    form,
    onChange,
}: {
    form: CustomerForm;
    onChange: <K extends keyof CustomerForm>(k: K, v: CustomerForm[K]) => void;
}) {
    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <FieldGroup label="الاسم كاملاً *">
                <input
                    value={form.name}
                    onChange={(e) => onChange("name", e.target.value)}
                    placeholder="محمد أحمد علي"
                    className={INPUT}
                    required
                />
            </FieldGroup>

            <FieldGroup label="الرقم القومي *">
                <input
                    value={form.national_id}
                    onChange={(e) => onChange("national_id", e.target.value)}
                    placeholder="29901011234567"
                    maxLength={14}
                    className={INPUT}
                    required
                />
            </FieldGroup>

            <FieldGroup label="رقم الموبايل *">
                <input
                    value={form.phone}
                    onChange={(e) => onChange("phone", e.target.value)}
                    placeholder="01012345678"
                    maxLength={11}
                    className={INPUT}
                    required
                />
            </FieldGroup>

            <FieldGroup label="تاريخ الميلاد *">
                <input
                    type="date"
                    value={form.birth_date}
                    onChange={(e) => onChange("birth_date", e.target.value)}
                    className={INPUT}
                    required
                />
            </FieldGroup>

            <FieldGroup label="الحالة الاجتماعية">
                <select
                    value={form.marital_status ?? ""}
                    onChange={(e) =>
                        onChange(
                            "marital_status",
                            (e.target.value as CustomerForm["marital_status"]) || undefined
                        )
                    }
                    className={SELECT}
                >
                    <option value="">اختر</option>
                    <option value="single">أعزب</option>
                    <option value="married">متزوج</option>
                    <option value="divorced">مطلق</option>
                    <option value="widowed">أرمل</option>
                </select>
            </FieldGroup>
        </div>
    );
}

// ── Step 3 — Financial Info ───────────────────────────────────────────────────

function Step3({
    form,
    onChange,
}: {
    form: CustomerForm;
    onChange: <K extends keyof CustomerForm>(k: K, v: CustomerForm[K]) => void;
}) {
    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <FieldGroup label="الراتب الشهري الصافي (ج.م) *">
                <input
                    type="number"
                    min={0}
                    value={form.salary || ""}
                    onChange={(e) => onChange("salary", Number(e.target.value))}
                    placeholder="15000"
                    className={INPUT}
                    required
                />
            </FieldGroup>

            <FieldGroup label="طبيعة العمل *">
                <select
                    value={form.job_type}
                    onChange={(e) =>
                        onChange("job_type", e.target.value as CustomerForm["job_type"])
                    }
                    className={SELECT}
                >
                    <option value="government">حكومي</option>
                    <option value="private">قطاع خاص</option>
                    <option value="corporate">شركة</option>
                    <option value="freelancer">عمل حر</option>
                    <option value="retired">متقاعد</option>
                </select>
            </FieldGroup>

            <FieldGroup label="جهة العمل">
                <input
                    value={form.employer_name ?? ""}
                    onChange={(e) =>
                        onChange("employer_name", e.target.value || undefined)
                    }
                    placeholder="وزارة التربية والتعليم"
                    className={INPUT}
                />
            </FieldGroup>

            <FieldGroup label="مدة الخدمة (بالشهور)">
                <input
                    type="number"
                    min={0}
                    value={form.employment_tenure_months ?? ""}
                    onChange={(e) =>
                        onChange(
                            "employment_tenure_months",
                            e.target.value ? Number(e.target.value) : undefined
                        )
                    }
                    placeholder="24"
                    className={INPUT}
                />
            </FieldGroup>

            <FieldGroup label="الالتزامات الشهرية الحالية (ج.م) *">
                <input
                    type="number"
                    min={0}
                    value={form.current_liabilities || ""}
                    onChange={(e) =>
                        onChange("current_liabilities", Number(e.target.value))
                    }
                    placeholder="2000"
                    className={INPUT}
                />
            </FieldGroup>

            <FieldGroup label="دخل إضافي (ج.م)">
                <input
                    type="number"
                    min={0}
                    value={form.additional_income || ""}
                    onChange={(e) =>
                        onChange("additional_income", Number(e.target.value))
                    }
                    placeholder="0"
                    className={INPUT}
                />
            </FieldGroup>

            {/* Checkboxes */}
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                    {
                        key: "salary_transfer" as const,
                        label: "تحويل الراتب",
                        desc: "راتبك بيتحول للبنك",
                    },
                    {
                        key: "owns_property" as const,
                        label: "يمتلك عقار",
                        desc: "شقة أو أرض",
                    },
                    {
                        key: "owns_car" as const,
                        label: "يمتلك سيارة",
                        desc: "سيارة حالية",
                    },
                ].map((item) => (
                    <label
                        key={item.key}
                        className={[
                            "flex items-center gap-3 rounded-xl border-2 p-4 cursor-pointer transition-all",
                            form[item.key]
                                ? "border-blue-500 bg-blue-50"
                                : "border-slate-200 bg-white hover:border-slate-300",
                        ].join(" ")}
                    >
                        <input
                            type="checkbox"
                            checked={Boolean(form[item.key])}
                            onChange={(e) => onChange(item.key, e.target.checked)}
                            className="h-4 w-4 accent-blue-600"
                        />
                        <div>
                            <p className="text-sm font-semibold text-slate-800">
                                {item.label}
                            </p>
                            <p className="text-xs text-slate-500">{item.desc}</p>
                        </div>
                    </label>
                ))}
            </div>
        </div>
    );
}

// ── Step 4 — Application Details ──────────────────────────────────────────────

function Step4({
    form,
    vehiclePrice,
    onChange,
}: {
    form: AppForm;
    vehiclePrice: number;
    onChange: <K extends keyof AppForm>(k: K, v: AppForm[K]) => void;
}) {
    const loanAmount = Math.max(0, vehiclePrice - form.requested_down_payment);
    const downPercent = vehiclePrice > 0
        ? ((form.requested_down_payment / vehiclePrice) * 100).toFixed(1)
        : "0";

    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <FieldGroup label="المقدم المطلوب (ج.م) *">
                <input
                    type="number"
                    min={0}
                    max={vehiclePrice}
                    value={form.requested_down_payment || ""}
                    onChange={(e) =>
                        onChange("requested_down_payment", Number(e.target.value))
                    }
                    placeholder="100000"
                    className={INPUT}
                    required
                />
                {vehiclePrice > 0 && (
                    <p className="mt-1 text-xs text-slate-500">
                        {downPercent}% من سعر السيارة —
                        مبلغ التمويل:{" "}
                        <span className="font-semibold text-blue-600">
                            {loanAmount.toLocaleString("ar-EG")} ج.م
                        </span>
                    </p>
                )}
            </FieldGroup>

            <FieldGroup label="عدد الأشهر *">
                <select
                    value={form.requested_months}
                    onChange={(e) =>
                        onChange("requested_months", Number(e.target.value))
                    }
                    className={SELECT}
                >
                    {[12, 24, 36, 48, 60, 72, 84].map((m) => (
                        <option key={m} value={m}>
                            {m} شهر ({Math.floor(m / 12)} سنة
                            {m % 12 > 0 ? ` و ${m % 12} شهر` : ""})
                        </option>
                    ))}
                </select>
            </FieldGroup>

            <FieldGroup label="طريقة الدفع *">
                <select
                    value={form.payment_method}
                    onChange={(e) =>
                        onChange(
                            "payment_method",
                            e.target.value as AppForm["payment_method"]
                        )
                    }
                    className={SELECT}
                >
                    <option value="bank_account">حساب بنكي</option>
                    <option value="salary_transfer">تحويل راتب</option>
                    <option value="cash_proof">إثبات دخل</option>
                </select>
            </FieldGroup>

            <FieldGroup label="ملاحظات إضافية">
                <textarea
                    value={form.notes}
                    onChange={(e) => onChange("notes", e.target.value)}
                    placeholder="أي تفاصيل إضافية..."
                    rows={3}
                    className={INPUT + " resize-none sm:col-span-2"}
                />
            </FieldGroup>
        </div>
    );
}

// ── Success Screen ────────────────────────────────────────────────────────────

function SuccessScreen({ applicationId }: { applicationId: number }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
                <span className="text-4xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
                تم إرسال الطلب بنجاح
            </h2>
            <p className="text-slate-500 mb-4">
                رقم طلبك هو{" "}
                <span className="font-bold text-blue-600">#{applicationId}</span>
            </p>
            <p className="text-sm text-slate-400 max-w-sm">
                سيتواصل معك المعرض في أقرب وقت لإعلامك بنتيجة التقييم
            </p>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const defaultCustomer: CustomerForm = {
    name: "",
    national_id: "",
    phone: "",
    birth_date: "",
    salary: 0,
    job_type: "private",
    current_liabilities: 0,
    additional_income: 0,
    owns_property: false,
    owns_car: false,
    salary_transfer: false,
};

const defaultApp: AppForm = {
    vehicle_id: null,
    requested_down_payment: 0,
    requested_months: 36,
    payment_method: "bank_account",
    notes: "",
};

export default function ApplyPage() {
    const { code } = useParams<{ code: string }>();

    const [step, setStep] = useState<Step>(1);
    const [vehicles, setVehicles] = useState<PublicVehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmit] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [appId, setAppId] = useState<number | null>(null);

    const [customer, setCustomer] = useState<CustomerForm>(defaultCustomer);
    const [appForm, setAppForm] = useState<AppForm>(defaultApp);

    const setC = <K extends keyof CustomerForm>(k: K, v: CustomerForm[K]) =>
        setCustomer((p) => ({ ...p, [k]: v }));

    const setA = <K extends keyof AppForm>(k: K, v: AppForm[K]) =>
        setAppForm((p) => ({ ...p, [k]: v }));

    useEffect(() => {
        if (!code) return;
        publicApi
            .getVehicles(code)
            .then(setVehicles)
            .catch(() => setError("رمز المعرض غير صحيح أو انتهت صلاحيته"))
            .finally(() => setLoading(false));
    }, [code]);

    const selectedVehicle = vehicles.find((v) => v.id === appForm.vehicle_id);

    const canNext = (): boolean => {
        if (step === 1) return appForm.vehicle_id !== null;
        if (step === 2)
            return (
                customer.name.trim().length > 2 &&
                customer.national_id.length === 14 &&
                customer.phone.length === 11 &&
                customer.birth_date.length > 0
            );
        if (step === 3) return customer.salary > 0;
        if (step === 4)
            return (
                appForm.requested_down_payment >= 0 &&
                appForm.requested_months > 0
            );
        return false;
    };

    const handleSubmit = async () => {
        if (!code || !appForm.vehicle_id) return;
        setSubmit(true);
        setError(null);
        try {
            const res = await publicApi.apply({
                dealer_code: code,
                vehicle_id: appForm.vehicle_id,
                requested_down_payment: appForm.requested_down_payment,
                requested_months: appForm.requested_months,
                payment_method: appForm.payment_method,
                ...(appForm.notes.trim() ? { notes: appForm.notes.trim() } : {}),
                customer,
            });
            setAppId(res.application_id);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "حدث خطأ، يرجى المحاولة مرة أخرى"
            );
        } finally {
            setSubmit(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <p className="text-slate-400 text-sm animate-pulse">
                    جاري التحميل...
                </p>
            </div>
        );
    }

    if (error && !vehicles.length) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
                <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center max-w-sm">
                    <p className="text-2xl mb-3">⚠️</p>
                    <p className="font-semibold text-red-700">{error}</p>
                    <p className="text-sm text-slate-500 mt-2">
                        تأكد من صحة الرابط وحاول مجدداً
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            dir="rtl"
            className="min-h-screen bg-slate-50 flex flex-col items-center py-8 px-4"
        >
            {/* Header */}
            <div className="w-full max-w-2xl mb-6 text-center">
                <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">
                    طلب تمويل سيارة
                </p>
                <h1 className="mt-1 text-2xl font-bold text-slate-900">
                    قدّم طلبك الآن
                </h1>
                {selectedVehicle && (
                    <p className="mt-1 text-sm text-slate-500">
                        {selectedVehicle.brand} {selectedVehicle.model}{" "}
                        {selectedVehicle.manufacturing_year} —{" "}
                        {selectedVehicle.price.toLocaleString("ar-EG")} ج.م
                    </p>
                )}
            </div>

            <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

                {appId !== null ? (
                    <SuccessScreen applicationId={appId} />
                ) : (
                    <>
                        <StepIndicator current={step} />

                        {/* Step Content */}
                        <div className="min-h-[300px]">
                            {step === 1 && (
                                <Step1
                                    vehicles={vehicles}
                                    selectedId={appForm.vehicle_id}
                                    onSelect={(id) => setA("vehicle_id", id)}
                                />
                            )}
                            {step === 2 && (
                                <Step2 form={customer} onChange={setC} />
                            )}
                            {step === 3 && (
                                <Step3 form={customer} onChange={setC} />
                            )}
                            {step === 4 && (
                                <Step4
                                    form={appForm}
                                    vehiclePrice={selectedVehicle?.price ?? 0}
                                    onChange={setA}
                                />
                            )}
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                                {error}
                            </div>
                        )}

                        {/* Navigation */}
                        <div className="mt-6 flex justify-between gap-3">
                            <button
                                type="button"
                                onClick={() => setStep((s) => (s - 1) as Step)}
                                disabled={step === 1}
                                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-30"
                            >
                                السابق
                            </button>

                            {step < 4 ? (
                                <button
                                    type="button"
                                    onClick={() => setStep((s) => (s + 1) as Step)}
                                    disabled={!canNext()}
                                    className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                                >
                                    التالي
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={submitting || !canNext()}
                                    className="rounded-xl bg-slate-950 px-8 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                                >
                                    {submitting ? "جاري الإرسال..." : "إرسال الطلب"}
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>

            <p className="mt-6 text-xs text-slate-400">
                بياناتك محمية وآمنة تماماً
            </p>
        </div>
    );
}