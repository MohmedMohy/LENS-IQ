import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/navigation/PageHeader";
import Card from "@/components/ui/card/Card";
import { CardSkeleton } from "@/components/ui/skeleton";
import { applicationsApi } from "@/features/applications/api/Applications";
import { evaluateApi } from "@/features/evaluate/api/evaluate.api";
import { sendToFinancierApi, type FinancierSubmission } from "@/features/sendToFinancier/api/sendToFinancier.api";
import type { Application, EvaluateResponse } from "@/types";

const REQUIRED_DOCUMENTS = [
  "صورة بطاقة الرقم القومي (سارية)",
  "إثبات الدخل (شهادة راتب / كشف حساب بنكي آخر 6 أشهر)",
  "فاتورة مرافق حديثة (كهرباء / غاز / مياه)",
  "مقدم عقد السيارة المبدئي",
  "شهادة التأمين على السيارة",
  "نموذج طلب التمويل الموقع",
];

export default function SendToFinancierPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const applicationId = Number(id);

  const [application, setApplication] = useState<Application | null>(null);
  const [result, setResult] = useState<EvaluateResponse | null>(null);
  const [submission, setSubmission] = useState<FinancierSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [financierNotes, setFinancierNotes] = useState("");
  const [showDocuments, setShowDocuments] = useState(false);
  const [updatingAppStatus, setUpdatingAppStatus] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const apps = await applicationsApi.getAll();
        const app = apps.find((a) => a.id === applicationId);
        if (!app || !mounted) return;
        setApplication(app);

        const evalRes = await evaluateApi.evaluate({ application_id: applicationId });
        if (mounted) setResult(evalRes);

        const existing = await sendToFinancierApi.getSubmission(applicationId);
        if (mounted) setSubmission(existing);
      } catch {
        if (mounted) toast.error("فشل تحميل بيانات الطلب");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => { mounted = false; };
  }, [applicationId]);

  const bestOffer = result?.bestOffer;

  const handleSubmit = async () => {
    if (!application || !bestOffer) return;
    setSubmitting(true);
    try {
      const sub = await sendToFinancierApi.submitToFinancier(applicationId, {
        bankName: bestOffer.bankName || "البنك",
        programName: bestOffer.programName || "برنامج تمويل",
        installment: bestOffer.installment,
        downPayment: bestOffer.downPayment,
        financeAmount: bestOffer.financeAmount,
        months: bestOffer.months,
        interestRate: bestOffer.interestRate,
      });
      setSubmission(sub);
      toast.success("تم إرسال الطلب إلى الممول بنجاح!");
    } catch {
      toast.error("فشل إرسال الطلب");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecision = async (status: "APPROVED" | "REJECTED") => {
    try {
      await sendToFinancierApi.updateFinancierDecision(applicationId, status, financierNotes);
      setSubmission((prev) => prev ? { ...prev, status, financierNotes } : prev);
      toast.success(status === "APPROVED" ? "تم تأكيد موافقة البنك!" : "تم تسجيل رفض البنك");
    } catch {
      toast.error("فشل تحديث قرار البنك");
    }
  };

  const handleApplicationStatus = async (status: "APPROVED" | "REJECTED") => {
    if (!application) return;
    setUpdatingAppStatus(true);
    try {
      await applicationsApi.updateStatus(applicationId, status);
      setApplication((prev) => prev ? { ...prev, status } : prev);
      toast.success(status === "APPROVED" ? "تمت الموافقة على الطلب" : "تم رفض الطلب");
    } catch {
      toast.error("فشل تحديث حالة الطلب");
    } finally {
      setUpdatingAppStatus(false);
    }
  };

  const handleWhatsApp = () => {
    if (!application?.customer_name || !application?.phone) {
      toast.error("رقم الهاتف غير متاح");
      return;
    }
    const raw = application.phone.replace(/[^0-9]/g, "");
    const normalized = raw.startsWith("01") ? `2${raw}` : raw.startsWith("201") ? raw : `2${raw}`;
    const bankName = bestOffer?.bankName || "البنك";
    const msg = encodeURIComponent(
      `السلام عليكم ${application.customer_name}،\n` +
      `نود إعلامكم بأن طلب تمويلكم قد تم تقديمه إلى ${bankName}. ` +
      `مبلغ التمويل: ${(bestOffer?.financeAmount || 0).toLocaleString("en-EG")} جنيه - القسط الشهري: ${(bestOffer?.installment || 0).toLocaleString("en-EG")} جنيه.\n` +
      `سنوافيكم بأي مستجدات. شكراً لتعاملكم معنا.`
    );
    window.open(`https://wa.me/${normalized}?text=${msg}`, "_blank");
  };

  if (loading) {
    return (
      <Layout>
        <PageHeader title="إرسال للممول" description="جاري تحميل بيانات الطلب..." />
        <Card><CardSkeleton lines={8} /></Card>
      </Layout>
    );
  }

  if (!application) {
    return (
      <Layout>
        <PageHeader title="إرسال للممول" description="لم يتم العثور على الطلب" />
        <Card>
          <p style={{ color: "var(--text-muted)" }}>الطلب غير موجود أو تم حذفه.</p>
          <button
            type="button"
            onClick={() => navigate("/evaluate")}
            className="glass-btn glass-btn-primary mt-4 px-6 py-2 text-sm"
          >
            العودة للتقييم
          </button>
        </Card>
      </Layout>
    );
  }

  const isSubmitted = submission && submission.status !== "PENDING";

  return (
    <Layout>
      <PageHeader
        title="إرسال للممول"
        description={`طلب تمويل: ${application.customer_name}`}
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {/* Customer & Vehicle Info */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              بيانات العميل والمركبة
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>اسم العميل</p>
                <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{application.customer_name}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>رقم الهاتف</p>
                <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }} dir="ltr">{application.phone}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>المركبة</p>
                <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{application.brand} {application.model} ({application.manufacturing_year})</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>سعر المركبة</p>
                <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{Number(application.price).toLocaleString("en-EG")} EGP</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>الراتب</p>
                <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{Number(application.salary).toLocaleString("en-EG")} EGP</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>الدفعة المقدمة</p>
                <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{Number(application.requested_down_payment).toLocaleString("en-EG")} EGP</p>
              </div>
            </div>
          </motion.div>

          {/* Application Approve / Reject */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              حالة الطلب
            </h3>
            <div className="flex items-center gap-4 mb-4">
              <span
                className="rounded-full px-4 py-1.5 text-sm font-bold"
                style={{
                  background: application.status === "APPROVED" ? "rgba(16,185,129,0.15)" : application.status === "REJECTED" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)",
                  color: application.status === "APPROVED" ? "var(--success)" : application.status === "REJECTED" ? "var(--error-light)" : "var(--warning)",
                  border: `1px solid ${application.status === "APPROVED" ? "rgba(16,185,129,0.3)" : application.status === "REJECTED" ? "rgba(239,68,68,0.3)" : "rgba(245,158,11,0.3)"}`,
                }}
              >
                {application.status === "APPROVED" ? "✅ مقبول" : application.status === "REJECTED" ? "❌ مرفوض" : application.status === "CANCELLED" ? "ملغي" : "⏳ قيد الانتظار"}
              </span>
            </div>
            {application.status === "PENDING" && (
              <div className="flex flex-wrap gap-3">
                <motion.button
                  type="button"
                  disabled={updatingAppStatus}
                  className="glass-btn rounded-xl px-6 py-2.5 text-sm font-semibold"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ background: "rgba(16,185,129,0.15)", color: "var(--success)", border: "1px solid rgba(16,185,129,0.3)" }}
                  onClick={() => handleApplicationStatus("APPROVED")}
                >
                  {updatingAppStatus ? "..." : "موافقة على الطلب"}
                </motion.button>
                <motion.button
                  type="button"
                  disabled={updatingAppStatus}
                  className="glass-btn rounded-xl px-6 py-2.5 text-sm font-semibold"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ background: "rgba(239,68,68,0.15)", color: "var(--error-light)", border: "1px solid rgba(239,68,68,0.3)" }}
                  onClick={() => handleApplicationStatus("REJECTED")}
                >
                  {updatingAppStatus ? "..." : "رفض الطلب"}
                </motion.button>
              </div>
            )}
          </motion.div>

          {/* Offer Details */}
          {bestOffer && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6"
            >
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                عرض التمويل المُرسل
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>البنك</p>
                  <p className="font-bold" style={{ color: "var(--text-primary)" }}>{bestOffer.bankName || "—"}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>البرنامج</p>
                  <p className="font-bold" style={{ color: "var(--text-primary)" }}>{bestOffer.programName || "—"}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>مبلغ التمويل</p>
                  <p className="font-bold text-lg" style={{ color: "var(--success)" }}>{bestOffer.financeAmount.toLocaleString("en-EG", { maximumFractionDigits: 0 })} EGP</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>القسط الشهري</p>
                  <p className="font-bold" style={{ color: "var(--text-primary)" }}>{bestOffer.installment.toLocaleString("en-EG", { maximumFractionDigits: 0 })} EGP</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>المدة</p>
                  <p className="font-bold" style={{ color: "var(--text-primary)" }}>{bestOffer.months} شهر</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>نسبة الفائدة</p>
                  <p className="font-bold" style={{ color: "var(--text-primary)" }}>{bestOffer.interestRate.toFixed(1)}%</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Required Documents */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                متطلبات البنك — المستندات المطلوبة
              </h3>
              <button
                type="button"
                onClick={() => setShowDocuments(!showDocuments)}
                className="text-xs font-semibold underline"
                style={{ color: "var(--primary-light)" }}
              >
                {showDocuments ? "إخفاء" : "عرض الكل"}
              </button>
            </div>
            {showDocuments && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-4 space-y-2"
              >
                {REQUIRED_DOCUMENTS.map((doc, i) => (
                  <div key={doc} className="flex items-center gap-3 rounded-xl p-3" style={{ background: "var(--bg-card)" }}>
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ background: "rgba(79,70,229,0.15)", color: "var(--primary-light)" }}>
                      {i + 1}
                    </span>
                    <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{doc}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </motion.div>

          {/* Bank Decision */}
          {isSubmitted && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-6"
            >
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                قرار البنك
              </h3>
              <div className="flex items-center gap-4 mb-4">
                <span
                  className="rounded-full px-4 py-1.5 text-sm font-bold"
                  style={{
                    background: submission?.status === "APPROVED" ? "rgba(16,185,129,0.15)" : submission?.status === "REJECTED" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)",
                    color: submission?.status === "APPROVED" ? "var(--success)" : submission?.status === "REJECTED" ? "var(--error-light)" : "var(--warning)",
                    border: `1px solid ${submission?.status === "APPROVED" ? "rgba(16,185,129,0.3)" : submission?.status === "REJECTED" ? "rgba(239,68,68,0.3)" : "rgba(245,158,11,0.3)"}`,
                  }}
                >
                  {submission?.status === "APPROVED" ? "✅ موافقة" : submission?.status === "REJECTED" ? "❌ رفض" : "⏳ قيد المراجعة"}
                </span>
              </div>

              <div className="flex flex-wrap gap-3">
                <motion.button
                  type="button"
                  className="glass-btn rounded-xl px-6 py-2.5 text-sm font-semibold"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ background: "rgba(16,185,129,0.15)", color: "var(--success)", border: "1px solid rgba(16,185,129,0.3)" }}
                  onClick={() => handleDecision("APPROVED")}
                >
                  تأكيد موافقة البنك
                </motion.button>
                <motion.button
                  type="button"
                  className="glass-btn rounded-xl px-6 py-2.5 text-sm font-semibold"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ background: "rgba(239,68,68,0.15)", color: "var(--error-light)", border: "1px solid rgba(239,68,68,0.3)" }}
                  onClick={() => handleDecision("REJECTED")}
                >
                  تسجيل رفض البنك
                </motion.button>
              </div>

              <div className="mt-4">
                <label className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>ملاحظات البنك</label>
                <textarea
                  value={financierNotes}
                  onChange={(e) => setFinancierNotes(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-xl border p-3 text-sm"
                  style={{ background: "var(--bg-card)", borderColor: "var(--glass-border)", color: "var(--text-primary)" }}
                  placeholder="أي ملاحظات من البنك..."
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-4">
          <Card>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              الإجراءات
            </h3>
            <div className="space-y-3">
              {!isSubmitted && (
                <motion.button
                  type="button"
                  disabled={!bestOffer || submitting}
                  className="w-full rounded-xl py-3 text-sm font-semibold"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    background: "linear-gradient(135deg, var(--success), #059669)",
                    color: "#fff",
                    boxShadow: "0 2px 16px rgba(16,185,129,0.3)",
                    opacity: !bestOffer || submitting ? 0.5 : 1,
                  }}
                  onClick={handleSubmit}
                >
                  {submitting ? "جاري الإرسال..." : "إرسال إلى الممول"}
                </motion.button>
              )}

              <motion.button
                type="button"
                className="glass-btn glass-btn-primary w-full rounded-xl py-3 text-sm font-semibold"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleWhatsApp}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  تواصل مع العميل عبر واتساب
                </span>
              </motion.button>

              <motion.button
                type="button"
                className="glass-btn glass-btn-primary w-full rounded-xl py-3 text-sm font-semibold"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  background: "linear-gradient(135deg, var(--primary), #4338ca)",
                  boxShadow: "0 2px 16px rgba(79,70,229,0.3)",
                }}
                onClick={() => window.open(`/application/${applicationId}/form`, "_blank")}
              >
                📄 نموذج طلب التمويل
              </motion.button>

              <motion.button
                type="button"
                className="glass-btn glass-btn-secondary w-full rounded-xl py-3 text-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/evaluate")}
              >
                العودة إلى التقييم
              </motion.button>
            </div>
          </Card>

          {bestOffer && (
            <Card>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                ملخص التمويل
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>إجمالي التمويل</span>
                  <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{bestOffer.financeAmount.toLocaleString("en-EG", { maximumFractionDigits: 0 })} EGP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>الدفعة المقدمة</span>
                  <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{bestOffer.downPayment.toLocaleString("en-EG", { maximumFractionDigits: 0 })} EGP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>القسط الشهري</span>
                  <span className="text-sm font-bold" style={{ color: "var(--success)" }}>{bestOffer.installment.toLocaleString("en-EG", { maximumFractionDigits: 0 })} EGP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>إجمالي المبلغ</span>
                  <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{bestOffer.totalPayment.toLocaleString("en-EG", { maximumFractionDigits: 0 })} EGP</span>
                </div>
                <div className="flex justify-between pt-2" style={{ borderTop: "1px solid var(--glass-border)" }}>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>نسبة المخاطرة</span>
                  <span className="text-sm font-bold" style={{ color: bestOffer.riskLevel === "LOW" ? "var(--success)" : bestOffer.riskLevel === "MEDIUM" ? "var(--warning)" : "var(--error-light)" }}>
                    {bestOffer.riskLevel === "LOW" ? "منخفضة" : bestOffer.riskLevel === "MEDIUM" ? "متوسطة" : "عالية"}
                  </span>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
