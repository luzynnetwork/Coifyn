# Coifyn — Architecture & technology decisions

## Overview

This is the definitive technology-stack and system-shape reference for Coifyn. Read it
before Phase 1.

The eventual target is **millions of users** — but that load lives almost entirely on
**Coifyn Discover** (the `marketNetwork` app): public, read-heavy, cacheable, search-
driven. The operational core (bookings, tickets, folios, stylist calendars) stays
comparatively small and consistent. So we build a *scalable-shaped* system now —
stateless services, clean module boundaries, an event log, tenant + branch scoping keys
from day one — and switch on the heavy infrastructure at defined **scale triggers**.
Standing up Kafka + Kubernetes + ClickHouse before there are 10 paying salons would bury
the project.

This is the same discipline as the Luzyn/`hotel-management` architecture, adapted to the
chair-as-supply model and a NestJS backend.

---

## 1. Who actually generates load

| Segment | Who | Realistic concurrency |
|---|---|---|
| Salon staff (console, POS, queue board, stylist app) | shop employees | ~3–20 per branch |
| Operator team (`management`) | Coifyn's internal team | tens |
| **Customers browsing Discover / booking** | the public | **this is the only segment that reaches millions** |

The 1M number is a **Discover + `customer` app** problem. Architecture below reflects
that split: the operational core is OLTP and modest; the marketplace is a cached read
tier fed from the event log.

---

## 2. The stack

### 2.1 Confirmed

| Layer | Choice | Notes |
|---|---|---|
| Backend framework | **NestJS 12** (modular monolith, Express platform) | one deployable; modules split out later only for a measured reason |
| Language | **TypeScript** (strict) | backend + all 4 frontends |
| Frontends | **Next.js 16** App Router, **React 19** | 4 apps in `frontend/apps/*` |
| Monorepo (frontend) | **Turborepo** + npm workspaces | shared `@coifyn/*` packages |
| UI | **shadcn/ui** + Tailwind v4 + lucide icons | `@coifyn/ui` package holds the primitives |
| Client data layer | **TanStack Query** over a generated typed REST client | not tRPC — see §4 |
| API style | REST `/api/v1`, OpenAPI/Swagger | tenant-scoped, RBAC-guarded |

### 2.2 Added now — Phase 1 baseline

| Concern | Choice | Why |
|---|---|---|
| **ORM / DB access** | **Drizzle ORM** + drizzle-kit | thin, predictable SQL, first-class TS types, easy raw-SQL escape hatch |
| **Primary database** | **PostgreSQL 16** | relational integrity for money, folios, commission, audit; supports Row-Level Security |
| **Connection pooling** | **PgBouncer** (transaction mode) | keeps Postgres healthy from day one |
| **Cache / ephemeral state** | **Redis 7** (single node now) | sessions, rate-limit counters, hot lookups (service menu, stylist availability), SSE bus fan-out |
| **Background jobs** | **BullMQ** (on Redis) | reminders, notification dispatch, recipe deduction, rollups — kept until the Kafka trigger |
| **Domain event log** | **Postgres `domain_event` table** (append-only outbox) | every state change writes an event in the same transaction — the audit spine and the future Kafka source |
| **Real-time push** | **Server-Sent Events** (see §5) | live queue, stylist status, booking updates, notifications |
| **Staff auth** | NestJS + **JWT** (access + refresh), **argon2**, optional **TOTP MFA** | sessions revocable via Redis |
| **Customer auth** | separate identity, email/phone + password, OTP verify, short-lived reset tokens | a customer is never a staff `User` |
| **Object storage** | **S3** (or Cloudflare R2) | portfolio photos, cut-record photos, invoices, consent forms — never the DB |
| **Payments** | **Stripe** (Connect / marketplace model) | hosted fields → PCI SAQ-A; Connect covers Phase 5 payouts to salons and chair renters; adapter interface for a regional PSP |
| **Email / SMS / WhatsApp / push** | **Resend** or **SES** (email), **Twilio** (SMS + WhatsApp), **Firebase** (push) | all behind one `NotificationProvider` interface |
| **Search** | **Postgres** trigram / `tsvector` now | Discover search moves to Typesense at the trigger (§2.3) |
| **Containerization** | **Docker** + docker-compose for local | one image for the API, one per Next app |
| **Hosting (MVP)** | **AWS ECS Fargate** (API) + **Vercel** or CloudFront (web apps) | managed containers, autoscaling, no K8s burden yet |
| **CDN / edge / WAF** | **Cloudflare** in front of everything | caching for Discover, bot mitigation — on before any public launch |
| **Observability** | **OpenTelemetry** SDK in the API from day one → Grafana Cloud free tier | `nestjs`-otel + `pino` structured logs |
| **Error tracking** | **Sentry** — API + all 4 frontends | |
| **Tests** | **Vitest** + supertest + Testcontainers (API against real Postgres/Redis); **Playwright** (frontend flows) | payment and commission flows tested end to end |
| **CI/CD** | **GitHub Actions** | lint (oxlint), typecheck, test, build image, deploy |
| **IaC** | **Terraform** | even the MVP infra is defined in code |

