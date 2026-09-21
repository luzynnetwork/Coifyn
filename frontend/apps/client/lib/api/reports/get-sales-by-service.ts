import {
  getSalesByService as apiGetSalesByService,
  type SalesByServiceRow,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "sales by service" call. */
export function getSalesByService(
  from: string,
  to: string,
  branchId?: string,
): Promise<SalesByServiceRow[]> {
  return apiGetSalesByService(from, to, branchId);
}
