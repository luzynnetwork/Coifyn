import { baseFetch } from "../http/base-fetch";
import type { CustomerView } from "./types";

/** GET /customers */
export function listCustomers(search?: string): Promise<CustomerView[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return baseFetch<CustomerView[]>(`/customers${query}`);
}
