import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { baseColumns } from './_helpers.js';

/**
 * A per-recipient notification row, fanned out over the realtime SSE bus on
 * insert (notifications/application/emit-notification.ts). A recipient is
 * either a staff user or a customer — exactly one of the two id columns is
 * set. `recipientCustomerId` logically points at `customer.id` (customer-auth
 * module, landing in parallel); it deliberately has no `.references()` FK
 * since that table may not exist yet when this migration runs — add the
 * constraint in a follow-up migration once customer-auth is merged.
 */
export const notifications = pgTable(
  'notification',
  {
    ...baseColumns,
    recipientUserId: uuid('recipient_user_id'),
    recipientCustomerId: uuid('recipient_customer_id'),
    type: text('type').notNull(),
    payload: jsonb('payload').notNull().default({}),
    readAt: timestamp('read_at', { withTimezone: true }),
  },
  (t) => [
    index('notification_recipient_user_idx').on(t.recipientUserId),
    index('notification_recipient_customer_idx').on(t.recipientCustomerId),
  ],
);
