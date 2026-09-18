import { baseFetch } from "../http/base-fetch";
import type { AddTicketLineInput, TicketView } from "./types";

/** POST /tickets/:id/lines */
export function addTicketLine(id: string, input: AddTicketLineInput): Promise<TicketView> {
  return baseFetch<TicketView>(`/tickets/${id}/lines`, { method: "POST", body: input });
}
