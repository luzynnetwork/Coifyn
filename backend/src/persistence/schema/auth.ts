import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { baseColumns } from './_helpers.js';

/**
 * Staff identity. A salon client is a separate `customer` identity (its own
 * phase) and can never reach a staff endpoint.
 *
 * `user` carries no RLS policy: it is read by email before any identity exists
 * (login), so there is no tenant to key it on. It holds no cross-salon work data.
 */
export const users = pgTable(
  'user',
  {
    ...baseColumns,
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    displayName: text('display_name').notNull(),
    status: text('status').notNull().default('active'), // active | disabled
  },
  (t) => [uniqueIndex('user_email_key').on(t.email)],
);

/** Refresh-token sessions. Rotating: each refresh issues a new row and revokes
 *  the old one. Revocation is a row delete / `revokedAt`. */
export const sessions = pgTable(
  'session',
  {
    ...baseColumns,
    userId: uuid('user_id').notNull(),
    refreshTokenHash: text('refresh_token_hash').notNull(),
    userAgent: text('user_agent'),
    ip: text('ip'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (t) => [
    index('session_user_idx').on(t.userId),
    uniqueIndex('session_refresh_hash_key').on(t.refreshTokenHash),
  ],
);

/** Single-use, attempt-capped, HMAC-hashed password-reset codes. */
export const passwordResets = pgTable('password_reset', {
  ...baseColumns,
  userId: uuid('user_id').notNull(),
  codeHash: text('code_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  consumedAt: timestamp('consumed_at', { withTimezone: true }),
});
