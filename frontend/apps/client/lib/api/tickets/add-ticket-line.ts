import {
  addTicketLine as apiAddTicketLine,
  type AddTicketLineInput,
  type TicketLineResult,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "add ticket line" call. */
export function addTicketLine(id: string, input: AddTicketLineInput): Promise<TicketLineResult> {
  return apiAddTicketLine(id, input);
}
