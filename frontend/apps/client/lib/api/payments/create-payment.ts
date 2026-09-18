import {
  createPayment as apiCreatePayment,
  type CreatePaymentInput,
  type PaymentView,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "create payment" call. */
export function createPayment(input: CreatePaymentInput): Promise<PaymentView> {
  return apiCreatePayment(input);
}
