import {
  createTaxRate as apiCreateTaxRate,
  type CreateTaxRateInput,
  type TaxRateView,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "create tax rate" call. */
export function createTaxRate(input: CreateTaxRateInput): Promise<TaxRateView> {
  return apiCreateTaxRate(input);
}
