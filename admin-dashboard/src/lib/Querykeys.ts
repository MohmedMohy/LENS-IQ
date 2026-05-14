//single source of truth for all query keys
//using const arrays ensures type safety and prevents typos when using query keys in the application

// Single source of truth for all TanStack Query keys.
// Using const arrays ensures type safety and prevents cache collisions.

export const queryKeys = {
    banks: ["banks"] as const,

    programs: ["programs"] as const,

    rules: {
        all: ["rules"] as const,
        byProgram: (programId: number) => ["rules", programId] as const,
    },

    customers: ["customers"] as const,

    vehicles: ["vehicles"] as const,

    applications: ["applications"] as const,

    profile: ["profile"] as const,
} as const;