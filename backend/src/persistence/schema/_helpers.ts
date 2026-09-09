import { sql } from 'drizzle-orm';
import { pgSchema, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Shared column building blocks. Every table spreads {@link baseColumns};
 * tenant-scoped tables also spread {@link tenantColumns} (salon) and, where the
 * row belongs to a location, {@link branchColumn}.
 *
 * `id` is uuid v7 — time-ordered, so it doubles as a natural insert-order key.
 * It is generated in the app (uuidv7()) rather than the DB so the value is known
 * before the INSERT (needed for the outbox event that commits alongside it).
 */
export const baseColumns = {
  id: uuid('id').primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
};

/** Spread onto every salon-scoped table. The RLS policy and the cache-key
 *  prefix both key on `salon_id` (architecture.md §6, §8). */
export const tenantColumns = {
  salonId: uuid('salon_id').notNull(),
};

/** Spread onto tables whose row belongs to a specific branch. */
export const branchColumn = {
  branchId: uuid('branch_id'),
};

/** The Postgres session GUCs the per-request transaction sets with SET LOCAL.
 *  RLS policies read these; a query outside any tenant scope sees no rows. */
export const CURRENT_USER_GUC = 'app.user_id';
export const CURRENT_SALON_GUC = 'app.salon_id';
export const SYSTEM_GUC = 'app.system';

/** `current_setting(name, true)` — the `true` makes it return NULL instead of
 *  erroring when the GUC was never set on this connection. */
export const currentSetting = (name: string) =>
  sql`current_setting(${name}, true)`;

/** Reserved for future per-region schema splits; unused in Phase 0. */
export const appSchema = pgSchema('app');
