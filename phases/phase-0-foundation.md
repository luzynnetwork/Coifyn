# Phase 0 — Foundation sprint

## Overview

**What this phase is for.** Everything that must exist *before* any product feature is
written — the skeleton every later phase stands on. No stylist, no booking, no POS here:
just the monorepo, the NestJS modular-monolith shell, the database with tenant isolation,
auth for both staff and customers, the RBAC engine, the event outbox, the real-time
transport, and the CI/CD pipeline.

**Depends on.** Nothing. This is the first work.

**Leaves out.** All product features. The four Next.js apps are scaffolded and wired to
the API client, but each renders only a login screen and an empty shell.

**Done when.** A developer can run the whole stack with one command, register/log in as
a salon owner, have their JWT resolve a tenant that scopes a trivial query via RLS, see a
row's creation write a `domain_event` that a BullMQ worker logs and an SSE client
receives, and `git push` runs CI against real Postgres/Redis and deploys to staging.

---

## 0.1 Repository & tooling

- `backend/modular-monolith-app` — NestJS 12 API (already scaffolded).
- `frontend/` — Turborepo, apps `management` / `client` / `customer` / `marketNetwork`
  (already scaffolded).
- Shared frontend packages:
  - `@coifyn/ui` — shadcn/ui primitives + tokens, imported by all 4 apps.
  - `@coifyn/api-client` — typed REST client generated from the API's OpenAPI spec,
    with auth token handling, refresh-retry, `Idempotency-Key` support, error typing.
  - `@coifyn/shared` — cross-app components, hooks, and types not tied to one app.
  - `@coifyn/eslint-config`, `@coifyn/typescript-config`.
- Root `docker-compose.yml`: Postgres 16, Redis 7, MinIO (S3), Mailpit (email catcher).
- `.env.example` complete for the API and every frontend; env loaded through a typed
  config module with a **zod schema that fails fast** on a missing/invalid var.
- Pre-commit hooks: lint-staged + prettier + oxlint; commit-lint. `.nvmrc` (Node 24).

## 0.2 Persistence layer — `backend/src/persistence`

- Drizzle installed + `drizzle.config.ts`; connection via **PgBouncer** (transaction mode).
- Base column helpers: `id` (uuid v7), `createdAt`, `updatedAt`, `deletedAt`; `salonId`
  / `branchId` mixins for tenant tables.
- **Row-Level Security** helper: every tenant table gets a policy keyed on the caller's
  memberships, read from session GUCs `app.user_id` / `app.salon_id` / `app.system` set
  with `SET LOCAL` inside a per-request transaction held in an `AsyncLocalStorage`.
- App connects as a **restricted DB role** (no `BYPASSRLS`); migrations run as the owner.
- Scopes: `withTenant` (ordinary), `withSystemScope` (cross-salon: relay worker, webhook
  handlers, maintenance scripts), `declareBootstrapSalon` (signup, before a membership
  exists).
- Migration workflow: `drizzle-kit generate` → review → `migrate` in CI and on deploy.
  Forward-only.
- Testcontainers helper so integration tests run against a real Postgres.
- Seed script (dev only): one operator, one demo salon, one branch, one owner, three
  stylists, a small service menu.

## 0.3 Transactional outbox & event bus — `backend/src/modules/events`

- `domain_event` table: `id`, `aggregateType`, `aggregateId`, `type`, `payload` (jsonb),
  `salonId`, `correlationId`, `occurredAt`, `publishedAt` (nullable).
- `EventBus` interface + `withTransaction(tx)` helper so a state change and its event
  commit atomically.
- Relay worker: polls unpublished rows (or `LISTEN/NOTIFY`) → pushes to BullMQ → marks
  published. Idempotent, at-least-once.
- Typed event registry (names + payload schemas) in `@coifyn/shared`.
- A guard test: emitting an unregistered event type throws.

## 0.4 Auth & customer identity

