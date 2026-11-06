import { baseFetch } from "../http/base-fetch";
import type { AddTicketLineInput, TicketLineResult } from "./types";

/** POST /tickets/:id/lines returns {ticket, line}. */
export function addTicketLine(id: string, input: AddTicketLineInput): Promise<TicketLineResult> {
  return baseFetch<TicketLineResult>(`/tickets/${id}/lines`, { method: "POST", body: input });
}
