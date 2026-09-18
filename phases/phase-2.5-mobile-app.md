# Phase 2.5 — Mobile app (customer + Discover, merged)

## Overview

**What this phase is for.** Ship the first native mobile app: a single React Native
(Expo) app that merges the `customer` web app's booking/tracking surface with a
lightweight `marketNetwork` discovery surface — one app, not three, because a phone
user won't install a separate app per concern (see `architecture.md` §11). It consumes
the same REST API as every web app; no parallel backend is built for it.

**Depends on.** Phase 0 (customer-auth, RBAC, events, realtime, notifications) and
Phase 2 (live queue, stylist status, appointments-full, disruptions, cut-records,
loyalty, notification dispatch — the first slice of what a customer needs to see is
already live by then). Reuses `@coifyn/api-client` and `@coifyn/shared` types from the
web monorepo directly (Expo can consume the same TypeScript packages).

**Primary display.** A new `mobile` app (Expo/React Native), added as
`mobile/` at the repo root — outside `frontend/apps/*` since it's a different runtime,
but still an npm workspace so it can depend on `@coifyn/api-client` and
`@coifyn/shared`.

**Leaves out.** `management` (salon back-office) never ships on mobile — see
`architecture.md` §11 for why. Self-serve booking *confirmation* (vs. the booking
*request* staff confirms) is Phase 4 scope; this phase's booking flow on mobile mirrors
whatever the `customer` web app supports at the time (a request, not an instant
confirmation). Real marketplace search/ranking is Phase 6 — this phase's Discover tab
is a thin, honest stub (salon lookup by name/slug + anything already public from Phase
2's `customer` web slice), not a search engine. No native payments (Apple/Google Pay)
in this phase — payment still happens in-salon via the `client` console's POS.

**Done when.** A customer can install the app, register/log in (customer-auth),
find a salon they already know the name of, see a stylist's live status and next open
slot, submit a booking request, track their position in the live queue, and receive a
push notification when a disruption affects their booking — all against the real API,
with no mobile-specific backend module beyond push-token registration.

---

## Feature modules

No new business-logic modules. This phase is a new **frontend consumer** of the
existing API. The one backend addition is push-delivery plumbing that Phase 2's
`notifications` module already scoped but didn't need until a native client existed:

### `notifications` (adds push registration — extends Phase 2) — `backend/src/modules/notifications`
- **Entities (adds):** `DeviceToken` (customerId, platform: `ios|android`, token,
  lastSeenAt, revokedAt?).
- **API (adds):**
  - `POST /portal/devices` (register/refresh a push token), `DELETE /portal/devices/:id`
    (unregister, e.g. on logout)
- **Rules:** a token is retried a bounded number of times on delivery failure, then
  marked `revokedAt` and excluded from future fan-out (mirrors how email/SMS bounces
  are already handled behind `NotificationProvider`).
- **Events:** `DeviceTokenRegistered`, `DeviceTokenRevoked`.

Everything else — auth, salon/stylist/service reads, queue, appointments, disruptions,
cut-records, loyalty — is the same `/api/v1` and `/portal/*` surface the `customer` web
app already calls. The mobile app's `@coifyn/api-client` usage is additive (new call
files), not a new API.

---

## `mobile` app — screens this phase

Same decomposition rule as every web app: thin route files, one feature component per
screen, split into small children, one API call per file under `lib/api/<domain>/`.

- `app/(auth)/login`, `app/(auth)/register` →
  `features/auth/components/{LoginScreen,RegisterScreen}` — customer-auth
- `app/(tabs)/discover` → `features/discover/components/DiscoverHome` (+ `SalonSearchBar`,
  `SalonResultCard`) — thin stub: name/slug lookup only, honest empty-state copy
  pointing out full search lands with Phase 6, not a fake "no results" state
- `app/salon/[slug]` → `features/discover/components/SalonScreen` (+ `StylistList`,
  `StylistStatusBadge`, `ServiceList`) — same data Phase 2's `customer` web `SalonPage`
  shows
- `app/salon/[slug]/book` → `features/booking/components/BookingRequestScreen` (+
  `StylistPicker`, `ServicePicker`, `SlotPicker`) — submits a request, mirrors the web
  `BookingRequest` flow
- `app/(tabs)/bookings` → `features/bookings/components/MyBookingsScreen` (+
  `BookingCard`, `DisruptionBanner`) — a customer's own appointments + any open
  disruption offer, resolvable in-app (`wait|next_slot|stand_in|cancel`)
- `app/queue/[branchId]` → `features/queue/components/LiveQueueScreen` — same public
  wait board as the web `LiveQueue`, native push instead of polling
- `app/(tabs)/profile` → `features/profile/components/ProfileScreen` (+
  `LoyaltyCard`, `NotificationSettings`) — loyalty balance/ledger (read-only), push/
  channel preferences

---

## Realtime & push

- **SSE stays the transport for in-app live state** (queue position, stylist status)
  while the app is foregrounded — same `queue:<branchId>` / `stylist-status:<branchId>`
  topics as web, via `@coifyn/shared`'s `useNotificationStream`/realtime hooks.
- **Push (APNs/FCM) covers backgrounded/killed-app delivery** — disruption alerts,
  "you're next in line," booking confirmations — via `NotificationProvider`'s existing
  `push` channel (Phase 2), now with real recipients once `DeviceToken` exists.
- **Jobs:** none new; reuses Phase 2's `notification-dispatch` queue, now fanning out to
  a channel that has live recipients for the first time.

## Entitlements introduced

None. Mobile respects whatever entitlements/RBAC already gate the underlying API calls
— there is no mobile-specific feature flag.

## Acceptance

1. A customer registers/logs in on mobile using the same `customer-auth` identity as
   the web `customer` app (interchangeable — logging in on both shows the same account).
2. Discover tab finds a salon by name/slug and is explicit in its UI copy that this is
   not full search yet (no fabricated ranking/results).
3. A stylist's live status and next open slot render correctly on the salon screen,
   matching what the `client` console and web `customer` app show for the same salon at
   the same moment.
4. A booking request submitted on mobile appears in the `client` console for staff to
   confirm — identical behavior to the web booking-request flow.
5. The live queue screen shows the correct per-stylist wait and updates in real time
   while the app is open.
6. A declared disruption reaches the affected customer as a push notification within
   the existing dispatch job's normal latency, even with the app backgrounded; resolving
   it in-app records the same `DisruptionOfferResolved` event the web/staff flow does.
7. Logging out revokes the device's push token; no further push notifications are
   delivered to that token.
8. One salon's customers never see another salon's queue, bookings, or loyalty data —
   RLS/tenant scoping holds identically to every web app, since it's the same API.
