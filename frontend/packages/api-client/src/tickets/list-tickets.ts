import { baseFetch } from "../http/base-fetch";
import type { ListTicketsQuery, TicketView } from "./types";

/** GET /tickets?branchId&status (newest first, max 200; lines are not included). */
export function listTickets(query: ListTicketsQuery = {}): Promise<TicketView[]> {
  const params = new URLSearchParams();
  if (query.branchId) params.set("branchId", query.branchId);
  if (query.status) params.set("status", query.status);
  const qs = params.toString();
  return baseFetch<TicketView[]>(`/tickets${qs ? `?${qs}` : ""}`);
}
