import {
  refundPayment as apiRefundPayment,
  type RefundInput,
  type RefundPaymentOptions,
  type RefundView,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "refund payment" call. */
export function refundPayment(
  id: string,
  input: RefundInput,
  options?: RefundPaymentOptions,
): Promise<RefundView> {
  return apiRefundPayment(id, input, options);
}
