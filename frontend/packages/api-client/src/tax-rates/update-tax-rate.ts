import { baseFetch } from "../http/base-fetch";
import type { TaxRateView, UpdateTaxRateInput } from "./types";

/** PATCH /tax-rates/:id */
export function updateTaxRate(id: string, input: UpdateTaxRateInput): Promise<TaxRateView> {
  return baseFetch<TaxRateView>(`/tax-rates/${id}`, { method: "PATCH", body: input });
}
