import { baseFetch } from "../http/base-fetch";
import type { TicketView } from "./types";

/** GET /tickets */
export function listTickets(branchId?: string): Promise<TicketView[]> {
  const query = branchId ? `?branchId=${branchId}` : "";
  return baseFetch<TicketView[]>(`/tickets${query}`);
}
