/**
 * The fixed permission catalog — the single source of truth for what a role can
 * be granted. Seeded into the `permission` table on boot (bootstrap.ts); salons
 * never edit it, they only compose roles from it.
 *
 * `scopable: true` means a grant of this permission can be org-wide OR narrowed
 * to the branches the role-holder belongs to. Scope is a property of the grant,
 * not of the permission (architecture.md §7).
 *
 * Phase 1 covers salon setup, services, stylists, staff, roles, queue,
 * appointments, POS, payments, customers and reports. Later phases add their own
 * keys to this list.
 */
export interface PermissionDef {
  key: string;
  resource: string;
  action: string;
  description: string;
  scopable: boolean;
}

function def(
  key: string,
  description: string,
  scopable = false,
): PermissionDef {
  const [resource, action] = key.split(':');
  return { key, resource, action, description, scopable };
}

export const PERMISSION_CATALOG: readonly PermissionDef[] = [
  // Salon & locations
  def('salon:update', 'Edit salon brand, tax profile and settings'),
  def('branch:create', 'Add a branch'),
  def('branch:update', 'Edit a branch, its hours and closures', true),
  def('branch:delete', 'Remove a branch'),
  def('chair:manage', 'Add, edit and retire chairs', true),

  // Service menu
  def('service:view', 'View the service menu', true),
  def('service:manage', 'Create, edit, price and deactivate services'),

  // Stylists
  def('stylist:view', 'View stylist profiles and schedules', true),
  def('stylist:manage', 'Create and edit stylist profiles and their services'),
  def('stylist:status', 'Change a stylist live status / clock in-out', true),

  // Staff & roles
  def('staff:invite', 'Invite staff and manage their branches', true),
  def('staff:manage', 'Change staff roles and deactivate staff'),
  def('role:create', 'Create a custom role'),
  def('role:update', 'Edit a custom role'),
  def('role:delete', 'Delete a custom role'),
  def('role:assign', 'Assign a role to a member'),

  // Walk-in queue
  def('queue:view', 'View the walk-in queue', true),
  def('queue:manage', 'Join, assign, start and complete queue entries', true),

  // Appointments
  def('appointment:view', 'View appointments and the front-desk board', true),
  def('appointment:manage', 'Create, edit, move and cancel appointments', true),
  def('appointment:override', 'Override a booking conflict (with a reason)', true),

  // POS
  def('pos:operate', 'Open a register, build and settle tickets', true),
  def('pos:discount', 'Apply a discount to a ticket', true),
  def('pos:void', 'Void a ticket', true),

  // Payments
  def('payment:take', 'Take a payment against a ticket', true),
  def('payment:refund', 'Issue a refund', true),

  // Customers
  def('customer:view', 'View customer records', true),
  def('customer:manage', 'Create and edit customer records', true),

  // Reporting & audit
  def('report:view', 'View salon reports', true),
  def('auditlog:view', 'View the salon audit log'),
] as const;

export type PermissionKey = (typeof PERMISSION_CATALOG)[number]['key'];

const KEY_SET = new Set(PERMISSION_CATALOG.map((p) => p.key));

export function isPermissionKey(value: string): value is PermissionKey {
  return KEY_SET.has(value);
}

export function isScopable(key: string): boolean {
  return PERMISSION_CATALOG.find((p) => p.key === key)?.scopable ?? false;
}
