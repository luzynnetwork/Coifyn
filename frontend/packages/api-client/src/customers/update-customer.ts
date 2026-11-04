import { baseFetch } from "../http/base-fetch";
import type { CustomerView, UpdateCustomerInput } from "./types";

/** PATCH /customers/:id */
export function updateCustomer(id: string, input: UpdateCustomerInput): Promise<CustomerView> {
  return baseFetch<CustomerView>(`/customers/${id}`, { method: "PATCH", body: input });
}
