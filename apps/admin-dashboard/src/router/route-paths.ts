// src/router/route-paths.ts

export const routePaths = {
    login: "/login",
    dashboard: "/dashboard",
    banks: "/banks",
    programs: "/programs",
    rules: "/rules",
    customers: "/customers",
    vehicles: "/vehicles",
    applications: "/applications",
    evaluate: "/evaluate",
    profile: "/profile",
    users: "/users",
    audit: "/audit",
} as const;

export type AppRouteKey = keyof typeof routePaths;
export type AppRoutePath = (typeof routePaths)[AppRouteKey];