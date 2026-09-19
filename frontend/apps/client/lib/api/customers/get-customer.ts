import { getCustomer as apiGetCustomer, type CustomerView } from "@coifyn/api-client";

/** Thin wrapper around the shared "get customer" call. */
export function getCustomer(id: string): Promise<CustomerView> {
  return apiGetCustomer(id);
}
