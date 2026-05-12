// src/router/route-paths.ts

export const routePaths = {
    login: "/login",
    dashboard: "/dashboard",
    banks: "/banks",
    programs: "/programs",
    rules: "/rules",
    evaluate: "/evaluate",
    profile: "/profile",
} as const;

export type AppRouteKey = keyof typeof routePaths;
export type AppRoutePath = (typeof routePaths)[AppRouteKey];