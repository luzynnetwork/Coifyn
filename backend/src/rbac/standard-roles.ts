import type { PermissionKey } from './permission-catalog.js';

/**
 * The four roles every salon is seeded with. Owner is implicit-everything and is
 * not listed here (authorize() short-circuits for it). A salon can add its own
 * roles on top ("Senior Stylist", "Shift Lead", …) from the same catalog.
 *
 * Each entry is a permission key mapped to the scope it is granted at:
 *   'org'    — salon-wide
 *   'branch' — only the branches the member belongs to (scopable keys only)
 */
export type GrantScope = 'org' | 'branch';

export interface StandardRoleDef {
  name: string;
  grants: Partial<Record<PermissionKey, GrantScope>>;
}

export const STANDARD_ROLES: readonly StandardRoleDef[] = [
  {
    name: 'Manager',
    grants: {
      'salon:update': 'org',
      'branch:create': 'org',
      'branch:update': 'branch',
      'chair:manage': 'branch',
      'service:view': 'org',
      'service:manage': 'org',
      'stylist:view': 'org',
      'stylist:manage': 'org',
      'stylist:status': 'branch',
      'staff:invite': 'branch',
      'queue:view': 'branch',
      'queue:manage': 'branch',
      'appointment:view': 'branch',
      'appointment:manage': 'branch',
      'appointment:override': 'branch',
      'pos:operate': 'branch',
      'pos:discount': 'branch',
      'pos:void': 'branch',
      'payment:take': 'branch',
      'payment:refund': 'branch',
      'customer:view': 'org',
      'customer:manage': 'org',
      'report:view': 'branch',
    },
  },
  {
    name: 'Front Desk',
    grants: {
      'service:view': 'branch',
      'stylist:view': 'branch',
      'queue:view': 'branch',
      'queue:manage': 'branch',
      'appointment:view': 'branch',
      'appointment:manage': 'branch',
      'pos:operate': 'branch',
      'payment:take': 'branch',
      'customer:view': 'branch',
      'customer:manage': 'branch',
    },
  },
  {
    name: 'Stylist',
    grants: {
      'service:view': 'branch',
      'stylist:view': 'branch',
      'stylist:status': 'branch',
      'queue:view': 'branch',
      'queue:manage': 'branch',
      'appointment:view': 'branch',
      'appointment:manage': 'branch',
      'customer:view': 'branch',
      'pos:operate': 'branch',
    },
  },
] as const;

export const OWNER_ROLE_NAME = 'Owner';
export const STANDARD_ROLE_NAMES: readonly string[] = [
  OWNER_ROLE_NAME,
  ...STANDARD_ROLES.map((r) => r.name),
];
