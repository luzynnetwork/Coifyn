import { baseFetch } from "../http/base-fetch";
import type { PaymentView } from "./types";

/** GET /payments/:id */
export function getPayment(id: string): Promise<PaymentView> {
  return baseFetch<PaymentView>(`/payments/${id}`);
}
