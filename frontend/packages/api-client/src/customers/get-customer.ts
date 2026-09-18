import { baseFetch } from "../http/base-fetch";
import type { CustomerView } from "./types";

/** GET /customers/:id */
export function getCustomer(id: string): Promise<CustomerView> {
  return baseFetch<CustomerView>(`/customers/${id}`);
}
