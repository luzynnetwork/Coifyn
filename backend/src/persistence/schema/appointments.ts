import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { baseColumns, tenantColumns } from './_helpers.js';

/**
 * A staff-entered booking (Phase 1 `appointments`, minimal — the calendar,
 * holds and self-serve booking are Phase 2/4).
 * status: booked | arrived | in_service | completed | no_show | cancelled
 * "Active" (blocks the stylist/chair) means booked | arrived | in_service.
 */
export const appointments = pgTable(
  'appointment',
  {
    ...baseColumns,
    ...tenantColumns,
    branchId: uuid('branch_id').notNull(),
    stylistId: uuid('stylist_id').notNull(),
    chairId: uuid('chair_id'),
    customerId: uuid('customer_id'),
    serviceIds: jsonb('service_ids').notNull().default([]),
    addOnIds: jsonb('add_on_ids').notNull().default([]),
    startAt: timestamp('start_at', { withTimezone: true }).notNull(),
    endAt: timestamp('end_at', { withTimezone: true }).notNull(),
    status: text('status').notNull().default('booked'),
    source: text('source').notNull().default('front_desk'),
    notes: text('notes'),
  },
  (t) => [
    index('appointment_branch_start_idx').on(t.branchId, t.startAt),
    index('appointment_stylist_start_idx').on(t.stylistId, t.startAt),
    index('appointment_chair_start_idx').on(t.chairId, t.startAt),
  ],
);
