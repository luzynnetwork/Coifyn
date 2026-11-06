import { baseFetch } from "../http/base-fetch";
import type { TaxRateView } from "./types";

/** GET /tax-rates */
export function listTaxRates(): Promise<TaxRateView[]> {
  return baseFetch<TaxRateView[]>("/tax-rates");
}
