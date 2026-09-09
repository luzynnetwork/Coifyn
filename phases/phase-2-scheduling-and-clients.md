# Phase 2 — Scheduling, live status & clients

## Overview

**What this phase is for.** Turn the walk-in shop of Phase 1 into a booked business built
around the **individual stylist**. Every stylist gets a real calendar; customers (still
via staff for now — the customer app is Phase 4) get booked into specific stylist slots;
the branch runs a live queue with per-stylist wait estimates; each stylist carries a
live status the whole shop can see; and every client gets a persistent record with a
**cut record** (formulas, guard numbers, products, photos) so a stand-in can reproduce
the last cut. Real-time notifications (the `team-management` SSE pattern) go live.

**Depends on.** Phase 1 (services, stylists, appointments-minimal, queue, tickets,
customers).

**Primary displays.** `client` (salon console), and the first slice of `customer` —
a read-only "who's working now and what's open" view plus booking-request submission.

**Leaves out.** The full customer app (Phase 4), inventory / memberships / payroll
(Phase 3), marketing campaigns beyond transactional reminders (Phase 3), the marketplace
(Phase 6).

**Done when.** A stylist's week can be rostered, a customer booked into an open slot
with automatic reminders, a running-late or absence alert offered to the affected
customers with real choices, the live queue shows a correct per-stylist wait, and the
client's cut record is captured at checkout and visible to any stylist who serves them
next.

---

## Feature modules

### `availability` — `backend/src/modules/availability`
- **Entities:**
  - `StylistShift` (stylistId, branchId, startAt, endAt, chairId?, kind: `regular|
    override`), `ShiftTemplate` (weekly recurring pattern), `StylistTimeOff` (from, to,
    reason, status: `requested|approved|denied`).
  - `AvailabilitySlot` — derived, not stored: shift minus booked appointments minus
    breaks minus time-off, sliced to the shortest bookable service.
- **API:**
  - `GET /availability/roster?branchId&from&to`, `POST /shifts`, `PATCH /shifts/:id`,
    `DELETE /shifts/:id`, `POST /shift-templates`, `POST /shift-templates/:id/apply`
  - `GET /time-off`, `POST /time-off`, `POST /time-off/:id/approve|deny`
  - `GET /availability/slots?stylistId&serviceIds&date` (open slots for a booking)
- **Events:** `ShiftPublished`, `TimeOffRequested`, `TimeOffApproved`.
- **Jobs:** `roster-generator` (materializes templates into shifts on a rolling horizon).
- **Entitlements:** `availability.core`.

### `appointments` (full — extends Phase 1) — `backend/src/modules/appointments`
- **Entities (adds):** `BookingHold` (short-TTL slot lock during a booking flow),
  `AppointmentReschedule` (from, to, by, reason), `RecurringAppointment` (rule, nextAt).
