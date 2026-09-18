import { baseFetch } from "../http/base-fetch";
import type { SalesByStylistRow } from "./types";

/** GET /reports/sales/by-stylist?from&to */
export function getSalesByStylist(from: string, to: string): Promise<SalesByStylistRow[]> {
  return baseFetch<SalesByStylistRow[]>(`/reports/sales/by-stylist?from=${from}&to=${to}`);
}
