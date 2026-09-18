import {
  refundPayment as apiRefundPayment,
  type PaymentView,
  type RefundInput,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "refund payment" call. */
export function refundPayment(id: string, input: RefundInput): Promise<PaymentView> {
  return apiRefundPayment(id, input);
}
