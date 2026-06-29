import type { PipelineState, PipelineStep } from "../types.js";

export class ValidationStep implements PipelineStep {
  name = "InputValidation";

  execute(state: PipelineState): PipelineState {
    const { applicationInput, tenantId } = state.input;

    if (tenantId <= 0) {
      return { ...state, errors: [...state.errors, "Invalid tenant ID"] };
    }

    if (applicationInput.salary <= 0) {
      return { ...state, errors: [...state.errors, "Salary must be greater than 0"] };
    }

    if (applicationInput.price <= 0) {
      return { ...state, errors: [...state.errors, "Vehicle price must be greater than 0"] };
    }

    if (applicationInput.requestedMonths < 1) {
      return { ...state, errors: [...state.errors, "Requested months must be at least 1"] };
    }

    if (applicationInput.requestedDownPayment < 0) {
      return { ...state, errors: [...state.errors, "Down payment cannot be negative"] };
    }

    if (applicationInput.requestedDownPayment >= applicationInput.price) {
      return { ...state, errors: [...state.errors, "Down payment must be less than vehicle price"] };
    }

    return state;
  }
}
