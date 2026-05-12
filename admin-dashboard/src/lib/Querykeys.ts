//single source of truth for all query keys
//using const arrays ensures type safety and prevents typos when using query keys in the application

export const queryKeys = {
    banks: ["banks"] as const,

    programs: ["programs"] as const,


    // rules are keyed by the program id, so we can easily fetch rules for a specific program
    // but we also have "allRules" key for the RulesPage 
    rules: {
    all:  ["rules"] as const,
    byProgram: (programId: number) => ["rules", programId] as const,
},
profile: ["profile"] as const,
} as const;