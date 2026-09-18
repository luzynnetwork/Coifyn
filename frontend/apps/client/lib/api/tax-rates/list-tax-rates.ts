import { listTaxRates as apiListTaxRates, type TaxRateView } from "@coifyn/api-client";

/** Thin wrapper around the shared "list tax rates" call. */
export function listTaxRates(): Promise<TaxRateView[]> {
  return apiListTaxRates();
}
