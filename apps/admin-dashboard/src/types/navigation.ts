export type Route = "login" | "dashboard" | "banks" | "programs" | "rules" | "evaluate" | "users" | "widgetPreview";

export type Navigate = (to: Route) => void;
