import { baseFetch } from "../http/base-fetch";
import type { TicketView } from "./types";

/** GET /tickets/:id */
export function getTicket(id: string): Promise<TicketView> {
  return baseFetch<TicketView>(`/tickets/${id}`);
}