- **API (adds):**
  - `POST /appointments/hold`, `POST /appointments/confirm` (from a hold)
  - `POST /appointments/:id/reschedule`, `POST /appointments/:id/reassign-stylist`
    (to a stand-in — records the original stylist)
  - `GET /appointments/day-sheet?stylistId&date` (a stylist's own list)
  - `GET /front-desk/board?branchId&date` (all stylists, arrivals, in-service, done)
- **Rules:** conflict prevention is transactional — two active appointments cannot hold
  the same stylist *or* the same chair for overlapping times. Reassigning to a stand-in
  keeps `originalStylistId` so the customer's history still credits the person they
  chose.
- **Events:** `AppointmentRescheduled`, `AppointmentStylistReassigned`,
  `RecurringAppointmentGenerated`.
- **Entitlements:** `appointments.full`.

### `queue` (live wait — extends Phase 1) — `backend/src/modules/queue`
- **API (adds):**
  - `GET /queue/board?branchId` — per stylist: in-service, next up, waiting count,
    estimated minutes ("Ali: 2 ahead, ~35 min")
  - `POST /queue/:id/switch-stylist` (customer takes whoever is faster)
- **Rules:** wait estimate = sum of remaining service durations ahead in that stylist's
  line + current-service elapsed offset. Recomputed on every queue and status change.
- **Realtime:** `queue:<branchId>` carries the whole board delta.

### `stylist-status` (live presence — extends Phase 1) — `backend/src/modules/stylists`
- **API (adds):** `POST /stylists/:id/running-late` (minutes + affected appointment
  window), `POST /stylists/:id/clock-in|clock-out`.
- **Rules:** `clock-in` sets `available`; starting a service sets `busy`; `running-late`
  and `on_leave` trigger the customer-alert flow below.
- **Realtime:** `stylist-status:<branchId>`.

### `disruptions` — running-late & absence handling — `backend/src/modules/disruptions`
- **Entities:** `Disruption` (stylistId, kind: `running_late|absent|left_early`, window,
  createdBy), `DisruptionOffer` (disruptionId, appointmentId, options offered, choice:
  `wait|next_slot|stand_in|cancel|pending`, resolvedAt).
- **API:**
  - `POST /disruptions` (declare), `GET /disruptions/:id/affected` (appointments in the
    window)
  - `POST /disruptions/:id/notify` (send each affected customer their options)
  - `POST /disruption-offers/:id/resolve` (staff records the customer's choice; or the
    customer resolves it themselves once Phase 4 ships)
- **Rules:** a stand-in offer only lists stylists the salon marks as vouched for that
  service; taking one creates a reassigned appointment with `originalStylistId` kept.
- **Events:** `DisruptionDeclared`, `DisruptionOfferSent`, `DisruptionOfferResolved`.
- **Jobs:** `disruption-dispatch` (fan out notifications), `disruption-escalate`
  (unresolved offers older than N minutes go to the front desk).
- **Entitlements:** `disruptions.core`.

### `cut-records` — reproducible cut history — `backend/src/modules/cut-records`
- **Entities:**
  - `CutRecord` (customerId, appointmentId?, stylistId, serviceIds[],
    clipperGuards jsonb (e.g. `{sides: 1, back: 1.5, top: "scissor"}`), fadeType,
    partingNotes, beardNotes, productsUsed[], freeText, createdAt)
  - `CutRecordPhoto` (cutRecordId, objectKey, angle: `front|left|right|back`, isVerified)
  - `FormulaEntry` (customerId, kind: `color|perm|treatment`, formula text, developer,
    processingMin, notes) — for salons, not just barbers
- **API:**
  - `GET /customers/:id/cut-records`, `POST /cut-records`, `PATCH /cut-records/:id`
  - `POST /cut-records/:id/photos` (presigned upload), `DELETE /cut-records/:id/photos/:pid`
  - `GET /customers/:id/formulas`, `POST /formulas`, `PATCH /formulas/:id`
  - `GET /appointments/:id/last-cut` (the customer's most recent record + photos, shown
    to the serving stylist — including a stand-in)
- **Rules:** a photo is `isVerified` only if taken through the app at the salon (Phase 4
  adds customer-submitted verified photos). Cut records are visible to any stylist
  serving that customer at that salon, subject to `cutrecord:view`.
- **Events:** `CutRecordCreated`, `CutRecordPhotoAdded`.
- **Entitlements:** `cutrecords.core`.

### `customers` (full record — extends Phase 1) — `backend/src/modules/customers`
- **Entities (adds):** `CustomerPreference` (preferred stylist, chair, drink,
  conversation level, communication channel), `CustomerTag`, `CustomerNote` (staff,
  private), `CommunicationConsent` (channel, purpose, status, at).
- **API (adds):**
  - `GET/PATCH /customers/:id/preferences`, `GET/PATCH /customers/:id/consent`
  - `POST /customers/:id/tags`, `POST /customers/:id/notes`
  - `GET /customers/:id/timeline` (visits, cut records, no-shows, feedback)
  - `POST /customers/merge` (duplicate resolution, audited)
- **Events:** `CustomerPreferencesUpdated`, `CustomerConsentChanged`, `CustomersMerged`.

### `loyalty` — `backend/src/modules/loyalty`
- **Entities:** `LoyaltyAccount` (customerId, pointsBalance, tier), `LoyaltyLedger`
  (immutable: earn / redeem / adjust / expire, source, at), `LoyaltyRule` (earn rate,
  tier thresholds, expiry policy), `PunchCard` (serviceId, needed, earned) — barbershop
  "10th cut free" style.
- **API:**
  - `GET /customers/:id/loyalty`, `GET /customers/:id/loyalty/ledger`
  - `POST /customers/:id/loyalty/adjust` (permission + reason + audit)
  - `GET/PUT /loyalty/rules`
- **Jobs:** `loyalty-accrual` (consumes `PaymentCompleted`), `loyalty-expiry`.
- **Events:** `LoyaltyPointsEarned`, `LoyaltyPointsRedeemed`, `LoyaltyTierChanged`.
- **Entitlements:** `loyalty.core`.

### `notifications` (dispatch goes live — extends Phase 0) — `backend/src/modules/notifications`
- **Entities (adds):** `NotificationTemplate` (channel, key, version, variables),
  `NotificationDelivery` (notificationId, channel, providerRef, status, failureReason),
  `NotificationPreference` (recipient, channel, purpose).
- **API:**
  - `GET/POST /notifications/templates`, `POST /notifications/templates/:id/version`
  - `GET /notifications/deliveries?from&to`
  - `GET/PATCH /customers/:id/communication-preferences`
- **Channels:** in-app (SSE), email, SMS, WhatsApp, push — all behind
  `NotificationProvider`.
- **Catalog (implemented this phase):** `appointment.booked`, `appointment.reminder_24h`,
  `appointment.reminder_2h`, `appointment.rescheduled`, `appointment.cancelled`,
  `stylist.running_late`, `stylist.absent`, `disruption.options`, `queue.you_are_next`,
  `queue.ready`, `loyalty.points_earned`, `loyalty.reward_available`.
- **Jobs:** `notification-dispatch`, `delivery-status-poll`, `appointment-reminders`
  (scheduled per branch timezone), `frequency-cap-check`.
- **Rules:** transactional notices always send; marketing/promotional respect
  `CommunicationConsent`. Recipient-relevance rules are centralized and mirror the RBAC
  scope logic.
- **Events:** `NotificationQueued`, `NotificationDelivered`, `NotificationFailed`.
- **Entitlements:** `notifications.core`, `notifications.whatsapp`.

### `client-dashboard` — `backend/src/modules/client-dashboard`
- **API:** `GET /dashboard?branchId&range&compare` — today's bookings, walk-ins, no-show
  rate, chair utilization, revenue, average ticket, rebooking rate, each stylist's
  status and utilization, low-cover gaps, unresolved disruptions.
- **Rules:** every KPI returns its definition, comparison value, source path, and last
  refresh.
- **Entitlements:** `dashboard.core`.

---

## `customer` app — first slice this phase

- `app/s/[salonSlug]` → `features/discover/components/SalonPage` — services, stylists,
  each stylist's **live status** and next open slot (read-only, no account needed)
- `app/s/[salonSlug]/book` → `features/booking/components/BookingRequest` — pick stylist
  → service → open slot → submit a **booking request** (staff confirms in the console;
  full self-serve confirmation is Phase 4)
- `app/queue/[branchId]` → `features/queue/components/LiveQueue` — public wait board

Backed by one persistent customer record (`customer-auth` from Phase 0); a request with
no account collects name + phone inline.

## `client` console — screens this phase

- `app/roster` → `features/availability/components/RosterGrid` (+ `ShiftDialog`,
  `TemplateManager`, `TimeOffQueue`)
- `app/calendar` → `features/appointments/components/DayCalendar` (+ `StylistColumn`,
  `AppointmentCard`, `BookDialog`, `RescheduleDialog`, `StandInPicker`)
- `app/front-desk` → `features/appointments/components/FrontDeskBoard`
- `app/queue` → extended `QueueBoard` with per-stylist `WaitLane`
- `app/disruptions` → `features/disruptions/components/DisruptionPanel` (+
  `AffectedList`, `OfferTracker`)
- `app/customers/[id]` → `features/customers/components/CustomerProfile` (+ `Timeline`,
  `PreferencesForm`, `CutRecordList`, `CutRecordForm`, `FormulaList`, `PhotoGallery`,
  `LoyaltyPanel`)
- `app/pos` (extended) — a paid ticket prompts a **cut-record capture** step
- `app/dashboard` → `features/client-dashboard/components/Dashboard`

---

## Realtime & jobs

- **Topics:** `queue:<branchId>`, `stylist-status:<branchId>`, `bookings:<stylistId>`,
  `front-desk:<branchId>`, `disruptions:<branchId>`.
- **BullMQ queues:** `notifications`, `notification-status`, `reminders`,
  `disruption-dispatch`, `roster`, `loyalty`.

## Entitlements introduced

`availability.core`, `appointments.full`, `disruptions.core`, `cutrecords.core`,
`loyalty.core`, `notifications.core`, `notifications.whatsapp`, `dashboard.core`.

## Acceptance

1. A stylist's week is rostered from a template; a time-off request is approved and the
   slots disappear from availability.
2. Staff book a customer into an open slot for a specific stylist; the customer gets a
   confirmation and 24h / 2h reminders on their chosen channel.
3. The stylist marks "running 20 min late"; every affected customer is notified with
   options (wait / next slot / vouched stand-in / cancel) and staff records each choice;
   an unresolved offer escalates to the front desk.
4. Taking a stand-in creates a reassigned appointment that still credits the original
   stylist in the customer's history.
5. The live queue board shows a correct per-stylist "N ahead, ~M min" and updates in
   real time as services start and finish.
6. At checkout the serving stylist records the cut (guards, fade, products, photos); the
   next stylist to serve that customer — including a stand-in — sees the last cut and
   photos.
7. Loyalty points accrue on payment against the configured rule; a manual adjustment is
   permission-gated and audited.
8. The client dashboard's KPIs each show a definition, a comparison value, and reconcile
   to source for the same period.
9. A customer's booking request submitted from the `customer` app appears in the console
   for staff to confirm; one salon never sees another salon's calendar, customers or cut
   records.
