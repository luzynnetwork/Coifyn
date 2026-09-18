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
 * Salon-client identity. Deliberately separate from `user` (staff, auth.ts) — a
 * customer can never authenticate a staff endpoint, and vice versa. Signed in
 * with email OR phone + password.
 *
 * No RLS policy, same reasoning as `user`: read by email/phone before any
 * identity exists (login), and it holds no cross-salon work data.
 */
export const customers = pgTable(
  'customer',
  {
    ...baseColumns,
    email: text('email'),
    phone: text('phone'),
    passwordHash: text('password_hash').notNull(),
    displayName: text('display_name').notNull(),
    status: text('status').notNull().default('active'), // active | disabled
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('customer_email_key').on(t.email),
    uniqueIndex('customer_phone_key').on(t.phone),
  ],
);

/** Refresh-token sessions for the customer portal. Same rotating shape as
 *  `session` (auth.ts). */
export const customerSessions = pgTable(
  'customer_session',
  {
    ...baseColumns,
    customerId: uuid('customer_id').notNull(),
    refreshTokenHash: text('refresh_token_hash').notNull(),
    userAgent: text('user_agent'),
    ip: text('ip'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (t) => [
    index('customer_session_customer_idx').on(t.customerId),
    uniqueIndex('customer_session_refresh_hash_key').on(t.refreshTokenHash),
  ],
);

/**
 * Single-use, attempt-capped, HMAC-hashed codes for BOTH registration OTP
 * verification and password reset — `purpose` distinguishes them so the two
 * flows can't consume each other's codes.
 */
export const customerVerifications = pgTable('customer_verification', {
  ...baseColumns,
  customerId: uuid('customer_id').notNull(),
  purpose: text('purpose').notNull(), // 'verify_account' | 'password_reset'
  codeHash: text('code_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  consumedAt: timestamp('consumed_at', { withTimezone: true }),
});
