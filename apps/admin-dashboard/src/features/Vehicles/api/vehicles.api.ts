import { apiClient } from "@/api/client";
import type { Vehicle, CreateVehiclePayload, UpdateVehiclePayload } from "@/types";

function normalizeVehicle(raw: Record<string, unknown>): Vehicle {
    return {
        id: Number(raw.id),
        brand: String(raw.brand),
        model: String(raw.model),
        manufacturing_year: Number(raw.manufacturing_year),
        condition: raw.condition as Vehicle["condition"],
        price: Number(raw.price),
        category: raw.category != null ? raw.category as Vehicle["category"] : null,
    };
}

export const vehiclesApi = {
    getAll: async (): Promise<Vehicle[]> => {
        const { data } = await apiClient.get<Vehicle[]>("/admin/vehicles");
        return data.map(normalizeVehicle);
    },

    getById: async (id: number): Promise<Vehicle> => {
        const { data } = await apiClient.get<Vehicle>(`/admin/vehicles/${id}`);
        return normalizeVehicle(data as Record<string, unknown>);
    },

    create: async (payload: CreateVehiclePayload): Promise<Vehicle> => {
        const { data } = await apiClient.post<Vehicle>("/admin/vehicles", payload);
        return normalizeVehicle(data as Record<string, unknown>);
    },

    update: async (id: number, payload: UpdateVehiclePayload): Promise<Vehicle> => {
        const { data } = await apiClient.patch<Vehicle>(`/admin/vehicles/${id}`, payload);
        return normalizeVehicle(data as Record<string, unknown>);
    },

    remove: async (id: number): Promise<void> => {
        await apiClient.delete(`/admin/vehicles/${id}`);
    },
};
