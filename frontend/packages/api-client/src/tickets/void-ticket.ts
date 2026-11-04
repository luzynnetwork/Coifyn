import { baseFetch } from "../http/base-fetch";
import type { TicketView, VoidTicketInput } from "./types";

/** POST /tickets/:id/void */
export function voidTicket(id: string, input: VoidTicketInput): Promise<TicketView> {
  return baseFetch<TicketView>(`/tickets/${id}/void`, { method: "POST", body: input });
}
