import { baseFetch } from "../http/base-fetch";
import type { TicketView, UpdateTicketLineInput } from "./types";

/** PATCH /tickets/:id/lines/:lineId */
export function updateTicketLine(
  id: string,
  lineId: string,
  input: UpdateTicketLineInput,
): Promise<TicketView> {
  return baseFetch<TicketView>(`/tickets/${id}/lines/${lineId}`, {
    method: "PATCH",
    body: input,
  });
}
