export type Route = "login" | "dashboard" | "banks" | "programs" | "rules" | "evaluate";

export type Navigate = (to: Route) => void;
