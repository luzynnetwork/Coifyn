import {
  addTicketLine as apiAddTicketLine,
  type AddTicketLineInput,
  type TicketView,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "add ticket line" call. */
export function addTicketLine(id: string, input: AddTicketLineInput): Promise<TicketView> {
  return apiAddTicketLine(id, input);
}
