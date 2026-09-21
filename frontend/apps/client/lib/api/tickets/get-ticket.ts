import { getTicket as apiGetTicket, type TicketDetailView } from "@coifyn/api-client";

/** Thin wrapper around the shared "get ticket" call. */
export function getTicket(id: string): Promise<TicketDetailView> {
  return apiGetTicket(id);
}
