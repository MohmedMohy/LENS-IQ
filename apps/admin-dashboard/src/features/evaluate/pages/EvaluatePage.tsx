import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/navigation/PageHeader";
import Card from "@/components/ui/card/Card";
import { CardSkeleton } from "@/components/ui/skeleton";
import { applicationsApi } from "@/features/applications/api/Applications";
import { evaluateApi } from "@/features/evaluate/api/evaluate.api";
import type { Application, EvaluateResponse, Offer, RankedOffer } from "@/types";
import OfferComparison from "@/features/evaluate/components/OfferComparison";
import Recommendations from "@/features/evaluate/components/Recommendations";
import type { Recommendation, RecommendationAction } from "@/features/evaluate/components/Recommendations";
import RecommendationModal from "@/features/evaluate/components/RecommendationModal";
import ReasonList from "@/features/evaluate/components/ReasonList";
import DtiMeter from "@/features/evaluate/components/DtiMeter";
import { evaluateRecommendationApi, type EvaluateRecommendationResponse } from "@/features/evaluate/api/evaluateRecommendation.api";

function getOverallScore(offers: Offer[]): number {
  if (offers.length === 0) return 0;
  const approved = offers.filter((o) => o.status === "APPROVED").length;
  const avgRisk = offers.reduce((s, o) => s + o.riskScore, 0) / offers.length;
  const approvalRatio = approved / offers.length;
  return Math.round((approvalRatio * 60 + (1 - avgRisk / 100) * 40));
}

function getScoreColor(score: number): string {
  if (score >= 70) return "#10B981";
  if (score >= 45) return "#F59E0B";
  return "#EF4444";
}

function getDecisionEmoji(score: number): string {
  if (score >= 70) return "●";
  if (score >= 45) return "●";
  return "●";
}

function generateRecommendations(result: EvaluateResponse, app?: Application | null): Recommendation[] {
  const recs: Recommendation[] = [];
  const best = result.bestOffer;
  if (!best) return recs;

  if (best.status === "REJECTED" || best.riskLevel === "HIGH") {
    const currentApp = app;
    const price = currentApp?.price ?? 0;
    const currentDown = currentApp?.requested_down_payment ?? best.downPayment;
    if (price > 0) {
      const currentPct = Math.round((currentDown / price) * 100);
      const suggestedPct = Math.min(currentPct + 10, 50);
      recs.push({
        title: "زيادة الدفعة المقدمة",
        description: `رفع الدفعة من ${currentPct}% إلى ${suggestedPct}% يقلل مبلغ التمويل ويزيد فرص الموافقة.`,
        impact: "قد يحسن النتيجة بنسبة 15-20%",
        type: "warning",
        action: { type: "INCREASE_DOWN_PAYMENT", pct: suggestedPct },
      });
    }
    recs.push({
      title: "تمديد مدة التمويل",
      description: "زيادة مدة التمويل تقلل القسط الشهري وتحسن نسبة DTI.",
      impact: "قد يحسن النتيجة بنسبة 10-15%",
      type: "warning",
      action: { type: "EXTEND_DURATION", months: Math.min(best.months + 24, 96) },
    });
  }

  if (best.status === "APPROVED" || best.riskLevel === "LOW" || best.riskLevel === "MEDIUM") {
    recs.push({
      title: "تقصير مدة التمويل",
      description: `تقليل المدة من ${best.months} إلى ${Math.max(best.months - 24, 36)} شهراً يخفض التكلفة الإجمالية.`,
      impact: "يخفض التكلفة الإجمالية بنسبة 15-20%",
      type: "info",
      action: { type: "REDUCE_DURATION", months: Math.max(best.months - 24, 36) },
    });
  }

  if (best.status === "APPROVED" && best.riskLevel === "LOW") {
    recs.push({
      title: "إرسال للممول",
      description: "الملف الائتماني قوي وجاهز للتقديم. أرسل طلب التمويل الآن.",
      impact: "فرصة قبول عالية",
      type: "positive",
      action: { type: "SUBMIT_FINANCIER" },
    });
  }

  if (recs.length === 0) {
    recs.push({
      title: "الملف الائتماني جيد",
      description: "البيانات الحالية تستوفي المعايير. يمكن البدء في إجراءات التمويل.",
      impact: "جاهز للتقديم",
      type: "positive",
      action: { type: "NONE" },
    });
  }

  return recs;
}

