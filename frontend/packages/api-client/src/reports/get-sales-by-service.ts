import { baseFetch } from "../http/base-fetch";
import type { SalesByServiceRow } from "./types";

/**
 * GET /reports/sales/by-service?from&to&branchId?. Omitting branchId reports
 * the whole salon and needs an org-wide report:view grant.
 */
export function getSalesByService(
  from: string,
  to: string,
  branchId?: string,
): Promise<SalesByServiceRow[]> {
  const params = new URLSearchParams({ from, to });
  if (branchId) params.set("branchId", branchId);
  return baseFetch<SalesByServiceRow[]>(`/reports/sales/by-service?${params.toString()}`);
}
