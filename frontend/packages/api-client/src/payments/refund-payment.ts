import { baseFetch } from "../http/base-fetch";
import type { RefundInput, RefundView } from "./types";

export interface RefundPaymentOptions {
  /** Sent as Idempotency-Key so a retried request cannot refund twice. */
  idempotencyKey?: string;
}

/** POST /payments/:id/refund (needs payment:refund) returns the refund row. */
export function refundPayment(
  id: string,
  input: RefundInput,
  options: RefundPaymentOptions = {},
): Promise<RefundView> {
  return baseFetch<RefundView>(`/payments/${id}/refund`, {
    method: "POST",
    body: input,
    idempotencyKey: options.idempotencyKey,
  });
}
