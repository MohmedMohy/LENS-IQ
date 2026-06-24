import { Navigate, Outlet, useLocation } from "react-router-dom";
import { routePaths } from "@/router/route-paths";
import { useAuthStore } from "@/store/auth.store";

export default function ProtectedLayout() {
    const location = useLocation();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    if (!isAuthenticated) {
        return (
            <Navigate
                to={routePaths.login}
                replace
                state={{ from: location }}
            />
        );
    }

    return <Outlet />;
}
