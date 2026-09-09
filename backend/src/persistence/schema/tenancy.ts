import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { baseColumns, tenantColumns } from './_helpers.js';

/**
 * The client business. A single-shop salon and a 40-branch chain use the same
 * row shape; "chain" is a count of branches, not a different model.
 */
export const salonOrganizations = pgTable(
  'salon_organization',
  {
    ...baseColumns,
    slug: text('slug').notNull(),
    legalName: text('legal_name').notNull(),
    brandName: text('brand_name').notNull(),
    currency: text('currency').notNull().default('USD'),
    timezone: text('timezone').notNull().default('UTC'),
    taxProfile: jsonb('tax_profile').notNull().default({}),
    status: text('status').notNull().default('active'), // active | suspended | archived
  },
  (t) => [uniqueIndex('salon_organization_slug_key').on(t.slug)],
);

/** A physical location of a salon. */
export const branches = pgTable(
  'branch',
  {
    ...baseColumns,
    ...tenantColumns,
    name: text('name').notNull(),
    address: jsonb('address').notNull().default({}),
    hours: jsonb('hours').notNull().default({}),
    isActive: boolean('is_active').notNull().default(true),
  },
  (t) => [index('branch_salon_idx').on(t.salonId)],
);

/** A schedulable station within a branch. */
export const chairs = pgTable(
  'chair',
  {
    ...baseColumns,
    ...tenantColumns,
    branchId: uuid('branch_id').notNull(),
    label: text('label').notNull(),
    isActive: boolean('is_active').notNull().default(true),
  },
  (t) => [
    index('chair_branch_idx').on(t.branchId),
    uniqueIndex('chair_branch_label_key').on(t.branchId, t.label),
  ],
);

export const salonRelations = relations(salonOrganizations, ({ many }) => ({
  branches: many(branches),
}));

export const branchRelations = relations(branches, ({ one, many }) => ({
  salon: one(salonOrganizations, {
    fields: [branches.salonId],
    references: [salonOrganizations.id],
  }),
  chairs: many(chairs),
}));

export const chairRelations = relations(chairs, ({ one }) => ({
  branch: one(branches, {
    fields: [chairs.branchId],
    references: [branches.id],
  }),
}));
