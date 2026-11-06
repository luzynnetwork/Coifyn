/**
 * Payment wire types, mirrored from the `payment`, `refund` and `receipt`
 * drizzle tables, backend/src/payments/dto and the use cases in
 * backend/src/payments/application. Money is integer minor units.
 */

import type {
  TicketDiscountView,
  TicketLineView,
  TicketView,
} from "../tickets/types";

export type PaymentMethod = "cash" | "card";
export type PaymentStatus = "pending" | "completed" | "failed";

/** `payment` row. */
export interface PaymentView {
  id: string;
  salonId: string;
  ticketId: string;
  branchId: string;
  registerSessionId: string | null;
  method: PaymentMethod;
  amountMinor: number;
  status: PaymentStatus;
  providerRef: string | null;
  /** Set when status is "failed" (e.g. a declined card). */
  failureReason: string | null;
  takenBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/** GET /payments/:id: the payment plus how much of it has been refunded. */
export interface PaymentDetailView extends PaymentView {
  refundedMinor: number;
}

export interface CreatePaymentInput {
  ticketId: string;
  method: PaymentMethod;
  /** Integer minor units applied to the ticket; may not exceed the balance due. */
  amountMinor: number;
}

/**
 * POST /payments response (HTTP 201 even on a declined card). A failed card
 * attempt comes back with `settled: false` and `payment.status === "failed"`;
 * the ticket stays open. Only `settled: true` means the ticket is now paid.
 */
export interface TakePaymentResult {
  payment: PaymentView;
  ticket: TicketView;
  settled: boolean;
}

export interface RefundInput {
  /** Integer minor units, 1 to the amount still refundable. */
  amountMinor: number;
  /** Mandatory, 3-300 chars. */
  reason: string;
}

/** `refund` row, returned by POST /payments/:id/refund. */
export interface RefundView {
  id: string;
  salonId: string;
  paymentId: string;
  ticketId: string;
  branchId: string;
  amountMinor: number;
  reason: string;
  providerRef: string | null;
  approvedBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ListPaymentsQuery {
  ticketId?: string;
  branchId?: string;
}

/** `receipt` row. */
export interface ReceiptRowView {
  id: string;
  salonId: string;
  ticketId: string;
  sequence: number;
  number: string;
  issuedAt: string;
  format: string;
  createdAt: string;
  updatedAt: string;
}

/** GET /tickets/:id/receipt (only for a paid ticket; 409 otherwise). */
export interface ReceiptView {
  receipt: ReceiptRowView;
  salon: { brandName?: string; currency?: string; timezone?: string };
  branch: { name?: string };
  ticket: TicketView;
  lines: TicketLineView[];
  discount: TicketDiscountView | null;
  /** Completed payments only. */
  payments: PaymentView[];
}
