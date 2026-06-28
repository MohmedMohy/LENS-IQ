export interface Bank {
    id: number;
    tenantId?: number;
    name: string;
    code: string;
    logoUrl: string | null;
    active: boolean;
    createdAt?: string;
    supportedProgramIds?: number[];
}
