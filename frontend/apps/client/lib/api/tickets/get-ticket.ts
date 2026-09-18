import { getTicket as apiGetTicket, type TicketView } from "@coifyn/api-client";

/** Thin wrapper around the shared "get ticket" call. */
export function getTicket(id: string): Promise<TicketView> {
  return apiGetTicket(id);
}
