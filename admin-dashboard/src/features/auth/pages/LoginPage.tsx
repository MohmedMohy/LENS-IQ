// src/pages/login/LoginPage.tsx

import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/features/auth/api/auth.api";
import { useAuthStore } from "@/store/auth.store";
import { routePaths } from "@/router/route-paths";
import { isApiError } from "@/lib/api-error";

export default function LoginPage() {
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
            setSession(res.token, res.tenant);
            navigate(routePaths.dashboard, { replace: true });
        } catch (err) {
            setError(isApiError(err) ? err.message : "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen bg-slate-100">
            {/* ── Left panel (branding) ── */}
            <div className="hidden flex-col justify-between bg-slate-950 p-12 lg:flex lg:w-[45%]">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                        LensIQ
                    </p>
                    <h1 className="mt-3 text-3xl font-bold text-white">Admin Panel</h1>
                </div>

                <div className="space-y-6">
                    {[
                        {
                            title: "Multi-bank programs",
                            desc: "Manage financing programs across multiple banks from one place.",
                        },
                        {
                            title: "Rule-based decisions",
                            desc: "Configure eligibility rules and let the engine do the evaluation.",
                        },
                        {
                            title: "Real-time offers",
                            desc: "Instant loan offers ranked by risk score and affordability.",
                        },
                    ].map((item) => (
                        <div key={item.title} className="flex gap-3">
                            <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                            <div>
                                <p className="text-sm font-semibold text-white">{item.title}</p>
                                <p className="mt-0.5 text-sm text-slate-400">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <p className="text-xs text-slate-600">Financing Management System v1.0</p>
            </div>

            {/* ── Right panel (form) ── */}
            <div className="flex flex-1 items-center justify-center px-6 py-12">
                <div className="w-full max-w-sm">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Enter your credentials to access the admin panel.
                        </p>
                    </div>

                    <form onSubmit={login} className="space-y-4">
                        <label className="flex flex-col gap-1.5">
                            <span className="text-sm font-semibold text-slate-700">Email</span>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                autoComplete="email"
                                className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </label>

                        <label className="flex flex-col gap-1.5">
                            <span className="text-sm font-semibold text-slate-700">Password</span>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                autoComplete="current-password"
                                className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </label>

                        {error && (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-xl bg-slate-950 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                            {loading ? "Signing in..." : "Sign in"}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-xs text-slate-400">
                        Contact your system administrator to get access.
                    </p>
                </div>
            </div>
        </main>
    );
}