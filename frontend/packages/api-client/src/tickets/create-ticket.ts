import { baseFetch } from "../http/base-fetch";
import type { CreateTicketInput, TicketView } from "./types";

/** POST /tickets */
export function createTicket(input: CreateTicketInput): Promise<TicketView> {
  return baseFetch<TicketView>("/tickets", { method: "POST", body: input });
}
