import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { baseColumns, tenantColumns } from './_helpers.js';
import { branches } from './tenancy.js';
import { services } from './services.js';

/** Live status a stylist can be in. Enum-as-text (not a pg enum) so a new
 *  status is a data change, not a migration — matches the rest of the schema's
 *  status columns (salon_organization.status, ticket.status, …). */
export const stylistProfiles = pgTable(
  'stylist_profile',
  {
    ...baseColumns,
    ...tenantColumns,
    userId: uuid('user_id').notNull(),
    branchId: uuid('branch_id').notNull(), // home branch
    displayName: text('display_name').notNull(),
    bio: text('bio'),
    avatarUrl: text('avatar_url'),
    specialties: jsonb('specialties').notNull().default([]), // string[]
    status: text('status').notNull().default('off_shift'),
    isBookable: boolean('is_bookable').notNull().default(true),
    startedAt: timestamp('started_at', { withTimezone: true }),
  },
  (t) => [
    index('stylist_profile_salon_idx').on(t.salonId),
    index('stylist_profile_branch_idx').on(t.branchId),
    uniqueIndex('stylist_profile_salon_user_key').on(t.salonId, t.userId),
  ],
);

/** Per-stylist pricing/duration override and whether they can perform a
 *  service at all. Absent row = falls back to the Service's base values. */
export const stylistServices = pgTable(
  'stylist_service',
  {
    ...baseColumns,
    ...tenantColumns,
    stylistId: uuid('stylist_id').notNull(),
    serviceId: uuid('service_id').notNull(),
    priceOverrideMinor: integer('price_override_minor'),
    durationOverrideMin: integer('duration_override_min'),
    canPerform: boolean('can_perform').notNull().default(true),
  },
  (t) => [
    uniqueIndex('stylist_service_key').on(t.stylistId, t.serviceId),
    index('stylist_service_stylist_idx').on(t.stylistId),
    index('stylist_service_service_idx').on(t.serviceId),
  ],
);

/** Immutable, insert-only audit trail of live status changes — no update or
 *  delete methods on its repo, by design. */
export const stylistStatusHistory = pgTable(
  'stylist_status_history',
  {
    ...baseColumns,
    ...tenantColumns,
    stylistId: uuid('stylist_id').notNull(),
    status: text('status').notNull(),
    reason: text('reason'),
    changedBy: uuid('changed_by').notNull(),
    at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('stylist_status_history_stylist_idx').on(t.stylistId)],
);

export const stylistProfileRelations = relations(
  stylistProfiles,
  ({ one, many }) => ({
    branch: one(branches, {
      fields: [stylistProfiles.branchId],
      references: [branches.id],
    }),
    services: many(stylistServices),
    statusHistory: many(stylistStatusHistory),
  }),
);

export const stylistServiceRelations = relations(stylistServices, ({ one }) => ({
  stylist: one(stylistProfiles, {
    fields: [stylistServices.stylistId],
    references: [stylistProfiles.id],
  }),
  service: one(services, {
    fields: [stylistServices.serviceId],
    references: [services.id],
  }),
}));

export const stylistStatusHistoryRelations = relations(
  stylistStatusHistory,
  ({ one }) => ({
    stylist: one(stylistProfiles, {
      fields: [stylistStatusHistory.stylistId],
      references: [stylistProfiles.id],
    }),
  }),
);
