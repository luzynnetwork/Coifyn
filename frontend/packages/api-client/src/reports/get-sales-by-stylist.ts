import { baseFetch } from "../http/base-fetch";
import type { SalesByStylistRow } from "./types";

/**
 * GET /reports/sales/by-stylist?from&to&branchId?. Omitting branchId reports
 * the whole salon and needs an org-wide report:view grant.
 */
export function getSalesByStylist(
  from: string,
  to: string,
  branchId?: string,
): Promise<SalesByStylistRow[]> {
  const params = new URLSearchParams({ from, to });
  if (branchId) params.set("branchId", branchId);
  return baseFetch<SalesByStylistRow[]>(`/reports/sales/by-stylist?${params.toString()}`);
}
