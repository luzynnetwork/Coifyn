import { randomUUID } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

/**
 * Vitest global setup for the e2e suite. Against a superuser Postgres
 * (E2E_SUPERUSER_URL, default a local instance) it: creates a throwaway
 * database, runs the full migration set (schema + RLS + triggers), and creates a
 * NON-superuser login role for the app to connect as — so Row-Level Security is
 * actually exercised. Exports for the specs:
 *   DATABASE_URL   → app connects as the restricted role
 *   E2E_ADMIN_URL  → superuser on the test db (truncation / direct seeding)
 * Teardown drops the database and role.
 *
 * Local:  a Postgres 16+ reachable as a superuser. Point E2E_SUPERUSER_URL at it.
 * CI:     a `postgres` service container; E2E_SUPERUSER_URL=postgres://postgres:postgres@localhost:5432/postgres
 */
const SUPERUSER =
  process.env.E2E_SUPERUSER_URL ??
  'postgresql://postgres:postgres@localhost:5432/postgres';

const DB_NAME = `coifyn_e2e_${Date.now().toString(36)}`;
const APP_ROLE = `${DB_NAME}_app`;
// scram-sha-256 (the default auth method once POSTGRES_PASSWORD is set, both
// locally and in the CI service container) rejects a passwordless role.
const APP_ROLE_PASSWORD = randomUUID();

export async function setup() {
  let root: postgres.Sql;
  try {
    root = postgres(SUPERUSER, { max: 1 });
    await root`select 1`;
  } catch (err) {
    throw new Error(
      `e2e: cannot reach a superuser Postgres at ${redact(SUPERUSER)} — ` +
        `set E2E_SUPERUSER_URL. (${(err as Error).message})`,
    );
  }

  await root.unsafe(`CREATE DATABASE ${DB_NAME}`);
  const superOnDb = replaceDb(SUPERUSER, DB_NAME);

  const admin = postgres(superOnDb, { max: 1, onnotice: () => {} });
  await migrate(drizzle(admin), { migrationsFolder: './drizzle' });
  const manualDir = join(process.cwd(), 'drizzle', 'manual');
  for (const file of (await readdir(manualDir))
    .filter((f) => f.endsWith('.sql'))
    .sort()) {
    await admin.unsafe(await readFile(join(manualDir, file), 'utf8'));
  }
  await admin.unsafe(
    `CREATE ROLE "${APP_ROLE}" LOGIN PASSWORD '${APP_ROLE_PASSWORD}'`,
  );
  await admin.unsafe(`GRANT coifyn_app TO "${APP_ROLE}"`);
  await admin.end();
  await root.end();

  process.env.DATABASE_URL = appUrl(DB_NAME, APP_ROLE, APP_ROLE_PASSWORD);
  process.env.DB_IAM_AUTH = 'false';
  process.env.E2E_ADMIN_URL = superOnDb;
  process.env.NODE_ENV = 'test';
  process.env.EVENTS_RELAY = 'off';
  process.env.JWT_ACCESS_SECRET ??= 'e2e-access-secret-0123456789abcdefghij0';
  process.env.JWT_REFRESH_SECRET ??= 'e2e-refresh-secret-0123456789abcdefghij';
  process.env.LOG_LEVEL = 'error';

  return async function teardown() {
    const cleanup = postgres(SUPERUSER, { max: 1, onnotice: () => {} });
    await cleanup.unsafe(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}'`,
    );
    await cleanup.unsafe(`DROP DATABASE IF EXISTS ${DB_NAME}`);
    await cleanup.unsafe(`DROP ROLE IF EXISTS "${APP_ROLE}"`);
    await cleanup.end();
  };
}

function appUrl(db: string, role: string, password: string): string {
  const u = new URL(replaceDb(SUPERUSER, db));
  u.username = role;
  u.password = password;
  return u.toString();
}
function replaceDb(url: string, db: string): string {
  const u = new URL(url);
  u.pathname = `/${db}`;
  return u.toString();
}
function redact(url: string): string {
  try {
    const u = new URL(url);
    if (u.password) u.password = '***';
    return u.toString();
  } catch {
    return url;
  }
}