### `auth/` (staff)
- `User`, `Session`, `PasswordReset`, `MfaSecret`.
- JWT access (short) + refresh (rotating, revocable in Redis); argon2 hashing.
- `POST /auth/login|logout|refresh|forgot-password|reset-password`, `GET /auth/me`,
  `PATCH /auth/me`, TOTP enroll/verify.
- Errors never reveal whether an account exists.

### `customer-auth/` (salon clients — separate identity)
- `Customer`, `CustomerSession`, `CustomerVerification`.
- `POST /portal/auth/register|verify|login|forgot-password|reset-password`,
  `GET/PATCH /portal/me`.
- Email or phone + password; OTP verification; short-lived, single-use, attempt-capped
  reset codes (HMAC-hashed at rest).
- A customer is **never** a staff `User` and can never reach a staff endpoint.

## 0.5 Tenancy & RBAC — `backend/src/modules/tenancy`, `backend/src/modules/rbac`, `backend/src/common`

- `SalonOrganization` (slug, legalName, brand, currency, taxProfile, timezone, status),
  `Branch` (name, address, hours), `Chair` (branchId, label, active).
- `TenantContextMiddleware` — resolves `salonId` from `Host` (`slug.coifyn.app`) or JWT
  claim → sets the RLS GUCs + `req.tenant`.
- `rbac/`: `Permission` catalog (seeded), `Role` (salonId, name, isStandard),
  `RolePermission` (permission, scope: `org` | `branch`), `Membership` (userId, salonId,
  roleId), `BranchMembership` (userId, branchId).
- Standard roles bootstrapped on salon creation: **Owner**, **Manager**, **Front Desk**,
  **Stylist**.
- `RbacGuard` + `@RequirePermission('resource:action')`; `authorize(user, permission,
  resourceContext)` in the Application layer resolves org-vs-branch scope from the
  resource.
- `EntitlementGuard` — a permission is also checked against the salon's granted modules
  (stub in Phase 0; real engine in Phase 5).
- `AuditInterceptor` → writes `AuditEvent` on flagged mutating routes.
- `IdempotencyInterceptor` — `Idempotency-Key` header → Redis dedupe for writes.
- Global `ValidationPipe`; RFC-7807 problem+json error filter; pagination helper.

## 0.6 Audit — `backend/src/modules/audit`

- `AuditEvent` (actor, actorType: staff|customer|system, action, targetType, targetId,
  reason, before, after, correlationId, ip).
- `GET /audit` (filter by target, actor, date; read-only, `auditlog:view`).

## 0.7 Real-time transport — `backend/src/modules/realtime`, `backend/src/modules/notifications`

- SSE framing helper (WHATWG spec), `SSE_HEADERS`, `: ping` heartbeat, self-close under
  the platform request ceiling, abort wiring.
- In-process `EventEmitter` bus + short-interval DB-poll fallback (cross-instance).
- `GET /api/v1/realtime/stream` — salon/branch-shared topic broadcasts; client refetches.
- `GET /api/v1/notifications/stream` — per-user notification push with `Last-Event-ID`
  resume.
- `notifications/`: `Notification` table (one row per recipient), `NOTIFICATION_TYPES`
  catalog with an `implemented` flag, `emit()` that fans out + publishes to the bus,
  centralized recipient-relevance rules that mirror the `authorize()` scope logic.
- `GET /api/v1/notifications`, `POST /api/v1/notifications/:id/read`,
  `POST /api/v1/notifications/read-all`, `GET /api/v1/notifications/unread-count`.

## 0.8 Provider seams — `backend/src/modules/providers` (stub impls now)

- `PaymentProvider` → `StripeProvider` (test keys) / `NoopPaymentProvider`.
- `NotificationProvider` → `SesProvider` / `TwilioProvider` / console-log dev impl.
- `ObjectStore` → `S3Provider` (MinIO locally); presigned upload/download.
- `SearchIndex` → `PostgresSearchProvider` now, `TypesenseProvider` later.
- `EventBus` → `BullMqEventBus` now, `KafkaEventBus` later.

