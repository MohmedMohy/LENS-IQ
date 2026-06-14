export type VehicleCondition = "new" | "used";
export type VehicleCategory = "sedan" | "suv" | "truck" | "van" | "microbus";

export interface Vehicle {
  id: number;
  brand: string;
  model: string;
  manufacturing_year: number;
  condition: VehicleCondition;
  price: number;
  category: VehicleCategory | null;
}

export type CreateVehiclePayload = Omit<Vehicle, "id">;
export type UpdateVehiclePayload = Partial<CreateVehiclePayload>;
