import {
  getSalesByStylist as apiGetSalesByStylist,
  type SalesByStylistRow,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "sales by stylist" call. */
export function getSalesByStylist(from: string, to: string): Promise<SalesByStylistRow[]> {
  return apiGetSalesByStylist(from, to);
}
