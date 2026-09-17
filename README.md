# Coifyn

Salon/barber SaaS. NestJS modular-monolith API (`backend/`) + Turborepo frontend
(`frontend/`: `management`, `client`, `customer`, `marketNetwork`).

## One-command dev setup

```bash
# 1. Bring up local infra: Postgres 16, Redis 7, MinIO (S3), Mailpit (email catcher)
docker compose up -d

# 2. Install deps
npm install

# 3. Configure the API
cp backend/.env.example backend/.env
# fill in JWT_ACCESS_SECRET / JWT_REFRESH_SECRET (openssl rand -base64 48)

# 4. Run migrations (and optionally seed dev data)
cd backend && npm run db:migrate && npm run db:seed && cd ..

# 5. Start everything
npm run dev
```

This brings up:
- API on `http://localhost:4000` (`/api/docs` for Swagger)
- `management` on `:3001`, `client` on `:3002`, `customer` on `:3003`, `marketNetwork` on `:3004`
- MinIO console on `http://localhost:9001` (coifyn / coifyn123)
- Mailpit UI on `http://localhost:8025`

## Repo layout

- `backend/` — NestJS API, Drizzle ORM over Postgres, Redis via ioredis, BullMQ outbox relay.
- `frontend/` — Turborepo workspace: 4 Next.js apps + shared `@coifyn/*` packages.
- `terraform/` — infrastructure as code (written, not applied from this repo).
- `phases/` — the phased build plan. Start with [`phases/phase-0-foundation.md`](phases/phase-0-foundation.md).

## Acceptance criteria

Phase 0 is done when every item in
[`phases/phase-0-foundation.md`](phases/phase-0-foundation.md)'s **Acceptance** section
is true. Check there before assuming a feature is missing or complete.
