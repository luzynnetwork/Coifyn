import { baseFetch } from "../http/base-fetch";
import type { PaymentDetailView } from "./types";

/** GET /payments/:id (includes refundedMinor). */
export function getPayment(id: string): Promise<PaymentDetailView> {
  return baseFetch<PaymentDetailView>(`/payments/${id}`);
}
