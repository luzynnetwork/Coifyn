import { baseFetch } from "../http/base-fetch";
import type { ListPaymentsQuery, PaymentView } from "./types";

/** GET /payments?ticketId&branchId (newest first, max 200). */
export function listPayments(query: ListPaymentsQuery = {}): Promise<PaymentView[]> {
  const params = new URLSearchParams();
  if (query.ticketId) params.set("ticketId", query.ticketId);
  if (query.branchId) params.set("branchId", query.branchId);
  const qs = params.toString();
  return baseFetch<PaymentView[]>(`/payments${qs ? `?${qs}` : ""}`);
}
