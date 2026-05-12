import { z } from "zod";

export const createVehicleSchema = z.object({
    brand: z.string().min(1),
    model: z.string().min(1),
    manufacturing_year: z.number().int().min(1990).max(new Date().getFullYear() + 1),
    condition: z.enum(["new", "used"]),
    price: z.number().positive(),
    category: z.enum(["sedan", "suv", "truck", "van", "microbus"]).optional(),
});

export const updateVehicleSchema = createVehicleSchema.partial();

export type CreateVehicleDTO = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleDTO = z.infer<typeof updateVehicleSchema>;