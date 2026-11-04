import { baseFetch } from "../http/base-fetch";
import type { CustomerVisitView } from "./types";

/** GET /customers/:id/visits */
export function getCustomerVisits(id: string): Promise<CustomerVisitView[]> {
  return baseFetch<CustomerVisitView[]>(`/customers/${id}/visits`);
}