### 2.3 Deferred — turn on at a scale trigger

| Tech | Replaces / adds | Trigger to adopt |
|---|---|---|
| **Apache Kafka** (MSK / Confluent) | BullMQ as the event backbone; feeds analytics + attribution + search indexing | BullMQ queue depth regularly > 10k **or** > ~500 events/sec sustained **or** Discover attribution needs event replay. The outbox makes this a connector change, not a rewrite. |
| **Postgres read replicas** + read/write routing | scales reads | primary CPU > 60% sustained **or** p95 read latency regression |
| **Redis Cluster** | single Redis | memory > 60% **or** > ~50k ops/sec **or** HA needed for sessions |
| **Typesense** (or Elasticsearch) | Postgres search for Discover (Phase 6) | Discover search p95 > 200ms **or** catalog > ~50k stylist listings **or** faceted "search by result" ranking is needed. Index fed from the event log. |
| **ClickHouse** + Metabase/Superset | analytics queries currently on Postgres (Phase 7) | analytical queries slow the OLTP primary **or** dashboards scan > 10M rows. Loaded async from Kafka/outbox — never on the app's hot path. |
| **Tenant sharding** (multiple Postgres clusters, routed by `salonId`) | single primary | a salon chain saturates one primary **or** data-residency forces per-region clusters. `salonId` is on every tenant row from Phase 1, so the shard key already exists. |
| **Kubernetes (EKS)** | ECS Fargate | > ~30 service instances, complex autoscaling, or a platform engineer is hired. Not before. |

---

## 3. Layered architecture inside the monolith

Four layers, each depending only on the layer below — adapted from `team-management`:

```
Presentation   — the 4 Next.js apps (never call the backend except over HTTP)
      │  HTTPS  /api/v1/*
API            — NestJS controllers: parse, validate (zod/class-validator), format
Application    — use cases: the ONLY place authorization + tenancy scoping happen
Domain         — business rules, entities — framework-free
Data           — Drizzle repositories against Postgres
Infrastructure — cross-cutting: auth, payments, notifications, search, event bus (used by Application, not called by Presentation/API)
```

**Rules**

1. There is exactly one way into business logic: the REST API. A future native mobile
   app or public API reuses the same endpoints with zero rework.
2. Every Application-layer function that mutates or does a scoped read calls
   `authorize(user, permission, resourceContext)` **first** — a hard rule, not a
   per-feature convention. Public functions are explicit named exceptions.
3. Controllers never touch Domain or Data directly.
4. One operation = one file (`modules/<domain>/application/<action>.ts`), matching the
   decomposition discipline used across this codebase — small single-purpose units, not
   large multi-purpose files.

---

## 4. Client ↔ server API: REST + OpenAPI, not tRPC

The wire contract is **REST `/api/v1` + OpenAPI**. A typed client is generated from the
spec (`openapi-typescript` / `orval`) and consumed in every frontend through
**TanStack Query** for caching, dedupe, optimistic updates and cache invalidation.

Why not tRPC: it couples the client to a single TypeScript server's router types. Coifyn
has 4 separate frontends, a public marketplace, near-certain third-party salon
integrations, and a likely native mobile app — all of which consume plain HTTP. REST +
generated types gives the same end-to-end type safety without the coupling, and the
marketplace's cacheable GETs sit behind a CDN, which RPC-over-POST cannot.

**Realtime pairs with it:** an incoming SSE `change` event just calls
`queryClient.invalidateQueries([topic])` — the client refetches the REST resource it
already knows, so RLS and permission scoping are untouched.

---

## 5. Real-time (SSE) — the `team-management` pattern

Two Server-Sent Events streams, Node runtime, one `EventSource` each:

- **`GET /api/v1/notifications/stream`** — per-user. Pushes the full notification row the
  moment it is emitted. Backlog + `Last-Event-ID` resume (cursor = `createdAt|id`).
- **`GET /api/v1/realtime/stream`** — salon/branch-shared. Broadcasts only the *topic*
  that changed (`queue:<branchId>`, `stylist-status:<branchId>`, `bookings:<stylistId>`,
  `chairs:<branchId>`); the client then refetches that REST resource.

**Delivery:** an in-process `EventEmitter` bus (same-instance fast path) **plus** a
short-interval DB poll fallback (a change emitted on another instance still arrives).
Framing per the WHATWG SSE spec; `: ping` comment heartbeat; the stream self-closes a
little under any platform request ceiling and the client reconnects transparently.

**Why SSE not WebSockets now:** the traffic is server→client only (status, queue,
booking updates, notifications). SSE needs no extra infrastructure, resumes itself, and
rides the existing HTTP stack. If a genuinely bidirectional need appears (live chat
between customer and salon), add Socket.IO + the Redis adapter for that feature only.

