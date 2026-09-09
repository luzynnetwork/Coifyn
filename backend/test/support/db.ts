import postgres from 'postgres';

/** Superuser connection to the e2e database — for truncation and direct seeding
 *  that bypasses the API (e.g. adding a second staff member before the invite
 *  flow exists). */
export function adminSql() {
  return postgres(process.env.E2E_ADMIN_URL as string, { max: 1 });
}

const TENANT_TABLES = [
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
