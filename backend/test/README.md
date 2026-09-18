# Backend tests

## Unit — `npm test`

Vitest against `src/**/*.spec.ts`. No database. Pure logic (password/token services,
`authorize()` matrix, event registry guard, relay tick, problem+json mapping,
idempotency store, …).

## E2E — `npm run test:e2e`

Boots the real Nest app (same pipeline as `main.ts`) with supertest against a real
Postgres, exercising onboarding → RBAC → tenancy → tenant isolation (RLS) → idempotency
→ audit.

**Requires a superuser Postgres 16+.** Point `E2E_SUPERUSER_URL` at it:

```bash
E2E_SUPERUSER_URL='postgresql://postgres:postgres@localhost:5432/postgres' npm run test:e2e
```

`test/support/global-setup.ts` creates a throwaway database per run, applies every
migration (schema + `drizzle/manual/*.sql`), and creates a **non-superuser** login role
for the app — so Row-Level Security is genuinely enforced in the isolation test — then
drops it all on teardown.

The SWC transform (`vitest.config.e2e.ts`) is required: NestJS DI needs
`design:paramtypes` decorator metadata, which vitest's default esbuild transform does not
emit.

### CI

Run against a `postgres` service container with
`E2E_SUPERUSER_URL=postgres://postgres:postgres@localhost:5432/postgres`.