## 0.9 Observability — `backend/src/modules/observability`

- OpenTelemetry SDK: HTTP + Postgres + Redis + BullMQ auto-instrumentation → OTLP →
  Grafana Cloud.
- `pino` structured logs; every line carries `correlationId`, `salonId`, `userId`,
  `traceId`.
- `GET /api/health` + `GET /api/health/ready` (checks DB, Redis).
- Sentry on the API + all 4 frontends (release + source maps in CI).

## 0.10 Frontend foundation

- `@coifyn/api-client` generated and wired into all 4 apps; auth token handling,
  refresh-retry, `Idempotency-Key`, typed errors.
- Shared auth: staff login (`management`, `client`) and customer login (`customer`)
  patterns from `@coifyn/shared`.
- `@coifyn/ui` design system: tokens (color, type, spacing), base shadcn components.
- App shells for all 4: nav, error boundary, loading/empty states, toast.
- `proxy.ts` (Next 16) — session-cookie route gate per app.
- Playwright wired against the compose stack.
- Folder convention inside every app: thin `app/` route files that render one
  `features/<domain>/components/<Name>.tsx`; `lib/api/<domain>/<action>.ts` one file per
  call; `shared/` for within-app reuse; `@coifyn/*` packages for cross-app reuse.

## 0.11 CI/CD & infra

- GitHub Actions: on PR → oxlint, typecheck, Vitest unit + integration (Testcontainers),
  Playwright, build. On merge to `main` → build image, push, deploy to **staging**.
- Terraform: VPC, RDS Postgres, ElastiCache Redis, ECS services (api + 4 web), S3
  buckets, Cloudflare zone + WAF, Secrets Manager.
- Manual approval gate → deploy to **production**.
- `wildcard *.coifyn.app` DNS + TLS for per-salon subdomains.
- DB backup policy (automated + PITR) with a documented restore runbook.

## 0.12 Data-model pass

- Turn the Entities lists in Phases 1–7 into a reviewed ERD (Drizzle schema files):
  every column typed, every FK, every index, every unique/check constraint. Money =
  integer minor units + currency.
- Naming convention doc: snake_case columns, `_id` suffixes, timestamp naming.

---

## Events introduced

`SalonCreated`, `BranchCreated`, `ChairCreated`, `UserRegistered`, `UserLoggedIn`,
`PasswordReset`, `MfaEnrolled`, `CustomerRegistered`, `CustomerVerified`, `RoleCreated`,
`RoleAssigned`.

## Entitlements introduced

The entitlement **guard** exists and is called on every scoped route; the entitlement
**engine** (grant/revoke, limits, scheduling) is stubbed until Phase 5. Phase 0 seeds
every salon with all `*.core` flags enabled so Phases 1–4 are not blocked.

## Acceptance

1. `docker compose up` → full local stack (Postgres, Redis, MinIO, Mailpit).
2. `npm run dev` → API on :4000 with `/api/docs`; 4 apps on :3001–:3004.
3. A visitor registers as a salon owner; the salon, one branch, and the four standard
   roles are created; the owner gets the Owner role.
4. The owner's JWT resolves a tenant that scopes a trivial query via RLS; a request with
   no tenant scope returns no rows, not all rows.
5. Creating a row writes a `domain_event` in the same transaction; the relay publishes
   it; a BullMQ worker logs it; an SSE client on `/api/v1/realtime/stream` receives a
   bridged topic and an `/api/v1/notifications/stream` client receives a test
   notification.
6. RBAC blocks a Stylist from a Manager-only route; a salon can create a custom role and
   assign it.
7. Every mutating action writes an `AuditEvent` with actor, action, target, timestamp.
8. `git push` → CI runs against real Postgres/Redis → deploys to staging automatically;
   a request trace is visible in Grafana with DB + Redis spans; an error shows in Sentry.

When all 8 are true, **start Phase 1**.
