import { baseFetch } from "../http/base-fetch";
import type { TicketDetailView } from "./types";

/** GET /tickets/:id returns the ticket with `lines` and `discount`. */
export function getTicket(id: string): Promise<TicketDetailView> {
  return baseFetch<TicketDetailView>(`/tickets/${id}`);
}
