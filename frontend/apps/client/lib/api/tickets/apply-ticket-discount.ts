import {
  applyTicketDiscount as apiApplyTicketDiscount,
  type ApplyDiscountInput,
  type TicketDiscountResult,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "apply ticket discount" call. */
export function applyTicketDiscount(
  id: string,
  input: ApplyDiscountInput,
): Promise<TicketDiscountResult> {
  return apiApplyTicketDiscount(id, input);
}
