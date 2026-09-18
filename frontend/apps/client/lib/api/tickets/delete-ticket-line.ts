import { deleteTicketLine as apiDeleteTicketLine, type TicketView } from "@coifyn/api-client";

/** Thin wrapper around the shared "delete ticket line" call. */
export function deleteTicketLine(id: string, lineId: string): Promise<TicketView> {
  return apiDeleteTicketLine(id, lineId);
}
