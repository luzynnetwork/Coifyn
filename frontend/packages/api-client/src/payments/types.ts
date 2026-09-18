/** Payment wire types — documented contract, see phases/phase-1-salon-core.md. */

export type PaymentMethod = "cash" | "card";
export type PaymentStatus = "pending" | "completed" | "failed";

export interface PaymentView {
  id: string;
  ticketId: string;
  method: PaymentMethod;
  amountMinor: number;
  status: PaymentStatus;
  providerRef: string | null;
  takenBy: string;
  createdAt: string;
}

export interface CreatePaymentInput {
  ticketId: string;
  method: PaymentMethod;
  amountMinor: number;
}

export interface RefundInput {
  amountMinor: number;
  reason: string;
}

export interface ReceiptLineView {
  description: string;
  qty: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
}

export interface ReceiptView {
  ticketId: string;
  number: string;
  issuedAt: string;
  format: string;
  lines: ReceiptLineView[];
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
}
