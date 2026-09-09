# Coifyn — Delivery phases

This folder is the **build specification** for Coifyn. No business code is written from
it yet — each file defines one delivery phase: the modules to create, the data it
persists, the API it exposes, the events it emits, and the definition of done.

**Read [`architecture.md`](architecture.md) first** — the technology stack, the scale
path (Coifyn Discover is the only surface that reaches millions of users), and the
non-negotiables that must be in place from the first commit.

## The product

One multi-tenant SaaS platform. The unit of supply is the **chair** — an individual
stylist's time — not the shop. Four frontends over one transactional core:

| # | App (`frontend/apps/*`) | Primary user | Purpose |
|---|---|---|---|
| 1 | `management` | Coifyn operator team | Onboard salons, control module entitlements, meter usage, bill, support, watch platform health |
| 2 | `client` | Salon owner / manager / stylist / front desk | Run the shop: stylist profiles, chairs, bookings, walk-in queue, POS, payments, inventory, staff pay, marketing, reports |
| 3 | `customer` | Salon clients | See each stylist's live status and open slots, book and confirm, track queue position, keep a cut record and loyalty, follow a stylist between shops |
| 4 | `marketNetwork` | The public | Search stylists by the cut they actually deliver, browse verified portfolios, redeem offers |

There is **no separate finance app** — salon finance lives inside the `client` console.

## Phases

| Phase | File | Theme | Primary display(s) |
|---|---|---|---|
| 0 | [phase-0-foundation.md](phase-0-foundation.md) | Foundation sprint — skeleton before any feature code | — |
| 1 | [phase-1-salon-core.md](phase-1-salon-core.md) | One salon end to end — setup, services, stylists, walk-in queue, POS, payment, owner report | `client` |
| 2 | [phase-2-scheduling-and-clients.md](phase-2-scheduling-and-clients.md) | Per-stylist calendars, appointments, live queue & status, customer + cut records, loyalty, real-time notifications | `client`, `customer` |
| 3 | [phase-3-salon-operations.md](phase-3-salon-operations.md) | Inventory, memberships/packages/gift cards, commission & payroll & chair rental, marketing, forms, reviews | `client` |
| 4 | [phase-4-customer-app.md](phase-4-customer-app.md) | Full customer app — discover, book a specific stylist, pre-visit, in-visit, feedback, loyalty, follow-your-stylist | `customer` |
| 5 | [phase-5-operator-and-billing.md](phase-5-operator-and-billing.md) | Operator control plane — clients, entitlements, usage metering, billing calculator, support, platform payments | `management` |
| 6 | [phase-6-discovery-marketplace.md](phase-6-discovery-marketplace.md) | Coifyn Discover — verified profiles, search-by-result, offers hub, premium placement, closed-loop attribution | `marketNetwork`, `management` |
| 7 | [phase-7-intelligence.md](phase-7-intelligence.md) | AI receptionist, churn/upsell/pricing intelligence, analytics warehouse, multi-branch, governed automation | `client`, `management` |

Each phase file opens with an **Overview** section — what the phase is for, what it
depends on, and what it deliberately leaves out — before the module detail.

## Conventions used in every phase file

- **Modules** — NestJS feature modules to create under `backend/src/modules/<module>`.
- **Entities** — persisted tables (PostgreSQL / Drizzle). Every entity has `id` (uuid
  v7), `createdAt`, `updatedAt`, `deletedAt` (soft delete where relevant), and — where
  tenant-scoped — `salonId` and `branchId`.
- **API** — REST endpoints under `/api/v1`. All are RBAC-guarded and tenant-scoped.
  One route handler → one Application-layer use case → one file per operation.
- **Events** — domain events written to the transactional **outbox** (`domain_event`
  table) in the same DB transaction as the state change, then relayed to the event bus
  (BullMQ now, Kafka at the scale trigger — see `architecture.md`).
- **Jobs** — background / queue workers.
- **Entitlements** — feature flags the operator can grant per salon / branch.
- **Acceptance** — the definition of done for the phase.

## Cross-cutting foundation (built in Phase 0, used by every later phase)

- `common/` — tenant-context middleware (resolves `salonId` from `Host` / JWT), RBAC
  guard, entitlement guard, audit interceptor, idempotency-key handler, pagination,
  RFC-7807 error filter.
- `auth/` — staff users, roles, permissions, sessions, JWT (access + refresh), argon2,
  optional TOTP MFA. Separate `customer-auth/` identity for the `customer` app.
- `rbac/` — permission catalog + standard roles (Owner, Manager, Front Desk, Stylist)
  + salon-defined custom roles; `@RequirePermission()`, branch-scopable grants.
- `tenancy/` — `SalonOrganization`, `Branch`, `Chair`; Postgres Row-Level Security on
  every tenant table.
- `events/` — `domain_event` outbox table + relay worker + typed `EventBus`.
- `realtime/` — SSE transport (per-user notification stream + salon-shared topic
  stream), in-process bus + DB-poll fallback.
- `notifications/` — notification catalog, write-time fan-out, recipient-relevance rules.
- `audit/` — immutable `AuditEvent` log (actor, action, target, reason, before/after).
- `persistence/` — Drizzle schema, migrations, PgBouncer, restricted app DB role.
- `observability/` — OpenTelemetry traces + metrics, structured pino logs with
  `correlationId`.
- Provider seams: `PaymentProvider` (Stripe), `NotificationProvider` (SES/Twilio/
  Firebase), `SearchIndex` (Postgres → Typesense), `EventBus`, `ObjectStore` (S3).
