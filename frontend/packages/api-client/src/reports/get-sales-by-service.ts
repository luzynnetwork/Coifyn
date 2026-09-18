import { baseFetch } from "../http/base-fetch";
import type { SalesByServiceRow } from "./types";

/** GET /reports/sales/by-service?from&to */
export function getSalesByService(from: string, to: string): Promise<SalesByServiceRow[]> {
  return baseFetch<SalesByServiceRow[]>(`/reports/sales/by-service?from=${from}&to=${to}`);
}
