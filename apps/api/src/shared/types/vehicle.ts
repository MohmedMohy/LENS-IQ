export interface Vehicle {
    id: number;
    tenant_id: number;
    brand: string;
    model: string;
    manufacturing_year: number;
    condition: "new" | "used";
    price: number;
    category: string | null;
    created_at: string;
}