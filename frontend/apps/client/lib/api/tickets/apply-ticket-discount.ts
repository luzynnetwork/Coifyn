import {
  applyTicketDiscount as apiApplyTicketDiscount,
  type ApplyDiscountInput,
  type TicketView,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "apply ticket discount" call. */
export function applyTicketDiscount(id: string, input: ApplyDiscountInput): Promise<TicketView> {
  return apiApplyTicketDiscount(id, input);
}
