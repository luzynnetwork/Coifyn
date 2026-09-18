import { baseFetch } from "../http/base-fetch";
import type { ApplyDiscountInput, TicketView } from "./types";

/** POST /tickets/:id/discount */
export function applyTicketDiscount(id: string, input: ApplyDiscountInput): Promise<TicketView> {
  return baseFetch<TicketView>(`/tickets/${id}/discount`, { method: "POST", body: input });
}
