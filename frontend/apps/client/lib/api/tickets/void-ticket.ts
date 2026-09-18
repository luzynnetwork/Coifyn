import {
  voidTicket as apiVoidTicket,
  type TicketView,
  type VoidTicketInput,
} from "@coifyn/api-client";

/** Thin wrapper around the shared "void ticket" call. */
export function voidTicket(id: string, input: VoidTicketInput): Promise<TicketView> {
  return apiVoidTicket(id, input);
}
