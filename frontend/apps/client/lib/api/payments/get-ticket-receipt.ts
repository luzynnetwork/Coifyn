import { getTicketReceipt as apiGetTicketReceipt, type ReceiptView } from "@coifyn/api-client";

/** Thin wrapper around the shared "get ticket receipt" call. */
export function getTicketReceipt(ticketId: string): Promise<ReceiptView> {
  return apiGetTicketReceipt(ticketId);
}
