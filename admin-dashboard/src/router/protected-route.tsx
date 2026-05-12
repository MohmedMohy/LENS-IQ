import { Navigate, Outlet, useLocation } from "react-router-dom";
import { routePaths } from "@/router/route-paths";
import { useAuthStore } from "@/store/auth.store";

// ⚠ مفيش navigate prop هنا خالص — الـ Outlet مش بياخد props
export default function ProtectedLayout() {
    const location = useLocation();
    const accessToken = useAuthStore((state) => state.accessToken);
    if (!accessToken) {
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