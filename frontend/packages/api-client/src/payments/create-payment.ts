import { baseFetch } from "../http/base-fetch";
import type { CreatePaymentInput, TakePaymentResult } from "./types";

export interface CreatePaymentOptions {
  /** Sent as Idempotency-Key so a retried request cannot double-charge. */
  idempotencyKey?: string;
}

/**
 * POST /payments. A declined card is still HTTP 201: check `result.settled`
 * and `result.payment.status`, do not treat resolution as success.
 */
export function createPayment(
  input: CreatePaymentInput,
  options: CreatePaymentOptions = {},
): Promise<TakePaymentResult> {
  return baseFetch<TakePaymentResult>("/payments", {
    method: "POST",
    body: input,
    idempotencyKey: options.idempotencyKey,
  });
}
