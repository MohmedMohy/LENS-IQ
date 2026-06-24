export type Route = "login" | "dashboard" | "banks" | "programs" | "rules" | "evaluate" | "users";

export type Navigate = (to: Route) => void;
