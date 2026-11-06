import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { baseColumns, tenantColumns } from './_helpers.js';

/** kind: running_late | absent | left_early. status: open | resolved */
export const disruptions = pgTable(
  'disruption',
  {
    ...baseColumns,
    ...tenantColumns,
    branchId: uuid('branch_id').notNull(),
    stylistId: uuid('stylist_id').notNull(),
    kind: text('kind').notNull(),
    minutesLate: integer('minutes_late'),
    windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
    windowEnd: timestamp('window_end', { withTimezone: true }).notNull(),
    status: text('status').notNull().default('open'),
    createdBy: uuid('created_by').notNull(),
    notifiedAt: timestamp('notified_at', { withTimezone: true }),
  },
  (t) => [index('disruption_branch_status_idx').on(t.branchId, t.status)],
);

/** choice: pending | wait | next_slot | stand_in | cancel */
export const disruptionOffers = pgTable(
  'disruption_offer',
  {
    ...baseColumns,
    ...tenantColumns,
    disruptionId: uuid('disruption_id').notNull(),
    appointmentId: uuid('appointment_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    options: jsonb('options').notNull().default([]),
    choice: text('choice').notNull().default('pending'),
    standInStylistId: uuid('stand_in_stylist_id'),
    sentAt: timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    escalatedAt: timestamp('escalated_at', { withTimezone: true }),
  },
  (t) => [
    index('disruption_offer_disruption_idx').on(t.disruptionId),
    index('disruption_offer_appointment_idx').on(t.appointmentId),
  ],
);
