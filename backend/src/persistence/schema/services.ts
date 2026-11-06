import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { baseColumns, tenantColumns } from './_helpers.js';
import { taxRates } from './salon-setup.js';

/**
 * The service menu (Phase 1 `services` module). `basePriceMinor` is always an
 * integer in the salon's minor currency unit — never a float (architecture.md
 * §8). A stylist may override price/duration per-service; that override lives
 * on `StylistService` in the `stylists` module, not here.
 */
export const serviceCategories = pgTable(
  'service_category',
  {
    ...baseColumns,
    ...tenantColumns,
    name: text('name').notNull(),
    order: integer('order').notNull().default(0),
  },
  (t) => [
    index('service_category_salon_idx').on(t.salonId),
    uniqueIndex('service_category_salon_name_key').on(t.salonId, t.name),
  ],
);

export const services = pgTable(
  'service',
  {
    ...baseColumns,
    ...tenantColumns,
    categoryId: uuid('category_id'),
    name: text('name').notNull(),
    description: text('description'),
    basePriceMinor: integer('base_price_minor').notNull(),
    baseDurationMin: integer('base_duration_min').notNull(),
    taxRateId: uuid('tax_rate_id'),
    isBookable: boolean('is_bookable').notNull().default(true),
    isActive: boolean('is_active').notNull().default(true),
  },
  (t) => [
    index('service_salon_idx').on(t.salonId),
    index('service_category_idx').on(t.categoryId),
  ],
);

export const serviceAddOns = pgTable(
  'service_add_on',
  {
    ...baseColumns,
    ...tenantColumns,
    name: text('name').notNull(),
    priceMinor: integer('price_minor').notNull(),
    durationMin: integer('duration_min').notNull(),
    isActive: boolean('is_active').notNull().default(true),
  },
  (t) => [index('service_add_on_salon_idx').on(t.salonId)],
);

/** Join table: which add-ons a service offers. */
export const serviceAddOnLinks = pgTable(
  'service_add_on_link',
  {
    ...baseColumns,
    ...tenantColumns,
    serviceId: uuid('service_id').notNull(),
    addOnId: uuid('add_on_id').notNull(),
  },
  (t) => [
    uniqueIndex('service_add_on_link_key').on(t.serviceId, t.addOnId),
    index('service_add_on_link_service_idx').on(t.serviceId),
    index('service_add_on_link_add_on_idx').on(t.addOnId),
  ],
);

export const serviceCategoryRelations = relations(
  serviceCategories,
  ({ many }) => ({ services: many(services) }),
);

export const serviceRelations = relations(services, ({ one, many }) => ({
  category: one(serviceCategories, {
    fields: [services.categoryId],
    references: [serviceCategories.id],
  }),
  taxRate: one(taxRates, {
    fields: [services.taxRateId],
    references: [taxRates.id],
  }),
  addOnLinks: many(serviceAddOnLinks),
}));

export const serviceAddOnRelations = relations(serviceAddOns, ({ many }) => ({
  serviceLinks: many(serviceAddOnLinks),
}));

export const serviceAddOnLinkRelations = relations(
  serviceAddOnLinks,
  ({ one }) => ({
    service: one(services, {
      fields: [serviceAddOnLinks.serviceId],
      references: [services.id],
    }),
    addOn: one(serviceAddOns, {
      fields: [serviceAddOnLinks.addOnId],
      references: [serviceAddOns.id],
    }),
  }),
);
