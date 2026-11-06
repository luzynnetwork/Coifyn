import { baseFetch } from "../http/base-fetch";
import type { ApplyDiscountInput, TicketDiscountResult } from "./types";

/** POST /tickets/:id/discount returns {ticket, discount}; needs pos:discount. */
export function applyTicketDiscount(
  id: string,
  input: ApplyDiscountInput,
): Promise<TicketDiscountResult> {
  return baseFetch<TicketDiscountResult>(`/tickets/${id}/discount`, {
    method: "POST",
    body: input,
  });
}
