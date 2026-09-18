import { baseFetch } from "../http/base-fetch";
import type { PaymentView } from "./types";

/** GET /payments */
export function listPayments(ticketId?: string): Promise<PaymentView[]> {
  const query = ticketId ? `?ticketId=${ticketId}` : "";
  return baseFetch<PaymentView[]>(`/payments${query}`);
}
