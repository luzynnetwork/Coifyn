import { baseFetch } from "../http/base-fetch";
import type { TicketLineResult, UpdateTicketLineInput } from "./types";

/** PATCH /tickets/:id/lines/:lineId returns {ticket, line}. */
export function updateTicketLine(
  id: string,
  lineId: string,
  input: UpdateTicketLineInput,
): Promise<TicketLineResult> {
  return baseFetch<TicketLineResult>(`/tickets/${id}/lines/${lineId}`, {
    method: "PATCH",
    body: input,
  });
}
