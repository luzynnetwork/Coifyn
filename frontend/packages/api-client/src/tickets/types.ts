/**
 * Ticket / POS wire types, mirrored from the `register_session`, `ticket`,
 * `ticket_line` and `ticket_discount` drizzle tables, backend/src/tickets/dto
 * and the use cases in backend/src/tickets/application. Money is integer minor units.
 */

/** `register_session` row. Expected cash / variance are derived by the reports module, not stored. */
export interface RegisterSessionView {
  id: string;
  salonId: string;
  branchId: string;
  openedBy: string;
  openingFloatMinor: number;
  closingCountMinor: number | null;
  openedAt: string;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface OpenRegisterSessionInput {
  branchId: string;
  /** Integer minor units, 0 to 100,000,000. */
  openingFloatMinor: number;
}

export interface CloseRegisterSessionInput {
  /** Counted cash, integer minor units, 0 to 1,000,000,000. */
  closingCountMinor: number;
}

export type TicketStatus = "open" | "paid" | "voided";
export type TicketLineKind = "service" | "add_on";
export type TicketSource = "queue" | "appointment" | "walk_in";

/** `ticket_line` row. */
export interface TicketLineView {
  id: string;
  salonId: string;
  ticketId: string;
  kind: TicketLineKind;
  refId: string;
  stylistId: string | null;
  description: string;
  qty: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/** `ticket_discount` row (at most one per ticket). */
export interface TicketDiscountView {
  id: string;
  salonId: string;
  ticketId: string;
  type: "percent" | "amount";
  /** percent: basis points (1000 = 10%); amount: minor units. */
  value: number;
  reason: string;
  approvedBy: string;
  createdAt: string;
  updatedAt: string;
}

/** `ticket` row, as returned by list, create, void and delete-line. */
export interface TicketView {
  id: string;
  salonId: string;
  branchId: string;
  registerSessionId: string | null;
  source: TicketSource;
  sourceId: string | null;
  customerId: string | null;
  status: TicketStatus;
  taxBasisPoints: number;
  taxInclusive: boolean;
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
  paidAt: string | null;
  voidReason: string | null;
  voidedBy: string | null;
  voidedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/** GET /tickets/:id: the ticket plus its lines and discount. */
export interface TicketDetailView extends TicketView {
  lines: TicketLineView[];
  discount: TicketDiscountView | null;
}

export interface CreateTicketInput {
  branchId: string;
  source: TicketSource;
  /** Queue entry / appointment id; required unless source is walk_in. */
  sourceId?: string;
  customerId?: string;
}

export interface AddTicketLineInput {
  kind: TicketLineKind;
  /** Service id or add-on id, depending on kind. */
  refId: string;
  /** The stylist doing the work; their per-service price override applies. */
  stylistId?: string;
  /** 1-99, defaults to 1. */
  qty?: number;
}

/** POST /tickets/:id/lines and PATCH /tickets/:id/lines/:lineId response. */
export interface TicketLineResult {
  ticket: TicketView;
  line: TicketLineView;
}

export interface UpdateTicketLineInput {
  /** 1-99. */
  qty: number;
}

export interface ApplyDiscountInput {
  type: "percent" | "amount";
  /** percent: basis points (1-10000); amount: minor units. */
  value: number;
  /** Mandatory, 3-300 chars. */
  reason: string;
}

/** POST /tickets/:id/discount response. */
export interface TicketDiscountResult {
  ticket: TicketView;
  discount: TicketDiscountView;
}

export interface VoidTicketInput {
  /** Mandatory, 3-300 chars. */
  reason: string;
}

export interface ListTicketsQuery {
  branchId?: string;
  status?: TicketStatus;
}
