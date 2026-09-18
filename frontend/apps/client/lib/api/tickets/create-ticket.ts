import {
  createTicket as apiCreateTicket,
  type CreateTicketInput,
  type TicketView,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "create ticket" call. */
export function createTicket(input: CreateTicketInput): Promise<TicketView> {
  return apiCreateTicket(input);
}
