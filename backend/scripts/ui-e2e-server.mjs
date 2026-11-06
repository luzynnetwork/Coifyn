/**
 * Boots the real, compiled API against a throwaway database for the browser
 * (Playwright) end-to-end tests. Mirrors test/support/global-setup.ts: the app
 * connects as a NON-superuser role that has only the coifyn_app grants, so
 * Row-Level Security is genuinely enforced during the UI journey.
 *
 *   npm run build && node scripts/ui-e2e-server.mjs
 *
 * E2E_SUPERUSER_URL must point at a Postgres 16+ superuser (default: the
 * docker-compose database). The database is dropped and recreated on every
 * start so each run begins empty.
 */
import { randomUUID } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const SUPERUSER =
  process.env.E2E_SUPERUSER_URL ??
  'postgresql://coifyn:coifyn@localhost:5432/postgres';
const DB_NAME = 'coifyn_ui_e2e';
const APP_ROLE = 'coifyn_ui_e2e_app';
const APP_PASSWORD = randomUUID();

function withDb(url, db) {
  const u = new URL(url);
  u.pathname = `/${db}`;
  return u;
}

const root = postgres(SUPERUSER, { max: 1, onnotice: () => {} });
await root.unsafe(
  `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}'`,
);
await root.unsafe(`DROP DATABASE IF EXISTS ${DB_NAME}`);
await root.unsafe(`DROP ROLE IF EXISTS "${APP_ROLE}"`);
await root.unsafe(`CREATE DATABASE ${DB_NAME}`);
await root.end();

const admin = postgres(withDb(SUPERUSER, DB_NAME).toString(), {
  max: 1,
  onnotice: () => {},
});
await migrate(drizzle(admin), { migrationsFolder: './drizzle' });
const manualDir = join(process.cwd(), 'drizzle', 'manual');
for (const file of (await readdir(manualDir)).filter((f) => f.endsWith('.sql')).sort()) {
  await admin.unsafe(await readFile(join(manualDir, file), 'utf8'));
}
await admin.unsafe(`CREATE ROLE "${APP_ROLE}" LOGIN PASSWORD '${APP_PASSWORD}'`);
await admin.unsafe(`GRANT coifyn_app TO "${APP_ROLE}"`);
await admin.end();

const appUrl = withDb(SUPERUSER, DB_NAME);
appUrl.username = APP_ROLE;
appUrl.password = APP_PASSWORD;

process.env.DATABASE_URL = appUrl.toString();
process.env.DB_IAM_AUTH = 'false';
process.env.NODE_ENV = 'test';
process.env.EVENTS_RELAY = 'off';
process.env.PORT = process.env.PORT ?? '4000';
process.env.LOG_LEVEL = 'warn';
process.env.JWT_ACCESS_SECRET ??= 'ui-e2e-access-secret-0123456789abcdefghij';
process.env.JWT_REFRESH_SECRET ??= 'ui-e2e-refresh-secret-0123456789abcdefghij';
delete process.env.REDIS_URL;

await import('../dist/main.js');
