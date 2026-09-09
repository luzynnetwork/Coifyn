import 'dotenv/config';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { resolveConnection } from './connection.js';

/**
 * `npm run db:migrate`. Two steps, in order:
 *   1. drizzle-kit's journal-tracked migrations in ./drizzle
 *   2. the hand-written policy/trigger SQL in ./drizzle/manual (idempotent —
 *      guarded with IF NOT EXISTS / CREATE OR REPLACE)
 *
 * Runs as whatever identity the env points at (DATABASE_URL or RDS IAM). That
 * must be an OWNING role — creating roles and policies needs ownership.
 */
async function main() {
  const conn = await resolveConnection(process.env, { max: 1 });
  const sql = conn.url ? postgres(conn.url, conn.options) : postgres(conn.options);
  const db = drizzle(sql);

  console.log('→ applying generated migrations');
  await migrate(db, { migrationsFolder: './drizzle' });

  const manualDir = join(process.cwd(), 'drizzle', 'manual');
  const files = (await readdir(manualDir).catch(() => []))
    .filter((f) => f.endsWith('.sql'))
    .sort();
  for (const file of files) {
    console.log(`→ applying manual/${file}`);
    await sql.unsafe(await readFile(join(manualDir, file), 'utf8'));
  }

  await sql.end();
  console.log('✓ migrations complete');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
