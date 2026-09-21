import {
  createPayment as apiCreatePayment,
  type CreatePaymentInput,
  type CreatePaymentOptions,
  type TakePaymentResult,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "create payment" call. */
export function createPayment(
  input: CreatePaymentInput,
  options?: CreatePaymentOptions,
): Promise<TakePaymentResult> {
  return apiCreatePayment(input, options);
}
