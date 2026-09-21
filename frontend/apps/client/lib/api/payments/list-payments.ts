import {
  listPayments as apiListPayments,
  type ListPaymentsQuery,
  type PaymentView,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "list payments" call. */
export function listPayments(query?: ListPaymentsQuery): Promise<PaymentView[]> {
  return apiListPayments(query);
}
