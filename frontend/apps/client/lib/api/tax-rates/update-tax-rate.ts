import {
  updateTaxRate as apiUpdateTaxRate,
  type TaxRateView,
  type UpdateTaxRateInput,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "update tax rate" call. */
export function updateTaxRate(id: string, input: UpdateTaxRateInput): Promise<TaxRateView> {
  return apiUpdateTaxRate(id, input);
}
