import { baseFetch } from "../http/base-fetch";
import type { ReceiptView } from "./types";

/** GET /tickets/:id/receipt */
export function getTicketReceipt(ticketId: string): Promise<ReceiptView> {
  return baseFetch<ReceiptView>(`/tickets/${ticketId}/receipt`);
}
