import {
  updateTicketLine as apiUpdateTicketLine,
  type TicketView,
  type UpdateTicketLineInput,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "update ticket line" call. */
export function updateTicketLine(
  id: string,
  lineId: string,
  input: UpdateTicketLineInput,
): Promise<TicketView> {
  return apiUpdateTicketLine(id, lineId, input);
}
