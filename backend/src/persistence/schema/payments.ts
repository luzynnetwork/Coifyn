import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { baseColumns, tenantColumns } from './_helpers.js';

/**
 * Money taken against a ticket. Integer minor units.
 * method: cash | card       status: pending | completed | failed
 * `registerSessionId` copies the ticket's session so a session's cash can be
 * summed directly from payments when reconciling the till.
 */
export const payments = pgTable(
  'payment',
  {
    ...baseColumns,
    ...tenantColumns,
    ticketId: uuid('ticket_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    registerSessionId: uuid('register_session_id'),
    method: text('method').notNull(),
    amountMinor: integer('amount_minor').notNull(),
    status: text('status').notNull().default('completed'),
    providerRef: text('provider_ref'),
    failureReason: text('failure_reason'),
    takenBy: uuid('taken_by').notNull(),
  },
  (t) => [
    index('payment_ticket_idx').on(t.ticketId),
    index('payment_branch_created_idx').on(t.branchId, t.createdAt),
    index('payment_session_idx').on(t.registerSessionId),
  ],
);

/** Money returned. A refund never edits the payment it reverses — it is its own
 *  row, so the day report can show taken and refunded separately. */
export const refunds = pgTable(
  'refund',
  {
    ...baseColumns,
    ...tenantColumns,
    paymentId: uuid('payment_id').notNull(),
    ticketId: uuid('ticket_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    amountMinor: integer('amount_minor').notNull(),
    reason: text('reason').notNull(),
    providerRef: text('provider_ref'),
    approvedBy: uuid('approved_by').notNull(),
  },
  (t) => [
    index('refund_payment_idx').on(t.paymentId),
    index('refund_branch_created_idx').on(t.branchId, t.createdAt),
  ],
);

/** One receipt per paid ticket; `sequence` is per-salon and gap-free per issue. */
export const receipts = pgTable(
  'receipt',
  {
    ...baseColumns,
    ...tenantColumns,
    ticketId: uuid('ticket_id').notNull(),
    sequence: integer('sequence').notNull(),
    number: text('number').notNull(),
    issuedAt: timestamp('issued_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    format: text('format').notNull().default('standard'),
  },
  (t) => [
    uniqueIndex('receipt_ticket_key').on(t.ticketId),
    uniqueIndex('receipt_salon_sequence_key').on(t.salonId, t.sequence),
  ],
);
