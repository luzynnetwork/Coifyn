import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

/**
 * Migrations are forward-only and reviewed (architecture.md §8). Workflow:
 *   npm run db:generate   → review the SQL in drizzle/
 *   npm run db:migrate    → apply (CI and deploy run this)
 */
export default defineConfig({
  schema: './src/persistence/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
  casing: 'snake_case',
  verbose: true,
  strict: true,
});
