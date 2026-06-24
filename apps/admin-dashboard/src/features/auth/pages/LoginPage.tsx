import { useState } from "react";
import type { FormEvent } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authApi } from "@/features/auth/api/auth.api";
import { useAuthStore } from "@/store/auth.store";
import { routePaths } from "@/router/route-paths";
import { isApiError } from "@/lib/api-error";

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.login({ email, password });
      setSession(res.tenant, res.accessToken);
      navigate(routePaths.dashboard, { replace: true });
    } catch (err) {
      setError(isApiError(err) ? err.message : t("errors.unknownError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden flex-col justify-between p-12 lg:flex lg:w-[45%]"
        style={{
          background: "linear-gradient(180deg, rgba(15,23,42,0.98) 0%, rgba(30,27,75,0.95) 100%)",
          borderInlineStart: "1px solid var(--glass-border)",
        }}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--primary-light)" }}>
            {t("app.title")}
          </p>
          <h1 className="mt-3 text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
            {t("app.subtitle")}
          </h1>
        </div>

        <div className="space-y-6">
          {[
            { titleKey: "login.features.multiBank.title", descKey: "login.features.multiBank.desc" },
            { titleKey: "login.features.ruleBased.title", descKey: "login.features.ruleBased.desc" },
            { titleKey: "login.features.realTime.title", descKey: "login.features.realTime.desc" },
          ].map((item) => (
            <div key={item.titleKey} className="flex gap-3">
              <div className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: "var(--primary-light)" }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{t(item.titleKey)}</p>
                <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>{t(item.descKey)}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t("app.tagline")}</p>
      </motion.div>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <div className="mb-8">
            <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{t("login.signIn")}</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              {t("login.description")}
            </p>
          </div>

          <form onSubmit={login} className="space-y-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{t("login.email")}</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("login.emailPlaceholder")}
                required
                autoComplete="email"
                className="glass-input w-full px-4 py-3 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{t("login.password")}</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("login.passwordPlaceholder")}
                required
                autoComplete="current-password"
                className="glass-input w-full px-4 py-3 text-sm"
              />
            </label>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border p-3 text-sm font-medium"
                style={{ background: "rgba(239,68,68,0.08)", color: "var(--error-light)", borderColor: "rgba(239,68,68,0.2)" }}
              >
                {error}
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              className="glass-btn glass-btn-primary w-full py-3 text-sm font-semibold"
              whileHover={!loading ? { scale: 1.01 } : {}}
              whileTap={!loading ? { scale: 0.99 } : {}}
            >
              {loading ? t("login.signingIn") : t("login.signIn")}
            </motion.button>
          </form>

          <p className="mt-8 text-center text-xs" style={{ color: "var(--text-muted)" }}>
            {t("login.contactAdmin")}
          </p>
        </motion.div>
      </div>
    </main>
  );
}
