import {
  updateTicketLine as apiUpdateTicketLine,
  type TicketLineResult,
  type UpdateTicketLineInput,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "update ticket line" call. */
export function updateTicketLine(
  id: string,
  lineId: string,
  input: UpdateTicketLineInput,
): Promise<TicketLineResult> {
  return apiUpdateTicketLine(id, lineId, input);
}
