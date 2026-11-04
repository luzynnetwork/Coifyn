import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  uuid,
} from 'drizzle-orm/pg-core';
import { baseColumns, tenantColumns } from './_helpers.js';

export const cutRecords = pgTable(
  'cut_record',
  {
    ...baseColumns,
    ...tenantColumns,
    customerId: uuid('customer_id').notNull(),
    appointmentId: uuid('appointment_id'),
    ticketId: uuid('ticket_id'),
    stylistId: uuid('stylist_id').notNull(),
    serviceIds: jsonb('service_ids').notNull().default([]),
    clipperGuards: jsonb('clipper_guards').notNull().default({}),
    fadeType: text('fade_type'),
    partingNotes: text('parting_notes'),
    beardNotes: text('beard_notes'),
    productsUsed: jsonb('products_used').notNull().default([]),
    freeText: text('free_text'),
  },
  (t) => [index('cut_record_customer_idx').on(t.customerId, t.createdAt)],
);

/** angle: front | left | right | back */
export const cutRecordPhotos = pgTable(
  'cut_record_photo',
  {
    ...baseColumns,
    ...tenantColumns,
    cutRecordId: uuid('cut_record_id').notNull(),
    objectKey: text('object_key').notNull(),
    angle: text('angle').notNull().default('front'),
    isVerified: boolean('is_verified').notNull().default(false),
  },
  (t) => [index('cut_record_photo_record_idx').on(t.cutRecordId)],
);

/** kind: color | perm | treatment */
export const formulaEntries = pgTable(
  'formula_entry',
  {
    ...baseColumns,
    ...tenantColumns,
    customerId: uuid('customer_id').notNull(),
    stylistId: uuid('stylist_id'),
    kind: text('kind').notNull(),
    formula: text('formula').notNull(),
    developer: text('developer'),
    processingMin: integer('processing_min'),
    notes: text('notes'),
  },
  (t) => [index('formula_entry_customer_idx').on(t.customerId)],
);
