import { relations } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { baseColumns, tenantColumns } from './_helpers.js';
import { branches, salonOrganizations } from './tenancy.js';

/**
 * One row per weekday (0 = Sunday .. 6 = Saturday) per branch. Replaces the
 * free-form `branch.hours` jsonb placeholder from Phase 0 (see git history —
 * that field predates this table and is no longer written to).
 * `opensAt`/`closesAt` are "HH:MM" 24h strings, branch-local time; `breaks` is
 * a jsonb array of the same shape (`{ start, end }`) since a day can have zero
 * or more breaks and a relational sub-table would be overkill for that.
 */
export const branchHours = pgTable(
  'branch_hours',
  {
    ...baseColumns,
    ...tenantColumns,
    branchId: uuid('branch_id').notNull(),
    weekday: integer('weekday').notNull(), // 0=Sun .. 6=Sat
    isClosed: boolean('is_closed').notNull().default(false),
    opensAt: text('opens_at'), // "HH:MM", null when isClosed
    closesAt: text('closes_at'),
    breaks: jsonb('breaks').notNull().default([]), // [{ start: "HH:MM", end: "HH:MM" }]
  },
  (t) => [
    index('branch_hours_branch_idx').on(t.branchId),
    uniqueIndex('branch_hours_branch_weekday_key').on(t.branchId, t.weekday),
  ],
);

/** A one-off or recurring-holiday closure for a branch (the shop is shut the
 *  whole day, distinct from a within-day break in {@link branchHours}). */
export const branchClosures = pgTable(
  'branch_closure',
  {
    ...baseColumns,
    ...tenantColumns,
    branchId: uuid('branch_id').notNull(),
    startsOn: date('starts_on').notNull(),
    endsOn: date('ends_on').notNull(),
    reason: text('reason').notNull(),
  },
  (t) => [index('branch_closure_branch_idx').on(t.branchId)],
);

/**
 * A named tax rate a salon defines once and its `Service` rows (Phase 1
 * services module) reference by id — hence a real table, not a jsonb blob:
 * the FK needs something to point at. Percent is stored in basis points
 * (800 = 8.00%) to avoid float rounding, mirroring the "money = integer minor
 * units" rule for currency (architecture.md §8).
 */
export const taxRates = pgTable(
  'tax_rate',
  {
    ...baseColumns,
    ...tenantColumns,
    name: text('name').notNull(),
    percentBasisPoints: integer('percent_basis_points').notNull(),
    inclusive: boolean('inclusive').notNull().default(false),
    isDefault: boolean('is_default').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
  },
  (t) => [
    index('tax_rate_salon_idx').on(t.salonId),
    uniqueIndex('tax_rate_salon_name_key').on(t.salonId, t.name),
  ],
);

export const branchHoursRelations = relations(branchHours, ({ one }) => ({
  branch: one(branches, {
    fields: [branchHours.branchId],
    references: [branches.id],
  }),
}));

export const branchClosureRelations = relations(branchClosures, ({ one }) => ({
  branch: one(branches, {
    fields: [branchClosures.branchId],
    references: [branches.id],
  }),
}));

export const taxRateRelations = relations(taxRates, ({ one }) => ({
  salon: one(salonOrganizations, {
    fields: [taxRates.salonId],
    references: [salonOrganizations.id],
  }),
}));
