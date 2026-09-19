import { listCustomers as apiListCustomers, type CustomerView } from "@coifyn/api-client";

/** Thin wrapper around the shared "list customers" call. */
export function listCustomers(search?: string): Promise<CustomerView[]> {
  return apiListCustomers(search);
}
