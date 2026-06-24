import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { routePaths } from "@/router/route-paths";
import { useAuthStore } from "@/store/auth.store";
import { authApi } from "@/features/auth/api/auth.api";

const menuItems = [
  { nameKey: "sidebar.dashboard", path: routePaths.dashboard, icon: "◈" },
  { nameKey: "sidebar.banks", path: routePaths.banks, icon: "◇" },
  { nameKey: "sidebar.programs", path: routePaths.programs, icon: "◎" },
  { nameKey: "sidebar.rules", path: routePaths.rules, icon: "⊞" },
  { divider: true, labelKey: "sidebar.operations" },
  { nameKey: "sidebar.users", path: routePaths.users, icon: "◉" },
  { nameKey: "sidebar.audit", path: routePaths.audit, icon: "⊡" },
  { nameKey: "sidebar.customers", path: routePaths.customers, icon: "○" },
  { nameKey: "sidebar.vehicles", path: routePaths.vehicles, icon: "▣" },
  { nameKey: "sidebar.applications", path: routePaths.applications, icon: "▤" },
  { divider: true, labelKey: "sidebar.engine" },
  { nameKey: "sidebar.evaluate", path: routePaths.evaluate, icon: "◆" },
];

type MenuItem =
  | { nameKey: string; path: string; icon: string; divider?: never; labelKey?: never }
  | { divider: true; labelKey: string; icon?: never; nameKey?: never; path?: never };

function NavContent({
  currentPath,
  onNavigate,
  onLogout,
  t,
}: {
  currentPath: string;
  onNavigate?: () => void;
  onLogout: () => void;
  t: (key: string) => string;
}) {
  const role = useAuthStore((s) => s.tenant?.role);

  const visibleItems = (menuItems as MenuItem[]).filter((item) => {
    if ("path" in item && item.path === routePaths.users) {
      return role === "ADMIN" || role === "MANAGER";
    }
    if ("path" in item && item.path === routePaths.audit) {
      return role === "ADMIN" || role === "MANAGER";
    }
    return true;
  });

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-6 py-6" style={{ borderColor: "var(--glass-border)" }}>
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs font-semibold uppercase tracking-[0.2em]"
          style={{ color: "var(--primary-light)" }}
        >
          Lens IQ
        </motion.p>
        <h2 className="mt-2 text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          {t("sidebar.adminPanel")}
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          {t("app.subtitle")}
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-6">
        {visibleItems.map((item, i) => {
          if (item.divider) {
            return (
              <p
                key={`divider-${i}`}
                className="mb-1 mt-4 px-3 text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "var(--text-muted)" }}
              >
                {t(item.labelKey)}
              </p>
            );
          }
          const active = currentPath === item.path;
          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Link
                to={item.path}
                onClick={onNavigate}
                className="group flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200"
                style={{
                  background: active
                    ? "linear-gradient(135deg, var(--primary), var(--primary-dark))"
                    : "transparent",
                  color: active ? "#fff" : "var(--text-secondary)",
                  boxShadow: active ? "0 2px 16px rgba(79, 70, 229, 0.3)" : "none",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "var(--bg-card)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }
                }}
              >
                <span className="text-base opacity-60">{item.icon}</span>
                <span>{t(item.nameKey)}</span>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      <div className="border-t p-4" style={{ borderColor: "var(--glass-border)" }}>
        <button
          type="button"
          onClick={onLogout}
          className="glass-btn glass-btn-secondary w-full py-2.5 text-sm"
        >
          {t("sidebar.logout")}
        </button>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const currentPath = location.pathname;
  const logout = useAuthStore((state) => state.logout);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    logout();
    navigate(routePaths.login, { replace: true });
  };

  return (
    <>
      <aside
        className="fixed inset-y-0 end-0 z-30 hidden w-60 flex-col border-s lg:flex"
        style={{
          background: "linear-gradient(180deg, rgba(15,23,42,0.98) 0%, rgba(30,27,75,0.95) 100%)",
          backdropFilter: "blur(20px)",
          borderColor: "var(--glass-border)",
        }}
      >
        <NavContent currentPath={currentPath} onLogout={handleLogout} t={t} />
      </aside>

      <motion.button
        type="button"
        aria-label="Open navigation menu"
        aria-expanded={drawerOpen}
        onClick={() => setDrawerOpen(true)}
        className="fixed end-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-xl lg:hidden"
        style={{
          background: "var(--bg-card)",
          backdropFilter: "blur(12px)",
          border: "1px solid var(--glass-border)",
        }}
        animate={{ opacity: drawerOpen ? 0 : 1 }}
      >
        <span className="flex flex-col gap-[5px]">
          <span className="block h-0.5 w-5 rounded-full bg-white" />
          <span className="block h-0.5 w-5 rounded-full bg-white" />
          <span className="block h-0.5 w-3 rounded-full bg-white" />
        </span>
      </motion.button>

      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={() => setDrawerOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {drawerOpen && (
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 end-0 z-50 flex w-72 flex-col lg:hidden"
            style={{
              background: "linear-gradient(180deg, rgba(15,23,42,0.98) 0%, rgba(30,27,75,0.95) 100%)",
              backdropFilter: "blur(20px)",
              borderLeft: "1px solid var(--glass-border)",
              boxShadow: "var(--glass-shadow-lg)",
            }}
          >
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={() => setDrawerOpen(false)}
              className="absolute start-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg transition"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-card)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <NavContent
              currentPath={currentPath}
              onNavigate={() => setDrawerOpen(false)}
              onLogout={handleLogout}
              t={t}
            />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
