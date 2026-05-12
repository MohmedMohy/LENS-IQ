// src/components/layout/Sidebar.tsx

import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { routePaths } from "@/router/route-paths";
import { useAuthStore } from "@/store/auth.store";

const menuItems = [
    { name: "Dashboard", path: routePaths.dashboard },
    { name: "Banks", path: routePaths.banks },
    { name: "Programs", path: routePaths.programs },
    { name: "Rules", path: routePaths.rules },
    { name: "Evaluate", path: routePaths.evaluate },
];

// ── Shared nav content ────────────────────────────────────────────────────────
function NavContent({
    currentPath,
    onNavigate,
    onLogout,
}: {
    currentPath: string;
    onNavigate?: () => void;
    onLogout: () => void;
}) {
    return (
        <>
            {/* Logo / Brand */}
            <div className="border-b border-slate-800 px-6 py-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                    Decision Engine
                </p>

                <h2 className="mt-2 text-2xl font-bold text-white">
                    Admin Panel
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                    Financing Management System
                </p>
            </div>

            {/* Navigation */}
            <nav className="flex flex-1 flex-col gap-2 px-4 py-6">
                {menuItems.map((item) => {
                    const active = currentPath === item.path;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={onNavigate}
                            className={[
                                "rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                                active
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                    : "text-slate-300 hover:bg-slate-800 hover:text-white",
                            ].join(" ")}
                        >
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="border-t border-slate-800 p-4">
                <button
                    type="button"
                    onClick={onLogout}
                    className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                    Logout
                </button>
            </div>
        </>
    );
}

// ── Main Sidebar ──────────────────────────────────────────────────────────────
export default function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();

    const currentPath = location.pathname;

    const logout = useAuthStore((state) => state.logout);

    const [drawerOpen, setDrawerOpen] = useState(false);

    // Prevent body scroll when drawer is open
    useEffect(() => {
        if (drawerOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }

        return () => {
            document.body.style.overflow = "";
        };
    }, [drawerOpen]);

    const handleLogout = () => {
        logout();

        navigate(routePaths.login, {
            replace: true,
        });
    };

    const handleMobileNavigate = () => {
        setDrawerOpen(false);
    };

    return (
        <>
            {/* ── Desktop sidebar (lg+) ─────────────────────────────────────── */}
            <aside className="hidden min-h-screen w-64 flex-col border-r border-slate-800 bg-slate-950 lg:flex">
                <NavContent
                    currentPath={currentPath}
                    onLogout={handleLogout}
                />
            </aside>

            {/* ── Mobile hamburger button ───────────────────────────────────── */}
            <button
                type="button"
                aria-label="Open navigation menu"
                aria-expanded={drawerOpen}
                onClick={() => setDrawerOpen(true)}
                className={[
                    "fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center",
                    "rounded-xl bg-slate-950 shadow-lg transition-transform duration-200",
                    "lg:hidden",
                    drawerOpen
                        ? "pointer-events-none opacity-0"
                        : "opacity-100",
                ].join(" ")}
            >
                {/* Hamburger icon */}
                <span className="flex flex-col gap-[5px]">
                    <span className="block h-0.5 w-5 rounded-full bg-white" />
                    <span className="block h-0.5 w-5 rounded-full bg-white" />
                    <span className="block h-0.5 w-3 rounded-full bg-white" />
                </span>
            </button>

            {/* ── Mobile drawer overlay ─────────────────────────────────────── */}
            {drawerOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                    aria-hidden="true"
                    onClick={() => setDrawerOpen(false)}
                />
            )}

            {/* ── Mobile drawer panel ───────────────────────────────────────── */}
            <aside
                className={[
                    "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-950",
                    "border-r border-slate-800 shadow-2xl",
                    "transition-transform duration-300 ease-in-out lg:hidden",
                    drawerOpen
                        ? "translate-x-0"
                        : "-translate-x-full",
                ].join(" ")}
                aria-label="Mobile navigation"
            >
                {/* Close button */}
                <button
                    type="button"
                    aria-label="Close navigation menu"
                    onClick={() => setDrawerOpen(false)}
                    className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>

                <NavContent
                    currentPath={currentPath}
                    onNavigate={handleMobileNavigate}
                    onLogout={handleLogout}
                />
            </aside>
        </>
    );
}