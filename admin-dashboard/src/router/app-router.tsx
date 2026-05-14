import { Navigate, Route, Routes } from "react-router-dom";
import { routePaths } from "@/router/route-paths";
import ProtectedRoute from "@/router/protected-route";
import { useAuthStore } from "@/store/auth.store";

import ApplyPage from "@/features/apply/pages/ApplyPage";
import LoginPage from "@/features/auth/pages/LoginPage";
import DashboardPage from "@/features/dashboard/pages/DashboardPage";
import BanksPage from "@/features/banks/pages/BanksPage";
import ProgramsPage from "@/features/programs/pages/ProgramsPage";
import RulesPage from "@/features/rules/pages/RulesPage";
import EvaluatePage from "@/features/evaluate/pages/EvaluatePage";
import ProfilePage from "@/features/profile/pages/ProfilePage";

import CustomersPage from "@/features/Customers/pages/Customerspage";
import ApplicationsPage from "@/features/applications/pages/Applicationspage";
import VehiclesPage from "@/features/Vehicles/pages/Vehiclespage";

export default function AppRouter() {
    const accessToken = useAuthStore((state) => state.accessToken);

    return (
        <Routes>
            <Route path="/apply/:code" element={<ApplyPage />} />

            <Route
                path={routePaths.login}
                element={
                    accessToken ? (
                        <Navigate to={routePaths.dashboard} replace />
                    ) : (
                        <LoginPage />
                    )
                }
            />

            <Route element={<ProtectedRoute />}>
                <Route
                    path={routePaths.dashboard}
                    element={<DashboardPage />}
                />

                <Route
                    path={routePaths.banks}
                    element={<BanksPage />}
                />

                <Route
                    path={routePaths.programs}
                    element={<ProgramsPage />}
                />

                <Route
                    path={routePaths.rules}
                    element={<RulesPage />}
                />

                <Route
                    path={routePaths.evaluate}
                    element={<EvaluatePage />}
                />

                <Route
                    path={routePaths.profile}
                    element={<ProfilePage />}
                />

                <Route
                    path={routePaths.customers}
                    element={<CustomersPage />}
                />

                <Route
                    path={routePaths.applications}
                    element={<ApplicationsPage />}
                />

                <Route
                    path={routePaths.vehicles}
                    element={<VehiclesPage />}
                />
            </Route>

            <Route
                path="/"
                element={<Navigate to={routePaths.dashboard} replace />}
            />

            <Route
                path="*"
                element={<Navigate to={routePaths.dashboard} replace />}
            />
        </Routes>
    );
}