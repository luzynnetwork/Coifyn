import { baseFetch } from "../http/base-fetch";
import type { PaymentView, RefundInput } from "./types";

/** POST /payments/:id/refund */
export function refundPayment(id: string, input: RefundInput): Promise<PaymentView> {
  return baseFetch<PaymentView>(`/payments/${id}/refund`, { method: "POST", body: input });
}
