import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { baseColumns, tenantColumns } from './_helpers.js';

/**
 * A salon's CRM record of a client (Phase 1 `customers` module). Distinct from
 * the Phase 0 `customer` table, which is a login identity for the customer app:
 * a salon_customer can exist without ever having an account. Money is integer
 * minor units.
 */
export const salonCustomers = pgTable(
  'salon_customer',
  {
    ...baseColumns,
    ...tenantColumns,
    name: text('name').notNull(),
    phone: text('phone').notNull(),
    email: text('email'),
    notes: text('notes'),
    firstSeenAt: timestamp('first_seen_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastVisitAt: timestamp('last_visit_at', { withTimezone: true }),
    visitCount: integer('visit_count').notNull().default(0),
    totalSpendMinor: integer('total_spend_minor').notNull().default(0),
  },
  (t) => [
    index('salon_customer_salon_idx').on(t.salonId),
    uniqueIndex('salon_customer_salon_phone_key').on(t.salonId, t.phone),
  ],
);
