import {
  getCustomerVisits as apiGetCustomerVisits,
  type CustomerVisitView,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "get customer visits" call. */
export function getCustomerVisits(id: string): Promise<CustomerVisitView[]> {
  return apiGetCustomerVisits(id);
}
