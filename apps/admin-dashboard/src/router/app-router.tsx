import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { routePaths } from "@/router/route-paths";
import ProtectedRoute from "@/router/protected-route";
import { useAuthStore } from "@/store/auth.store";
import { authApi } from "@/features/auth/api/auth.api";
import type { Tenant } from "@/types/auth";

const ApplyPage = lazy(() => import("@/features/apply/pages/ApplyPage"));
const LoginPage = lazy(() => import("@/features/auth/pages/LoginPage"));
const DashboardPage = lazy(() => import("@/features/dashboard/pages/DashboardPage"));
const BanksPage = lazy(() => import("@/features/banks/pages/BanksPage"));
const ProgramsPage = lazy(() => import("@/features/programs/pages/ProgramsPage"));
const RulesPage = lazy(() => import("@/features/rules/pages/RulesPage"));
const EvaluatePage = lazy(() => import("@/features/evaluate/pages/EvaluatePage"));
const WidgetPreview = lazy(() => import("@/features/widget/pages/WidgetPreview"));
const ProfilePage = lazy(() => import("@/features/profile/pages/ProfilePage"));
const CustomersPage = lazy(() => import("@/features/Customers/pages/Customerspage"));
const ApplicationsPage = lazy(() => import("@/features/applications/pages/Applicationspage"));
const VehiclesPage = lazy(() => import("@/features/Vehicles/pages/Vehiclespage"));
const UsersPage = lazy(() => import("@/features/users/pages/UsersPage"));
const AuditPage = lazy(() => import("@/features/audit/pages/AuditPage"));
const SendToFinancierPage = lazy(() => import("@/features/sendToFinancier/pages/SendToFinancierPage"));
const BankRequirementsPage = lazy(() => import("@/features/bankRequirements/pages/BankRequirementsPage"));

function Loading() {
  return (
    <div className="flex h-screen items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4" style={{ borderColor: "var(--glass-border)", borderTopColor: "var(--primary)" }} />
        <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Loading...</p>
      </div>
    </div>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading, setSession, logout } = useAuthStore();

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const result = await authApi.refresh();
        if (!cancelled) {
          setSession(result.tenant, result.accessToken);
        }
      } catch {
        if (!cancelled) logout();
      }
    };

    void init();
    return () => { cancelled = true; };
  }, [setSession, logout]);

  if (isLoading) return <Loading />;
  return <>{children}</>;
}

export default function AppRouter() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <Suspense fallback={<Loading />}>
      <AuthGate>
        <Routes>
          <Route path="/apply/:code" element={<ApplyPage />} />
          <Route
            path={routePaths.login}
            element={
              isAuthenticated ? (
                <Navigate to={routePaths.dashboard} replace />
              ) : (
                <LoginPage />
              )
            }
          />
          <Route element={<ProtectedRoute />}>
            <Route path={routePaths.dashboard} element={<DashboardPage />} />
            <Route path={routePaths.banks} element={<BanksPage />} />
            <Route path={routePaths.programs} element={<ProgramsPage />} />
            <Route path={routePaths.rules} element={<RulesPage />} />
            <Route path={routePaths.evaluate} element={<EvaluatePage />} />
            <Route path={routePaths.sendToFinancier} element={<SendToFinancierPage />} />
            <Route path={routePaths.bankRequirements} element={<BankRequirementsPage />} />
            <Route path={routePaths.widgetPreview} element={<WidgetPreview />} />
            <Route path={routePaths.profile} element={<ProfilePage />} />
            <Route path={routePaths.customers} element={<CustomersPage />} />
            <Route path={routePaths.applications} element={<ApplicationsPage />} />
            <Route path={routePaths.vehicles} element={<VehiclesPage />} />
            <Route path={routePaths.users} element={<UsersPage />} />
            <Route path={routePaths.audit} element={<AuditPage />} />
          </Route>
          <Route path="/" element={<Navigate to={routePaths.dashboard} replace />} />
          <Route path="*" element={<Navigate to={routePaths.dashboard} replace />} />
        </Routes>
      </AuthGate>
    </Suspense>
  );
}