function ApplicationRow({
  app, selected, onSelect,
}: {
  app: Application; selected: boolean; onSelect: () => void;
}) {
  const { t } = useTranslation();

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full rounded-2xl border px-5 py-4 text-start transition-all duration-200 ${
        selected
          ? "border-[var(--primary)]"
          : "border-[var(--glass-border)] hover:border-[var(--glass-border-hover)]"
      }`}
      style={{
        background: selected ? "rgba(79,70,229,0.08)" : "var(--bg-card)",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            {app.customer_name}
          </p>
          <p className="mt-0.5 text-sm" style={{ color: "var(--text-secondary)" }}>
            {app.brand} {app.model} · {app.manufacturing_year} · {app.condition}
          </p>
        </div>
        <div className="shrink-0 text-end">
          <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
            {Number(app.price).toLocaleString("en-EG")} EGP
          </p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
            Down: {Number(app.requested_down_payment).toLocaleString("en-EG")} EGP
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full px-2.5 py-0.5 text-xs" style={{ background: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--glass-border)" }}>
          Salary: {Number(app.salary).toLocaleString("en-EG")} EGP
        </span>
        <span className="rounded-full px-2.5 py-0.5 text-xs" style={{ background: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--glass-border)" }}>
          {app.job_type}
        </span>
        {selected && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ background: "rgba(79,70,229,0.15)", color: "var(--primary-light)", border: "1px solid rgba(79,70,229,0.25)" }}
          >
            {t("evaluate.selected")}
          </motion.span>
        )}
      </div>
    </motion.button>
  );
}

export default function EvaluatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [appsError, setAppsError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [result, setResult] = useState<EvaluateResponse | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [applyingRecommendation, setApplyingRecommendation] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [recommendationResult, setRecommendationResult] = useState<EvaluateRecommendationResponse | null>(null);
  const [showRecModal, setShowRecModal] = useState(false);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoadingApps(true);
      setAppsError(null);
      try {
        const data = await applicationsApi.getAll();
        if (mounted) setApplications(data);
      } catch (err) {
        if (mounted) setAppsError(err instanceof Error ? err.message : "Could not load applications.");
      } finally {
        if (mounted) setLoadingApps(false);
      }
    };
    void run();
    return () => { mounted = false; };
  }, []);

  const runEvaluation = useCallback(async () => {
    if (selectedId == null) return;
    setEvaluating(true);
    setEvalError(null);
    setResult(null);
    try {
      const app = applications.find((a) => a.id === selectedId);
      if (!app) throw new Error("Application not found.");
      const response = await evaluateApi.evaluate({ application_id: selectedId });
      setResult(response);
      toast.success("Evaluation complete!");
    } catch (err) {
      setEvalError(err instanceof Error ? err.message : "Could not reach the server.");
      toast.error("Evaluation failed");
    } finally {
      setEvaluating(false);
    }
  }, [selectedId, applications]);

  const selectedApp = applications.find((a) => a.id === selectedId) ?? null;

  const handleApplyRecommendation = useCallback(async (action: RecommendationAction) => {
    const app = applications.find((a) => a.id === selectedId) ?? null;
    if (!app || !result?.bestOffer) return;

    if (action.type === "SUBMIT_FINANCIER") {
      navigate(`/send-to-financier/${selectedId}`);
      return;
    }

    if (action.type === "NONE") return;

    setApplyingRecommendation(true);
    try {
      const suggestedParams: { tenor?: number; downPaymentPct?: number } = {};
      let recType: "SHORTEN_TENOR" | "INCREASE_DOWN_PAYMENT" = "INCREASE_DOWN_PAYMENT";

      if (action.type === "INCREASE_DOWN_PAYMENT") {
        recType = "INCREASE_DOWN_PAYMENT";
        suggestedParams.downPaymentPct = action.pct;
      } else if (action.type === "EXTEND_DURATION") {
        recType = "SHORTEN_TENOR";
        suggestedParams.tenor = action.months;
      } else if (action.type === "REDUCE_DURATION") {
        recType = "SHORTEN_TENOR";
        suggestedParams.tenor = action.months;
      } else {
        toast.error("نوع التوصية غير مدعوم");
        return;
      }

      const evalResult = await evaluateRecommendationApi.evaluate({
        applicationId: selectedId!,
        recommendationType: recType,
        suggestedParams,
      });

      setRecommendationResult(evalResult);
      setShowRecModal(true);
    } catch {
      toast.error("فشل تقييم التوصية");
    } finally {
      setApplyingRecommendation(false);
    }
  }, [applications, selectedId, result, navigate]);

  const handleModalApply = useCallback((offer: RankedOffer) => {
    if (result) {
      const updatedOffers = result.offers.map(o =>
        o.programId === offer.programId ? offer : o
      );
      if (!updatedOffers.find(o => o.programId === offer.programId)) {
        updatedOffers.push(offer);
      }
      setResult({
        ...result,
        bestOffer: offer,
        offers: updatedOffers,
      });
    }
    setShowRecModal(false);
    setRecommendationResult(null);
    toast.success("تم تطبيق العرض");
  }, [result]);

  const overallScore = result ? getOverallScore(result.offers) : 0;
  const scoreColor = getScoreColor(overallScore);
  const scoreLabel = overallScore >= 70
    ? t("evaluate.eligible")
    : overallScore >= 45
      ? t("evaluate.reviewNeeded")
      : t("evaluate.notEligible");
  const approved = result?.offers.filter((o) => o.status === "APPROVED") ?? [];
  const conditional = result?.offers.filter((o) => o.status === "CONDITIONAL") ?? [];
  const rejected = result?.offers.filter((o) => o.status === "REJECTED") ?? [];
  const recommendations = result ? generateRecommendations(result, selectedApp) : [];

  return (
    <Layout>
      <PageHeader
        title={t("evaluate.title")}
        description={t("evaluate.selectApplication")}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="space-y-4">
          <Card className={result ? "" : "lg:sticky lg:top-24"}>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              {t("evaluate.selectAppBtn")}
            </h2>

            {loadingApps && <CardSkeleton lines={3} />}
            {appsError && (
              <p className="rounded-xl p-3 text-sm font-medium" style={{ background: "rgba(239,68,68,0.1)", color: "var(--error-light)", border: "1px solid rgba(239,68,68,0.2)" }}>
                {appsError}
              </p>
            )}
            {!loadingApps && applications.length === 0 && !appsError && (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {t("evaluate.noApplications")}
              </p>
            )}
            {!loadingApps && applications.length > 0 && (
              <div className="space-y-3">
                {applications.map((app, idx) => (
                  <ApplicationRow
                    key={`${app.id}-${idx}`}
                    app={app}
                    selected={selectedId === app.id}
                    onSelect={() => {
                      setSelectedId(app.id);
                      setResult(null);
                      setEvalError(null);
                    }}
                  />
                ))}
              </div>
            )}

            <motion.button
              type="button"
              onClick={runEvaluation}
              disabled={!selectedId || evaluating}
              className="glass-btn glass-btn-primary mt-5 w-full py-3 text-sm font-semibold"
              whileHover={selectedId && !evaluating ? { scale: 1.01 } : {}}
              whileTap={selectedId && !evaluating ? { scale: 0.99 } : {}}
            >
              {evaluating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {t("evaluate.analyzing")}
                </span>
              ) : selectedApp ? (
                t("evaluate.evaluate", { name: selectedApp.customer_name })
              ) : t("evaluate.noSelection")}
            </motion.button>
          </Card>

          {result && !result.error && (
            <Card>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                {t("evaluate.summary")}
              </h3>
              <div className="space-y-3">
                {[
                  { label: "Approved", key: "evaluate.approved", count: approved.length, color: "#10B981" },
                  { label: "Conditional", key: "evaluate.conditional", count: conditional.length, color: "#F59E0B" },
                  { label: "Rejected", key: "evaluate.rejected", count: rejected.length, color: "#EF4444" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{t(item.key)}</span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{item.count}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {evalError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border p-4 text-sm font-medium"
              style={{ background: "rgba(239,68,68,0.08)", color: "var(--error-light)", borderColor: "rgba(239,68,68,0.2)" }}
            >
              {evalError}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {!result && !evalError && !evaluating && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center rounded-2xl py-16"
                style={{ background: "var(--bg-card)", border: "1px dashed var(--glass-border)" }}
              >
                <div className="mb-4 text-4xl opacity-30">◆</div>
                <p className="text-lg font-semibold" style={{ color: "var(--text-secondary)" }}>
                  {t("evaluate.noEvaluation")}
                </p>
                <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                  {t("evaluate.selectApplication")}
                </p>
              </motion.div>
            )}

            {evaluating && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center gap-4 rounded-2xl py-16"
                style={{ background: "var(--bg-card)" }}
              >
                <div className="h-12 w-12 animate-spin rounded-full border-4" style={{ borderColor: "var(--glass-border)", borderTopColor: "var(--primary)" }} />
                <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                  {t("evaluate.running")}
                </p>
              </motion.div>
            )}

            {result && !result.error && !evaluating && (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", damping: 20, stiffness: 200 }}
                  className="glass-card relative overflow-hidden p-6"
                >
                  <div className="flex flex-col items-center gap-6 md:flex-row">
                    <div className="relative flex shrink-0 items-center justify-center">
                      <svg width="140" height="140" className="-rotate-90">
                        <circle cx="70" cy="70" r="60" fill="none" stroke="var(--glass-border)" strokeWidth="8" />
                        <motion.circle
                          cx="70" cy="70" r="60" fill="none" stroke={scoreColor} strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 60}
                          initial={{ strokeDashoffset: 2 * Math.PI * 60 }}
                          animate={{ strokeDashoffset: 2 * Math.PI * 60 * (1 - overallScore / 100) }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.span
                          className="text-4xl font-bold"
                          style={{ color: scoreColor }}
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.4 }}
                        >
                          {overallScore}%
                        </motion.span>
                        <motion.span
                          className="text-xs font-semibold uppercase tracking-wider"
                          style={{ color: scoreColor }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.8 }}
                          transition={{ delay: 0.6 }}
                        >
                          {t("evaluate.eligibility")}
                        </motion.span>
                      </div>
                    </div>

                    <div className="flex-1 text-center md:text-start">
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5"
                        style={{
                          background: `${scoreColor}15`,
                          border: `1px solid ${scoreColor}30`,
                        }}
                      >
                        <span className="text-lg" style={{ color: scoreColor }}>{getDecisionEmoji(overallScore)}</span>
                        <span className="text-sm font-bold" style={{ color: scoreColor }}>{scoreLabel}</span>
                      </motion.div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t("evaluate.totalPrograms")}</p>
                          <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{result.offers.length}</p>
                        </div>
                        <div>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t("evaluate.approvedPrograms")}</p>
                          <p className="text-lg font-bold" style={{ color: "#10B981" }}>{approved.length}</p>
                        </div>
                        <div>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t("evaluate.avgRiskScore")}</p>
                          <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                            {result.offers.length > 0
                              ? Math.round(result.offers.reduce((s, o) => s + o.riskScore, 0) / result.offers.length)
                              : 0}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t("evaluate.conditional")}</p>
                          <p className="text-lg font-bold" style={{ color: "#F59E0B" }}>{conditional.length}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {result.bestOffer && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card p-6"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                          {t("evaluate.bestOffer")}
                        </h3>
                        <p className="mt-1 text-base font-bold" style={{ color: "var(--text-primary)" }}>
                          {result.bestOffer.programName || `Program #${result.bestOffer.programId}`}
                        </p>
                      </div>
                      <div className="text-end">
                        <p className="text-2xl font-extrabold" style={{ color: "var(--success)" }}>
                          {result.bestOffer.installment.toLocaleString("en-EG", { maximumFractionDigits: 0 })} EGP
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t("evaluate.monthlyInstallment")}</p>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {[
                        { label: "Down Payment", key: "evaluate.downPayment", value: `${result.bestOffer.downPayment.toLocaleString("en-EG", { maximumFractionDigits: 0 })} EGP` },
                        { label: "Down %", key: "evaluate.downPercent", value: `${Math.round((result.bestOffer.downPayment / (result.bestOffer.downPayment + result.bestOffer.financeAmount)) * 100 || 0)}%` },
                        { label: "Interest Rate", key: "evaluate.interestRate", value: `${result.bestOffer.interestRate.toFixed(1)}%` },
                        { label: "Term", key: "evaluate.term", value: `${result.bestOffer.months} months` },
                        { label: "Total Payment", key: "evaluate.totalPayment", value: `${result.bestOffer.totalPayment.toLocaleString("en-EG", { maximumFractionDigits: 0 })} EGP` },
                        { label: "Risk Score", key: "evaluate.riskScore", value: `${result.bestOffer.riskScore}%` },
                      ].map((item) => (
                        <div key={item.label}>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t(item.key)}</p>
                          <p className="mt-0.5 text-lg font-bold" style={{ color: "var(--text-primary)" }}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                    {result.bestOffer.dti > 0 && (
                      <div className="mt-4">
                        <DtiMeter dti={result.bestOffer.dti} />
                      </div>
                    )}
                    {result.bestOffer.reasons.length > 0 && (
                      <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--glass-border)" }}>
                        <h4 className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                          {t("evaluate.keyFactors")}
                        </h4>
                        <ReasonList reasons={result.bestOffer.reasons} />
                      </div>
                    )}
                  </motion.div>
                )}

                <OfferComparison offers={result.offers} bestOffer={result.bestOffer} />

                {recommendations.length > 0 && (
                  <Recommendations
                    recommendations={recommendations}
                    onApply={applyingRecommendation ? undefined : handleApplyRecommendation}
                  />
                )}

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="flex flex-wrap gap-3"
                >
                  <motion.button
                    type="button"
                    className="glass-btn glass-btn-primary rounded-xl px-6 py-3 text-sm font-semibold"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toast.success("Evaluation saved!")}
                  >
                    {t("evaluate.saveEvaluation")}
                  </motion.button>
                  <motion.button
                    type="button"
                    className="glass-btn glass-btn-secondary rounded-xl px-6 py-3 text-sm font-semibold"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toast.success("PDF download started...")}
                  >
                    {t("evaluate.sharePdf")}
                  </motion.button>
                  <motion.button
                    type="button"
                    className="glass-btn glass-btn-secondary rounded-xl px-6 py-3 text-sm font-semibold"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={runEvaluation}
                  >
                    {t("evaluate.reevaluate")}
                  </motion.button>
                  <motion.button
                    type="button"
                    className="glass-btn glass-btn-primary rounded-xl px-6 py-3 text-sm font-semibold"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/send-to-financier/${selectedId}`)}
                    style={{
                      background: "linear-gradient(135deg, var(--success), #059669)",
                      boxShadow: "0 2px 16px rgba(16,185,129,0.3)",
                    }}
                  >
                    {t("evaluate.sendToFinancier")}
                  </motion.button>
                </motion.div>

                <motion.button
                  type="button"
                  onClick={() => setShowDebug(!showDebug)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-medium transition-all"
                  style={{ color: "var(--text-muted)", background: "var(--bg-card)" }}
                  whileHover={{ background: "var(--bg-card-hover)" }}
                >
                  {showDebug ? t("evaluate.hideRaw") : t("evaluate.showRaw")}
                </motion.button>

                <AnimatePresence>
                  {showDebug && (
                    <motion.pre
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-auto rounded-2xl p-4 text-xs leading-relaxed"
                      style={{
                        background: "rgba(15,23,42,0.95)",
                        color: "#34D399",
                        border: "1px solid var(--glass-border)",
                      }}
                    >
                      {JSON.stringify(result, null, 2)}
                    </motion.pre>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {recommendationResult && (
        <RecommendationModal
          isOpen={showRecModal}
          onClose={() => { setShowRecModal(false); setRecommendationResult(null); }}
          result={recommendationResult}
          onApply={handleModalApply}
        />
      )}
    </Layout>
  );
}
