import { baseFetch } from "../http/base-fetch";
import type { TicketView } from "./types";

/** DELETE /tickets/:id/lines/:lineId */
export function deleteTicketLine(id: string, lineId: string): Promise<TicketView> {
  return baseFetch<TicketView>(`/tickets/${id}/lines/${lineId}`, { method: "DELETE" });
}
