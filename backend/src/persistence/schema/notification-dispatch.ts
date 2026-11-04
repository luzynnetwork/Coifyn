import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { baseColumns, tenantColumns } from './_helpers.js';

/** A salon's override of a catalog template. Versioned: highest `version` wins. */
export const notificationTemplates = pgTable(
  'notification_template',
  {
    ...baseColumns,
    ...tenantColumns,
    key: text('key').notNull(),
    channel: text('channel').notNull(),
    version: integer('version').notNull().default(1),
    body: text('body').notNull(),
    variables: jsonb('variables').notNull().default([]),
  },
  (t) => [
    uniqueIndex('notification_template_key').on(
      t.salonId,
      t.key,
      t.channel,
      t.version,
    ),
  ],
);

/** status: sent | failed | skipped */
export const notificationDeliveries = pgTable(
  'notification_delivery',
  {
    ...baseColumns,
    ...tenantColumns,
    templateKey: text('template_key').notNull(),
    channel: text('channel').notNull(),
    recipient: text('recipient').notNull(),
    customerId: uuid('customer_id'),
    status: text('status').notNull(),
    failureReason: text('failure_reason'),
    body: text('body').notNull(),
    /** e.g. "appointment.reminder_24h:<appointmentId>" — a repeat is dropped. */
    dedupeKey: text('dedupe_key'),
  },
  (t) => [
    index('notification_delivery_salon_created_idx').on(t.salonId, t.createdAt),
    uniqueIndex('notification_delivery_dedupe_key').on(t.salonId, t.dedupeKey),
  ],
);
