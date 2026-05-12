// src/components/layout/Topbar.tsx

import { useAuthStore } from "@/store/auth.store";

export default function Topbar() {
    const tenant = useAuthStore((s) => s.tenant);

    return (
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex h-16 items-center justify-between px-6">
                {/* Left */}
                <div>
                    <h1 className="text-lg font-bold text-slate-900">
                        Decision Engine
                    </h1>

                    <p className="text-sm text-slate-500">
                        Financing Management System
                    </p>
                </div>

                {/* Right */}
                <div className="flex items-center gap-3">

                    {/* Change Password */}
                    <button
                        type="button"
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                        Change Password
                    </button>

                    {/* User Info */}
                    <div className="text-right">
                        <p className="text-sm font-semibold text-slate-800">
                            {tenant?.name ?? "Admin"}
                        </p>

                        <p className="text-xs text-slate-500">
                            Administrator
                        </p>
                    </div>

                    {/* Avatar */}
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                        {(tenant?.name ?? "A").charAt(0).toUpperCase()}
                    </div>
                </div>
            </div>
        </header>
    );
}