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
 * A walk-in waiting for a stylist (Phase 1 `queue` module). `position` is
 * derived from `joinedAt` order among `waiting` rows — never stored.
 * status: waiting | assigned | in_service | done | left
 */
export const queueEntries = pgTable(
  'queue_entry',
  {
    ...baseColumns,
    ...tenantColumns,
    branchId: uuid('branch_id').notNull(),
    customerId: uuid('customer_id'),
    walkInName: text('walk_in_name'),
    requestedStylistId: uuid('requested_stylist_id'),
    requestedServiceIds: jsonb('requested_service_ids').notNull().default([]),
    status: text('status').notNull().default('waiting'),
    joinedAt: timestamp('joined_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    assignedStylistId: uuid('assigned_stylist_id'),
    assignedChairId: uuid('assigned_chair_id'),
    calledAt: timestamp('called_at', { withTimezone: true }),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    leftReason: text('left_reason'),
  },
  (t) => [
    index('queue_entry_branch_status_idx').on(t.branchId, t.status),
    index('queue_entry_salon_idx').on(t.salonId),
  ],
);
