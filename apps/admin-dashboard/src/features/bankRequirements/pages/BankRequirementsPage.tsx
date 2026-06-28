import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/navigation/PageHeader";
import Card from "@/components/ui/card/Card";
import { CardSkeleton } from "@/components/ui/skeleton";
import { bankRequirementsApi, type BankRequirementsResponse } from "@/features/bankRequirements/api/bankRequirements.api";

export default function BankRequirementsPage() {
  const { bankId } = useParams<{ bankId: string }>();
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get("applicationId");
  const navigate = useNavigate();

  const [data, setData] = useState<BankRequirementsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await bankRequirementsApi.getRequirements(
          Number(bankId),
          applicationId ? Number(applicationId) : undefined
        );
        if (mounted) setData(res);
      } catch {
        if (mounted) toast.error("فشل تحميل متطلبات البنك");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => { mounted = false; };
  }, [bankId, applicationId]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (loading) {
    return (
      <Layout>
        <PageHeader title="متطلبات البنك" description="جاري تحميل المتطلبات..." />
        <Card><CardSkeleton lines={10} /></Card>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <PageHeader title="متطلبات البنك" description="لم يتم العثور على البنك" />
        <Card>
          <p style={{ color: "var(--text-muted)" }}>البنك غير موجود أو لا يوجد متطلبات مسجلة.</p>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="glass-btn glass-btn-primary mt-4 px-6 py-2 text-sm"
          >
            العودة
          </button>
        </Card>
      </Layout>
    );
  }

  const { bank, requirements, applicationContext, documentChecklist } = data;

  return (
    <Layout>
      <PageHeader
        title={`متطلبات ${bank.name}`}
        description={applicationContext
          ? `طلب تمويل: ${applicationContext.clientName}`
          : "الرجاء اختيار طلب تمويل لعرض المتطلبات المخصصة"}
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {/* Bank Info */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-4 mb-4">
              {bank.logoUrl && (
                <img src={bank.logoUrl} alt={bank.name} className="h-12 w-12 rounded-xl object-contain" />
              )}
              <div>
                <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{bank.name}</h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>رمز البنك: {bank.code}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>الحد الأدنى للراتب</p>
                <p className="font-bold" style={{ color: "var(--text-primary)" }}>{requirements.minSalary.toLocaleString("en-EG")} EGP</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>العمر</p>
                <p className="font-bold" style={{ color: "var(--text-primary)" }}>{requirements.minAge} - {requirements.maxAge} سنة</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>مدة المعالجة</p>
                <p className="font-bold" style={{ color: "var(--text-primary)" }}>{requirements.processingTime}</p>
              </div>
            </div>
          </motion.div>

          {/* Application Context */}
          {applicationContext && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="glass-card p-6"
            >
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                بيانات الطلب
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>اسم العميل</p>
                  <p className="font-bold" style={{ color: "var(--text-primary)" }}>{applicationContext.clientName}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>نوع الوظيفة</p>
                  <p className="font-bold" style={{ color: "var(--text-primary)" }}>{applicationContext.employmentType === "government" ? "حكومي" : applicationContext.employmentType === "private" ? "خاص" : "حر"}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>المركبة</p>
                  <p className="font-bold" style={{ color: "var(--text-primary)" }}>{applicationContext.carDetails}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>المبلغ المطلوب</p>
                  <p className="font-bold" style={{ color: "var(--success)" }}>{applicationContext.requestedAmount.toLocaleString("en-EG")} EGP</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Document Checklist */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                المستندات المطلوبة
              </h3>
              <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "rgba(79,70,229,0.15)", color: "var(--primary-light)" }}>
                {documentChecklist.filter(d => d.status === "required").length} مستند إلزامي
              </span>
            </div>
            <div className="space-y-2">
              {documentChecklist.map((doc, i) => (
                <div
                  key={doc.documentId}
                  className="flex items-center justify-between rounded-xl p-3"
                  style={{ background: "var(--bg-card)" }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                      style={{
                        background: doc.status === "required"
                          ? "rgba(239,68,68,0.15)"
                          : "rgba(16,185,129,0.15)",
                        color: doc.status === "required"
                          ? "var(--error-light)"
                          : "var(--success)",
                      }}
                    >
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {doc.name}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {doc.notes}
                        {doc.copies > 1 && ` — نسخ: ${doc.copies}`}
                      </p>
                    </div>
                  </div>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{
                      background: doc.status === "required"
                        ? "rgba(239,68,68,0.12)"
                        : doc.status === "likely_available"
                          ? "rgba(16,185,129,0.12)"
                          : "rgba(245,158,11,0.12)",
                      color: doc.status === "required"
                        ? "var(--error-light)"
                        : doc.status === "likely_available"
                          ? "var(--success)"
                          : "var(--warning)",
                    }}
                  >
                    {doc.status === "required" ? "إلزامي" : doc.status === "likely_available" ? "متوفر" : "بحاجة للتحقق"}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Additional Conditions */}
          {requirements.additionalConditions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="glass-card p-6"
            >
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                شروط إضافية
              </h3>
              <ul className="space-y-2">
                {requirements.additionalConditions.map((cond) => (
                  <li key={cond} className="flex items-start gap-3 rounded-xl p-3" style={{ background: "var(--bg-card)" }}>
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ background: "rgba(245,158,11,0.15)", color: "var(--warning)" }}>
                      !
                    </span>
                    <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{cond}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Bank Notes */}
          {requirements.bankNotes && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6"
            >
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                ملاحظات البنك
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{requirements.bankNotes}</p>
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              الإجراءات
            </h3>
            <div className="space-y-3">
              {applicationContext && (
                <motion.button
                  type="button"
                  className="w-full rounded-xl py-2.5 text-sm font-semibold"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    background: "linear-gradient(135deg, var(--success), #059669)",
                    color: "#fff",
                    boxShadow: "0 2px 16px rgba(16,185,129,0.3)",
                  }}
                  onClick={() => {
                    const msg = encodeURIComponent(
                      `السلام عليكم ${applicationContext.clientName}،\n` +
                      `نود إعلامكم بأن طلب تمويلكم لدى ${bank.name} قيد المراجعة.\n` +
                      `يرجى تجهيز المستندات المطلوبة للبدء في إجراءات التمويل.`
                    );
                    const phone = applicationContext.clientPhone?.replace(/^01/, "201")?.replace(/^(\+2)?/, "").replace(/[^0-9]/g, "");
                    if (phone) {
                      window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
                    }
                  }}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    تواصل مع العميل
                  </span>
                </motion.button>
              )}

              <motion.button
                type="button"
                className="glass-btn glass-btn-primary w-full rounded-xl py-2.5 text-sm font-semibold"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  const section = "employmentTypes";
                  toggleSection(section);
                }}
              >
                {requirements.employmentTypes.length} أنواع وظائف مدعومة
              </motion.button>

              <motion.button
                type="button"
                className="glass-btn glass-btn-secondary w-full rounded-xl py-2.5 text-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(applicationId ? `/send-to-financier/${applicationId}` : "/evaluate")}
              >
                {applicationId ? "العودة لإرسال للممول" : "العودة للتقييم"}
              </motion.button>
            </div>
          </Card>

          <AnimatePresence>
            {expandedSections.employmentTypes && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Card>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                    أنواع الوظائف المدعومة
                  </h3>
                  <div className="space-y-1">
                    {requirements.employmentTypes.map((type) => (
                      <div key={type} className="flex items-center gap-2 rounded-lg p-2" style={{ background: "var(--bg-card)" }}>
                        <span style={{ color: "var(--success)" }}>✓</span>
                        <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                          {type === "government" ? "قطاع حكومي" : type === "private" ? "قطاع خاص" : type === "self_employed" ? "أعمال حرة" : type}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}
