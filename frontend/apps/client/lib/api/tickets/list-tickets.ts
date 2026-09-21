import {
  listTickets as apiListTickets,
  type ListTicketsQuery,
  type TicketView,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "list tickets" call. */
export function listTickets(query?: ListTicketsQuery): Promise<TicketView[]> {
  return apiListTickets(query);
}
