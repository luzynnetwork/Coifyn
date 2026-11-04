import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { baseColumns, tenantColumns } from './_helpers.js';

/** A stylist's working block. kind: regular | override */
export const stylistShifts = pgTable(
  'stylist_shift',
  {
    ...baseColumns,
    ...tenantColumns,
    stylistId: uuid('stylist_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    startAt: timestamp('start_at', { withTimezone: true }).notNull(),
    endAt: timestamp('end_at', { withTimezone: true }).notNull(),
    chairId: uuid('chair_id'),
    kind: text('kind').notNull().default('regular'),
    templateId: uuid('template_id'),
  },
  (t) => [
    index('stylist_shift_stylist_start_idx').on(t.stylistId, t.startAt),
    index('stylist_shift_branch_start_idx').on(t.branchId, t.startAt),
  ],
);

/** Weekly recurring pattern. `pattern`: [{ weekday: 0-6 (0 = Sunday), start: "HH:MM",
 *  end: "HH:MM" }] in salon-local time. */
export const shiftTemplates = pgTable(
  'shift_template',
  {
    ...baseColumns,
    ...tenantColumns,
    stylistId: uuid('stylist_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    name: text('name').notNull(),
    chairId: uuid('chair_id'),
    pattern: jsonb('pattern').notNull().default([]),
  },
  (t) => [index('shift_template_stylist_idx').on(t.stylistId)],
);

/** status: requested | approved | denied */
export const stylistTimeOff = pgTable(
  'stylist_time_off',
  {
    ...baseColumns,
    ...tenantColumns,
    stylistId: uuid('stylist_id').notNull(),
    branchId: uuid('branch_id').notNull(),
    fromAt: timestamp('from_at', { withTimezone: true }).notNull(),
    toAt: timestamp('to_at', { withTimezone: true }).notNull(),
    reason: text('reason'),
    status: text('status').notNull().default('requested'),
    decidedBy: uuid('decided_by'),
  },
  (t) => [index('stylist_time_off_stylist_from_idx').on(t.stylistId, t.fromAt)],
);
