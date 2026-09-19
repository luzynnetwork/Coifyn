import { sql } from 'drizzle-orm';
import {
  boolean,
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
 * A till shift at one branch. Expected cash and variance are NOT stored: they
 * are derived from the cash payments in the session window by the reports
 * module, so they can never disagree with the payments they summarise.
 */
export const registerSessions = pgTable(
  'register_session',
  {
    ...baseColumns,
    ...tenantColumns,
    branchId: uuid('branch_id').notNull(),
    openedBy: uuid('opened_by').notNull(),
    openingFloatMinor: integer('opening_float_minor').notNull(),
    closingCountMinor: integer('closing_count_minor'),
    openedAt: timestamp('opened_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    closedAt: timestamp('closed_at', { withTimezone: true }),
  },
  (t) => [
    index('register_session_branch_idx').on(t.branchId, t.openedAt),
    // At most one open session per branch.
    uniqueIndex('register_session_one_open_key')
      .on(t.branchId)
      .where(sql`closed_at is null and deleted_at is null`),
  ],
);

/**
 * The POS sale. All money is integer minor units. The tax rate in force is
 * snapshotted onto the ticket so later edits to a tax rate never change a
 * ticket that already exists.
 * status: open | paid | voided
 */
export const tickets = pgTable(
  'ticket',
  {
    ...baseColumns,
    ...tenantColumns,
    branchId: uuid('branch_id').notNull(),
    registerSessionId: uuid('register_session_id'),
    source: text('source').notNull().default('walk_in'), // queue | appointment | walk_in
    sourceId: uuid('source_id'),
    customerId: uuid('customer_id'),
    status: text('status').notNull().default('open'),
    taxBasisPoints: integer('tax_basis_points').notNull().default(0),
    taxInclusive: boolean('tax_inclusive').notNull().default(false),
    subtotalMinor: integer('subtotal_minor').notNull().default(0),
    discountMinor: integer('discount_minor').notNull().default(0),
    taxMinor: integer('tax_minor').notNull().default(0),
    totalMinor: integer('total_minor').notNull().default(0),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    voidReason: text('void_reason'),
    voidedBy: uuid('voided_by'),
    voidedAt: timestamp('voided_at', { withTimezone: true }),
  },
  (t) => [
    index('ticket_branch_created_idx').on(t.branchId, t.createdAt),
    index('ticket_salon_status_idx').on(t.salonId, t.status),
    index('ticket_customer_idx').on(t.customerId),
  ],
);

export const ticketLines = pgTable(
  'ticket_line',
  {
    ...baseColumns,
    ...tenantColumns,
    ticketId: uuid('ticket_id').notNull(),
    kind: text('kind').notNull(), // service | add_on
    refId: uuid('ref_id').notNull(),
    stylistId: uuid('stylist_id'),
    description: text('description').notNull(),
    qty: integer('qty').notNull().default(1),
    unitPriceMinor: integer('unit_price_minor').notNull(),
    lineTotalMinor: integer('line_total_minor').notNull(),
  },
  (t) => [
    index('ticket_line_ticket_idx').on(t.ticketId),
    index('ticket_line_stylist_idx').on(t.stylistId),
  ],
);

/** At most one discount per ticket; applying again replaces it. The reason is
 *  mandatory — it is what the audit log and the day report show. */
export const ticketDiscounts = pgTable(
  'ticket_discount',
  {
    ...baseColumns,
    ...tenantColumns,
    ticketId: uuid('ticket_id').notNull(),
    type: text('type').notNull(), // percent | amount
    value: integer('value').notNull(), // percent: basis points; amount: minor units
    reason: text('reason').notNull(),
    approvedBy: uuid('approved_by').notNull(),
  },
  (t) => [uniqueIndex('ticket_discount_ticket_key').on(t.ticketId)],
);
