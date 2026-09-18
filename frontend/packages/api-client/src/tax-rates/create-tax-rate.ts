import { baseFetch } from "../http/base-fetch";
import type { CreateTaxRateInput, TaxRateView } from "./types";

/** POST /tax-rates */
export function createTaxRate(input: CreateTaxRateInput): Promise<TaxRateView> {
  return baseFetch<TaxRateView>("/tax-rates", { method: "POST", body: input });
}
