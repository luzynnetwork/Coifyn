import {
  boolean,
  index,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { baseColumns, tenantColumns } from './_helpers.js';

/**
 * RBAC — permissions are data, not code (architecture.md §7).
 *
 *  - `permission`  : the fixed catalog, seeded on boot. Salons never edit it.
 *  - `role`        : salon-scoped. Standard roles (Owner/Manager/Front Desk/
 *                    Stylist) are seeded per salon; custom roles are salon-built.
 *  - `role_permission` : which catalog entries a role holds, at what scope.
 *  - `membership`      : User ↔ Salon ↔ one Role.
 *  - `branch_membership` : User ↔ Branch (many-to-many, no role) — the "own
 *    branch" scope a scopable grant narrows to.
 */
export const permissions = pgTable(
  'permission',
  {
    key: text('key').primaryKey(), // e.g. "booking:create"
    resource: text('resource').notNull(),
    action: text('action').notNull(),
    description: text('description').notNull(),
    scopable: boolean('scopable').notNull().default(false),
  },
);

export const roles = pgTable(
  'role',
  {
    ...baseColumns,
    ...tenantColumns,
    name: text('name').notNull(),
    isStandard: boolean('is_standard').notNull().default(false),
  },
  (t) => [uniqueIndex('role_salon_name_key').on(t.salonId, t.name)],
);

export const rolePermissions = pgTable(
  'role_permission',
  {
    ...baseColumns,
    ...tenantColumns,
    roleId: uuid('role_id').notNull(),
    permissionKey: text('permission_key').notNull(),
    scope: text('scope').notNull().default('org'), // org | branch
  },
  (t) => [
    uniqueIndex('role_permission_key').on(t.roleId, t.permissionKey),
    index('role_permission_role_idx').on(t.roleId),
  ],
);

export const memberships = pgTable(
  'membership',
  {
    ...baseColumns,
    ...tenantColumns,
    userId: uuid('user_id').notNull(),
    roleId: uuid('role_id').notNull(),
  },
  (t) => [
    uniqueIndex('membership_salon_user_key').on(t.salonId, t.userId),
    index('membership_user_idx').on(t.userId),
  ],
);

export const branchMemberships = pgTable(
  'branch_membership',
  {
    ...baseColumns,
    ...tenantColumns,
    userId: uuid('user_id').notNull(),
    branchId: uuid('branch_id').notNull(),
  },
  (t) => [
    uniqueIndex('branch_membership_key').on(t.branchId, t.userId),
    index('branch_membership_user_idx').on(t.userId),
  ],
);
