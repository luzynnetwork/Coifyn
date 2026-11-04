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

export const loyaltyRules = pgTable(
  'loyalty_rule',
  {
    ...baseColumns,
    ...tenantColumns,
    /** Points earned per 100 minor units (one currency unit) spent. */
    pointsPerUnit: integer('points_per_unit').notNull().default(1),
    /** [{ name, minPoints }] ascending. */
    tiers: jsonb('tiers').notNull().default([]),
    expiryDays: integer('expiry_days'),
  },
  (t) => [uniqueIndex('loyalty_rule_salon_key').on(t.salonId)],
);

export const loyaltyAccounts = pgTable(
  'loyalty_account',
  {
    ...baseColumns,
    ...tenantColumns,
    customerId: uuid('customer_id').notNull(),
    pointsBalance: integer('points_balance').notNull().default(0),
    tier: text('tier'),
  },
  (t) => [uniqueIndex('loyalty_account_customer_key').on(t.customerId)],
);

/** Immutable. kind: earn | redeem | adjust | expire. `delta` is signed. */
export const loyaltyLedger = pgTable(
  'loyalty_ledger',
  {
    ...baseColumns,
    ...tenantColumns,
    customerId: uuid('customer_id').notNull(),
    kind: text('kind').notNull(),
    delta: integer('delta').notNull(),
    source: text('source').notNull(),
    sourceId: uuid('source_id'),
    reason: text('reason'),
    createdBy: uuid('created_by'),
  },
  (t) => [
    index('loyalty_ledger_customer_idx').on(t.customerId, t.createdAt),
    // one earn per payment — accrual is idempotent (NULL source ids never collide)
    uniqueIndex('loyalty_ledger_kind_source_key').on(t.kind, t.sourceId),
  ],
);
