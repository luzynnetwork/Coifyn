import { relations } from 'drizzle-orm';
import { index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { baseColumns, tenantColumns } from './_helpers.js';
import { roles } from './rbac.js';

/**
 * A pending invitation for someone to join the salon's staff. `token` is the
 * single-use secret the accept-flow link carries; `branchIds` is a jsonb array
 * rather than a join table since it is small and only ever read/written whole,
 * the same tradeoff `specialties` makes on StylistProfile.
 */
export const staffInvites = pgTable(
  'staff_invite',
  {
    ...baseColumns,
    ...tenantColumns,
    email: text('email').notNull(),
    roleId: uuid('role_id').notNull(),
    branchIds: jsonb('branch_ids').notNull().default([]), // string[]
    token: text('token').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    status: text('status').notNull().default('pending'), // pending | accepted | revoked | expired
  },
  (t) => [
    index('staff_invite_salon_idx').on(t.salonId),
    uniqueIndex('staff_invite_token_key').on(t.token),
  ],
);

export const staffInviteRelations = relations(staffInvites, ({ one }) => ({
  role: one(roles, { fields: [staffInvites.roleId], references: [roles.id] }),
}));
