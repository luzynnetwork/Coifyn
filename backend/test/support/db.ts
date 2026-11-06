import postgres from 'postgres';

/** Superuser connection to the e2e database — for truncation and direct seeding
 *  that bypasses the API (e.g. adding a second staff member before the invite
 *  flow exists). */
export function adminSql() {
  return postgres(process.env.E2E_ADMIN_URL as string, { max: 1 });
}

const TENANT_TABLES = [
  // Phase 1 tables carry no foreign keys, so CASCADE would not reach them.
  'branch_hours',
  'branch_closure',
  'tax_rate',
  'service_category',
  'service',
  'service_add_on',
  'service_add_on_link',
  'stylist_profile',
  'stylist_service',
  'stylist_status_history',
  'staff_invite',
  'salon_customer',
  'queue_entry',
  'appointment',
  'register_session',
  'ticket',
  'ticket_line',
  'ticket_discount',
  'payment',
  'refund',
  'receipt',
  // Phase 2
  'stylist_shift',
  'shift_template',
  'stylist_time_off',
  'booking_hold',
  'appointment_reschedule',
  'booking_request',
  'disruption',
  'disruption_offer',
  'cut_record',
  'cut_record_photo',
  'formula_entry',
  'customer_preference',
  'customer_tag',
  'customer_note',
  'communication_consent',
  'loyalty_rule',
  'loyalty_account',
  'loyalty_ledger',
  'notification_template',
  'notification_delivery',
  'audit_event',
  'domain_event',
  'branch_membership',
  'membership',
  'role_permission',
  'role',
  'chair',
  'branch',
  'salon_organization',
  'password_reset',
  'session',
  '"user"',
];

/** Wipe all rows between tests. Runs as superuser so RLS does not hide anything. */
export async function truncateAll(): Promise<void> {
  const sql = adminSql();
  try {
    await sql.unsafe(
      `TRUNCATE ${TENANT_TABLES.join(', ')} RESTART IDENTITY CASCADE`,
    );
  } finally {
    await sql.end();
  }
}
