import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/navigation/PageHeader";
import Card from "@/components/ui/card/Card";
import { StatsSkeleton } from "@/components/ui/skeleton";
import { dashboardApi } from "@/features/dashboard/api/dashboard.api";
import { useAuthStore } from "@/store/auth.store";
import { routePaths } from "@/router/route-paths";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemAnim = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

function StatCard({ label, value, sub, color, onClick }: { label: string; value: string | number; sub?: string; color?: string; onClick?: () => void }) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <motion.div variants={itemAnim}>
      <Wrapper {...(onClick ? { type: "button" as const, onClick } : {})} className={`w-full text-start ${onClick ? "cursor-pointer" : ""}`}>
        <Card hover className="h-full">
          <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>{label}</p>
          <h3 className="mt-2 text-4xl font-bold tracking-tight" style={{ color: color || "var(--text-primary)" }}>{value}</h3>
          {sub && <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>{sub}</p>}
        </Card>
      </Wrapper>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const tenant = useAuthStore((s) => s.tenant);
  const navigate = useNavigate();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: dashboardApi.getStats,
  });

  if (isLoading) {
    return (
      <Layout>
        <PageHeader title={t("dashboard.title")} description={t("dashboard.loading")} />
        <StatsSkeleton count={6} />
      </Layout>
    );
  }

  const role = tenant?.role || stats?.role || "SALES_AGENT";
  const apps = stats?.applications;
  const approvedRate = apps?.total ? Math.round((apps.approved / apps.total) * 100) : 0;
  const rejectedRate = apps?.total ? Math.round((apps.rejected / apps.total) * 100) : 0;

  return (
    <Layout>
      <PageHeader title={t("dashboard.title")} description={`${t("dashboard.welcome")}، ${tenant?.name || stats?.tenant?.name || ""}`} />

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={itemAnim}>
          <Card className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                  {role === "ADMIN" ? t("dashboard.dealershipOwner") : role === "MANAGER" ? t("dashboard.manager") : t("dashboard.salesAgent")}
                </p>
                <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{stats?.tenant?.name}</h2>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--success)" }} />
                <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{role}</span>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={container} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label={t("dashboard.statCards.totalApplications")} value={apps?.total ?? 0} sub={`${apps?.pending ?? 0} ${t("dashboard.statCards.pending")}`} color="var(--primary-light)" onClick={() => navigate(routePaths.applications)} />
          <StatCard label={t("dashboard.statCards.totalCustomers")} value={stats?.customers ?? 0} color="var(--secondary)" onClick={() => navigate(routePaths.customers)} />
          <StatCard label={t("dashboard.statCards.vehicles")} value={stats?.vehicles ?? 0} color="var(--success)" onClick={() => navigate(routePaths.vehicles)} />
          <StatCard label={t("dashboard.statCards.evaluations")} value={stats?.evaluations ?? 0} color="var(--warning)" onClick={() => navigate(routePaths.audit)} />
        </motion.div>

        {(role === "ADMIN") && (
          <motion.div variants={container} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label={t("dashboard.statCards.teamMembers")} value={stats?.team?.length ?? 0} sub={`/ ${stats?.tenant?.max_users ?? 99}`} color="var(--warning)" onClick={() => navigate(routePaths.users)} />
          </motion.div>
        )}

        {(role === "ADMIN" || role === "MANAGER") && (
          <motion.div variants={container} className="grid gap-4 md:grid-cols-3">
            <motion.div variants={itemAnim}><Card><p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>{t("dashboard.approvalRate")}</p><h3 className="mt-2 text-3xl font-bold" style={{ color: "var(--success)" }}>{approvedRate}%</h3><p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>{apps?.approved ?? 0} {t("dashboard.approved")}</p></Card></motion.div>
            <motion.div variants={itemAnim}><Card><p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>{t("dashboard.rejectionRate")}</p><h3 className="mt-2 text-3xl font-bold" style={{ color: "var(--error)" }}>{rejectedRate}%</h3><p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>{apps?.rejected ?? 0} {t("dashboard.rejected")}</p></Card></motion.div>
            <motion.div variants={itemAnim}><Card><p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>{t("dashboard.pendingReview")}</p><h3 className="mt-2 text-3xl font-bold" style={{ color: "var(--warning)" }}>{apps?.pending ?? 0}</h3><p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>{t("dashboard.awaitingDecision")}</p></Card></motion.div>
          </motion.div>
        )}

        {(role === "ADMIN" || role === "MANAGER") && stats?.team && stats.team.length > 0 && (
          <motion.div variants={itemAnim}>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{t("dashboard.teamTable.title")}</h2>
            <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: "var(--glass-border)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "var(--bg-card)" }}>
                    <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{t("dashboard.teamTable.name")}</th>
                    <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{t("dashboard.teamTable.role")}</th>
                    <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{t("dashboard.teamTable.manager")}</th>
                    <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{t("dashboard.teamTable.status")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--glass-border)" }}>
                  {stats.team.map((m) => (
                    <tr key={m.id} className="transition-all" style={{ background: "var(--bg-card)" }}>
                      <td className="px-4 py-3 font-medium" style={{ color: "var(--text-primary)" }}>{m.name}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{
                          background: m.role === "MANAGER" ? "rgba(139,92,246,0.1)" : m.role === "ADMIN" ? "rgba(79,70,229,0.1)" : "var(--bg-card)",
                          color: m.role === "MANAGER" ? "#A78BFA" : m.role === "ADMIN" ? "var(--primary-light)" : "var(--text-secondary)",
                        }}>
                          {m.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>{m.manager_name || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{
                          background: m.active ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                          color: m.active ? "var(--success-light)" : "var(--error-light)",
                        }}>
                          {m.active ? t("dashboard.teamTable.active") : t("dashboard.teamTable.inactive")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {role === "ADMIN" && stats?.recentEvaluations && stats.recentEvaluations.length > 0 && (
          <motion.div variants={itemAnim}>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{t("dashboard.recentEvaluations")}</h2>
            <Card>
              <div className="overflow-x-auto rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "var(--bg-card)" }}>
                      <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{t("dashboard.date")}</th>
                      <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{t("dashboard.application")}</th>
                      <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{t("dashboard.by")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "var(--glass-border)" }}>
                    {stats.recentEvaluations.map((ev) => (
                      <tr key={ev.application_id} className="transition-all" style={{ background: "var(--bg-card)" }}>
                        <td className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
                          {new Date(ev.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false })}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => navigate(routePaths.applications)}
                            className="text-sm font-medium underline-offset-2 hover:underline"
                            style={{ color: "var(--primary-light)" }}
                          >
                            #{ev.application_id}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: "var(--text-primary)" }}>{ev.user_name || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        <motion.div variants={itemAnim}>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{t("dashboard.quickActions")}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card hover onClick={() => navigate(routePaths.evaluate)}>
              <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{t("dashboard.runEvaluation")}</h3>
              <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>{t("dashboard.runEvalDesc")}</p>
            </Card>
            <Card hover onClick={() => navigate(routePaths.applications)}>
              <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{t("dashboard.viewApplications")}</h3>
              <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>{t("dashboard.viewAppsDesc")}</p>
            </Card>
          </div>
        </motion.div>
      </motion.div>
    </Layout>
  );
}
