import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { baseColumns, tenantColumns } from './_helpers.js';

export const customerPreferences = pgTable(
  'customer_preference',
  {
    ...baseColumns,
    ...tenantColumns,
    customerId: uuid('customer_id').notNull(),
    preferredStylistId: uuid('preferred_stylist_id'),
    preferredChairId: uuid('preferred_chair_id'),
    drink: text('drink'),
    conversationLevel: text('conversation_level'), // chatty | some | quiet
    communicationChannel: text('communication_channel'), // sms | email | whatsapp
  },
  (t) => [uniqueIndex('customer_preference_customer_key').on(t.customerId)],
);

export const customerTags = pgTable(
  'customer_tag',
  {
    ...baseColumns,
    ...tenantColumns,
    customerId: uuid('customer_id').notNull(),
    tag: text('tag').notNull(),
  },
  (t) => [uniqueIndex('customer_tag_key').on(t.customerId, t.tag)],
);

/** Private staff notes. */
export const customerNotes = pgTable(
  'customer_note',
  {
    ...baseColumns,
    ...tenantColumns,
    customerId: uuid('customer_id').notNull(),
    authorId: uuid('author_id').notNull(),
    body: text('body').notNull(),
  },
  (t) => [index('customer_note_customer_idx').on(t.customerId)],
);

/** channel: sms | email | whatsapp. purpose: transactional | marketing.
 *  status: granted | revoked */
export const communicationConsents = pgTable(
  'communication_consent',
  {
    ...baseColumns,
    ...tenantColumns,
    customerId: uuid('customer_id').notNull(),
    channel: text('channel').notNull(),
    purpose: text('purpose').notNull(),
    status: text('status').notNull(),
    at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('communication_consent_key').on(
      t.customerId,
      t.channel,
      t.purpose,
    ),
  ],
);
