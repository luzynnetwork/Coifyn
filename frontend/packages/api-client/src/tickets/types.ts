/** Ticket / POS wire types — documented contract, see phases/phase-1-salon-core.md. */

export interface RegisterSessionView {
  id: string;
  branchId: string;
  openedBy: string;
  openingFloatMinor: number;
  closingCountMinor: number | null;
  varianceMinor: number | null;
  openedAt: string;
  closedAt: string | null;
}

export interface OpenRegisterSessionInput {
  branchId: string;
  openingFloatMinor: number;
}

export interface CloseRegisterSessionInput {
  closingCountMinor: number;
}

export type TicketStatus = "open" | "paid" | "voided";
export type TicketLineKind = "service" | "add_on";
export type TicketSource = "queue" | "appointment" | "walk_in";

export interface TicketLineView {
  id: string;
  ticketId: string;
  kind: TicketLineKind;
  refId: string;
  stylistId: string | null;
  description: string;
  qty: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
}

export interface TicketView {
  id: string;
  branchId: string;
  source: TicketSource;
  sourceId: string | null;
  customerRef: string | null;
  status: TicketStatus;
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
  lines: TicketLineView[];
  createdAt: string;
}

export interface CreateTicketInput {
  branchId: string;
  source: TicketSource;
  sourceId?: string;
  customerRef?: string;
}

export interface AddTicketLineInput {
  kind: TicketLineKind;
  refId: string;
  stylistId?: string;
  qty: number;
}

export interface UpdateTicketLineInput {
  qty?: number;
}

export interface ApplyDiscountInput {
  type: "percent" | "amount";
  value: number;
  reason: string;
}

export interface VoidTicketInput {
  reason: string;
}