---

## 6. Multi-tenancy & the chair model

Shared database, shared schema. Every tenant-scoped table carries `salonId`, and where
the row belongs to a location, `branchId`.

- **`SalonOrganization`** — the client business (slug, brand, currency, tax profile,
  timezone, status). A single-shop salon and a 40-branch chain use the same model.
- **`Branch`** — a physical location. Most salons have one.
- **`Chair`** — a station within a branch; the schedulable resource a booking may hold
  in addition to a stylist.
- **`StylistProfile`** — the barber/stylist: links a staff `User`, holds bio,
  specialties, portfolio, commission model, optional chair-rental agreement, and a live
  `status` (available / working / busy / on_break / off_shift / on_leave).

Two enforcement layers, both from Phase 1:

1. **Application-layer scoping** — every Data-layer query for a tenant table requires a
   `salonId`; no code path omits it.
2. **Postgres Row-Level Security** — policies on every tenant table, keyed on the
   caller's memberships. The app connects as a restricted role (no `BYPASSRLS`); a
   per-request transaction sets `app.user_id` / `app.salon_id` / `app.system` via
   `SET LOCAL`, held in an `AsyncLocalStorage`.

---

## 7. Authorization (RBAC) — salons define their own roles

Permissions are **data, not code**: a fixed permission catalog (`resource:action`
strings), and `Role` rows (salon-scoped, standard + custom) that hold a subset of it.

- **`Membership`** links a `User` to a `SalonOrganization` with one `Role`.
- **`BranchMembership`** links a `User` to one or more `Branch`es (many-to-many, no role
  of its own) — the "own branch" scope.
- **Standard roles** seeded on every salon: **Owner** (implicit full access, uneditable),
  **Manager**, **Front Desk**, **Stylist**.
- **Custom roles** — a salon builds its own (`role:create`) from the same catalog, e.g.
  "Senior Stylist", "Shift Lead", "Apprentice" — any subset of permissions, at org or
  branch scope.
- **Scopable** permission = grantable org-wide **or** restricted to the branches the
  role-holder belongs to. Scope is a property of the grant, not the permission.

Enforced in exactly one place: the Application layer, via a single
`authorize(user, permission, resourceContext)` call. The UI only mirrors entitlements
and permissions — it never enforces them.

Every branch-scoped permission is also evaluated against the operator's **entitlements**
(§Phase 5): a permission the salon holds but has not been granted the module for is
still denied.

---

## 8. Non-negotiables from commit #1

Cheap now, very expensive to retrofit:

1. **`salonId` (+ `branchId` where relevant) on every tenant-scoped row** — the RLS
   filter, the shard key, the cache-key prefix.
2. **Postgres Row-Level Security** on tenant tables, plus the app-level tenant guard.
3. **Transactional outbox** — the `domain_event` row is written in the same DB
   transaction as the state change; a relay publishes it (BullMQ now, Kafka later).
4. **Idempotency keys** on every write endpoint a client or webhook can retry (payments,
   bookings, Stripe/PSP webhooks, channel/marketplace callbacks).
5. **Stateless API instances** — no in-memory session, no in-memory job state; the SSE
   bus has a DB-poll fallback so no sticky routing is required.
6. **Structured JSON logs** with `correlationId`, `salonId`, `userId` on every line;
   OpenTelemetry trace context propagated.
7. **Everything swappable behind an interface**: `PaymentProvider`,
   `NotificationProvider`, `SearchIndex`, `EventBus`, `ObjectStore`.
8. **Money is integer minor units** + currency code. Never floats.
9. **Migrations are forward-only and reviewed.** No destructive migration without a
   backfill plan.
10. **One operation = one file.** No thousand-line services or components anywhere.

---

## 9. Environments

| Env | DB | Infra | Purpose |
|---|---|---|---|
| local | docker-compose (Postgres, Redis, MinIO, Mailpit) | — | development |
| CI | Testcontainers | GitHub Actions | automated tests |
| staging | small RDS + Redis | ECS Fargate, Cloudflare | QA, load tests, demos |
| production | RDS Multi-AZ + Redis | ECS Fargate (autoscale), Cloudflare, S3 | live |

---

## 10. Infrastructure rollout against the phases

| Phase | Infra added |
|---|---|
| 0 | Postgres + PgBouncer + Redis + BullMQ + SSE + S3 + OTel/Grafana + Sentry + ECS + Cloudflare + CI/CD + Terraform |
| 1 | (feature work only) |
| 2 | notification dispatch workers; Twilio/WhatsApp; SSE queue + status streams |
| 3 | Stripe (payments); payroll/commission jobs |
| 4 | (feature work only) |
| 5 | Stripe Connect (marketplace payouts); usage-metering pipeline on the event log |
| 6 | **Typesense** for Discover search; Cloudflare cache rules for public pages; **Kafka** likely on by now |
| 7 | **ClickHouse + Metabase**; AI provider abstraction; possibly K8s |
