# Phase 1 — Salon core

## Overview

**What this phase is for.** Prove one real salon or barbershop can complete a normal day
accurately from the `client` console: set up the shop and its chairs, build the service
menu, add stylists with roles, run the walk-in queue, take a ticket at the front desk,
charge cash or card, print a receipt, and read an owner's day report. A customer record
is created for every paying client.

**Depends on.** Phase 0 (auth, tenancy, RBAC, events, audit, realtime, providers).

**Primary display.** `client` (salon console). No customer-facing surface yet.

**Leaves out.** Online booking and per-stylist calendars (Phase 2), inventory and
memberships and payroll (Phase 3), the customer app (Phase 4), the operator console
(Phase 5), the marketplace (Phase 6). Payments are cash + a single card terminal;
appointments are staff-entered only.

**Done when.** A stylist can be added, a walk-in queued and assigned to a chair, a
ticket built with services and modifiers, payment taken, a receipt issued, and the sale
appears in the owner's report — with every sensitive action (void, discount) permission-
gated and audit-logged.

---

## Feature modules

### `salon-setup` — `backend/src/modules/salon-setup`
- **Entities:** extends `SalonOrganization` / `Branch` / `Chair` from Phase 0 with
  `BranchHours` (per weekday open/close, breaks), `BranchClosure` (holiday / one-off),
  `TaxRate` (name, percent, inclusive bool).
- **API:**
  - `GET/PATCH /salon` (brand, currency, timezone, tax profile)
  - `GET/POST /branches`, `GET/PATCH /branches/:id`, `PATCH /branches/:id/hours`
  - `GET/POST /branches/:id/chairs`, `PATCH /chairs/:id` (label, active/retired)
- **Events:** `BranchHoursUpdated`, `ChairRetired`.
- **Entitlements:** `salon.core`.

### `services` — `backend/src/modules/services`
- **Entities:** `ServiceCategory` (name, order), `Service` (name, description,
  categoryId, basePriceMinor, baseDurationMin, taxRateId, isBookable, isActive),
  `ServiceAddOn` (name, priceMinor, durationMin), `ServiceAddOnLink` (serviceId,
  addOnId).
- **API:**
  - `GET /services`, `GET /services/:id`, `POST /services`, `PATCH /services/:id`,
    `DELETE /services/:id`
  - `POST /services/:id/active` (activate / deactivate)
  - `GET/POST/PATCH /service-categories`
  - `GET/POST/PATCH /service-add-ons`
- **Events:** `ServiceCreated`, `ServiceUpdated`, `ServiceDeactivated`.
- **Entitlements:** `services.core`.

### `stylists` — `backend/src/modules/stylists`
- **Entities:**
  - `StylistProfile` (userId, branchId home, displayName, bio, avatarUrl, specialties[],
    status: `available|working|busy|on_break|off_shift|on_leave`, isBookable,
    startedAt) — the **separate profile per barber** the salon manages.
  - `StylistService` (stylistId, serviceId, priceOverrideMinor?, durationOverrideMin?,
    canPerform bool) — per-stylist pricing and duration.
  - `StylistStatusHistory` (stylistId, status, changedBy, at) — immutable.
- **API:**
  - `GET /stylists`, `GET /stylists/:id`, `POST /stylists`, `PATCH /stylists/:id`
  - `POST /stylists/:id/status` (set live status; reason optional; audited)
  - `GET/PUT /stylists/:id/services` (which services, at what price/duration)
  - `POST /stylists/:id/roles` (assign a Role / custom role to the stylist's `User`)
- **Rules:** setting a stylist to `on_leave` or `off_shift` while they hold future
  bookings surfaces those bookings in the response (no auto-cancel in Phase 1).
- **Events:** `StylistProfileCreated`, `StylistStatusChanged`, `StylistServiceUpdated`.
- **Realtime:** `StylistStatusChanged` → topic `stylist-status:<branchId>`.
- **Entitlements:** `stylists.core`.

### `staff` — `backend/src/modules/staff`
- **Entities:** `StaffInvite` (email, roleId, branchIds[], token, expiresAt, status).
- **API:**
  - `POST /staff/invites`, `GET /staff/invites`, `POST /staff/invites/:id/revoke`
  - `GET /staff/invites/:token` (public resolve), `POST /staff/invites/:token/accept`
  - `GET /staff`, `PATCH /staff/:userId` (role, branch memberships, active)
- **Rules:** a salon must always keep at least one Owner; the last Owner cannot be
  demoted or removed.
- **Events:** `StaffInvited`, `StaffJoined`, `StaffRoleChanged`, `StaffDeactivated`.
- **Entitlements:** `staff.core`.

### `roles` — salon-defined access levels — `backend/src/modules/rbac` (extends Phase 0)
- **API:**
  - `GET /roles` (standard + custom), `POST /roles` (name + permission subset + scope),
    `PATCH /roles/:id`, `DELETE /roles/:id`
  - `GET /permissions` (the catalog, grouped)
  - `POST /members/:userId/role`
- **Rules:** standard roles cannot be deleted; Owner's permission set cannot be edited.
  A custom role is built from the same catalog as the standard ones, at `org` or
  `branch` scope per permission.
- **Events:** `RoleCreated`, `RoleUpdated`, `RoleDeleted`, `RoleAssigned`.

### `queue` — walk-in line — `backend/src/modules/queue`
- **Entities:** `QueueEntry` (branchId, customerRef?, walkInName?, requestedStylistId?,
  requestedServiceIds[], status: `waiting|assigned|in_service|done|left`, joinedAt,
  assignedStylistId?, assignedChairId?, calledAt?, position derived).
- **API:**
  - `GET /queue?branchId` (live, ordered), `POST /queue` (join: name + service +
    optional requested stylist)
  - `POST /queue/:id/assign` (to a stylist + chair), `POST /queue/:id/start`,
    `POST /queue/:id/complete`, `POST /queue/:id/remove` (left / no-show, reason)
  - `GET /queue/:id/wait-estimate` (ahead count + minutes from service durations)
- **Realtime:** every mutation → topic `queue:<branchId>`.
- **Events:** `QueueJoined`, `QueueAssigned`, `QueueServiceStarted`, `QueueCompleted`,
  `QueueLeft`.
- **Entitlements:** `queue.core`.

### `appointments` (minimal — full scheduling in Phase 2) — `backend/src/modules/appointments`
- **Entities:** `Appointment` (branchId, stylistId, chairId?, customerRef, serviceIds[],
  addOnIds[], startAt, endAt, status: `booked|arrived|in_service|completed|no_show|
  cancelled`, source: `front_desk`, notes).
- **API:**
  - `GET /appointments?branchId&date`, `POST /appointments` (staff-entered),
    `GET/PATCH /appointments/:id`
  - `POST /appointments/:id/arrive|start|complete|no-show|cancel`
- **Rules:** a stylist/chair cannot hold two overlapping active appointments — the
  second write is refused; an authorized override needs a reason + audit entry.
- **Events:** `AppointmentBooked`, `AppointmentArrived`, `AppointmentCompleted`,
  `AppointmentNoShow`, `AppointmentCancelled`.
- **Realtime:** topic `bookings:<stylistId>`.
- **Entitlements:** `appointments.core`.

### `tickets` (POS) — `backend/src/modules/tickets`
- **Entities:**
  - `RegisterSession` (branchId, openedBy, openingFloatMinor, closingCountMinor?,
    varianceMinor?, openedAt, closedAt?)
  - `Ticket` (branchId, source: `queue|appointment|walk_in`, sourceId?, customerRef?,
    status: `open|paid|voided`, subtotalMinor, discountMinor, taxMinor, totalMinor)
  - `TicketLine` (ticketId, kind: `service|add_on`, refId, stylistId, description,
    qty, unitPriceMinor, lineTotalMinor)
  - `TicketDiscount` (ticketId, type: `percent|amount`, value, reason, approvedBy)
- **API:**
  - `POST /register-sessions`, `POST /register-sessions/:id/close`,
    `GET /register-sessions/current`
  - `POST /tickets`, `GET /tickets`, `GET /tickets/:id`
  - `POST /tickets/:id/lines`, `PATCH /tickets/:id/lines/:lineId`,
    `DELETE /tickets/:id/lines/:lineId`
  - `POST /tickets/:id/discount` (permission + reason)
  - `POST /tickets/:id/void` (permission + reason)
- **Events:** `TicketOpened`, `TicketLineAdded`, `DiscountApplied`, `TicketVoided`.
- **Entitlements:** `pos.core`.

### `payments` (cash + one card terminal) — `backend/src/modules/payments`
- **Entities:** `Payment` (ticketId, method: `cash|card`, amountMinor, status,
  providerRef?, takenBy), `Refund` (paymentId, amountMinor, reason, approvedBy),
  `Receipt` (ticketId, number, issuedAt, format).
- **API:**
  - `POST /payments` (settle a ticket), `POST /payments/:id/refund` (permission + reason)
  - `GET /payments`, `GET /payments/:id`, `GET /tickets/:id/receipt`
- **Rules:** the card path uses the tokenized/hosted `PaymentProvider` adapter; no raw
  PAN is stored. A ticket is `paid` only when payments cover the total.
- **Events:** `PaymentCompleted`, `PaymentFailed`, `RefundIssued`, `ReceiptGenerated`.
- **Entitlements:** `payments.core`.

### `customers` (minimal record) — `backend/src/modules/customers`
- **Entities:** `Customer` (salonId, name, phone, email?, notes, firstSeenAt,
  lastVisitAt, visitCount, totalSpendMinor).
- **API:** `GET /customers`, `POST /customers`, `GET /customers/:id`,
  `PATCH /customers/:id`, `GET /customers/:id/visits`.
- **Rules:** a paying ticket with a linked customer updates `lastVisitAt`, `visitCount`,
  `totalSpendMinor` in the same transaction as the payment.
- **Events:** `CustomerCreated`, `CustomerVisitRecorded`.
- **Entitlements:** `customers.core`.

### `reports` (owner basics) — `backend/src/modules/reports`
- **API (read-optimized):**
  - `GET /reports/day?branchId&date` (gross, net, tax, discounts, voids, refunds,
    ticket count, average ticket, walk-ins vs appointments)
  - `GET /reports/sales/by-service?from&to`
  - `GET /reports/sales/by-stylist?from&to` (revenue, ticket count, service count)
  - `GET /reports/register-session/:id` (opening float, expected, counted, variance)
- **Rules:** every total must reconcile to source records for the same filter/period.
- **Entitlements:** `reports.core`.

---

## `client` console — screens this phase

Thin `app/` routes, each rendering one feature component:

- `app/(auth)/login` → `features/auth/components/LoginPage`
- `app/setup/*` → branch, hours, chairs, tax (`features/salon-setup/components/*`)
- `app/services` → `features/services/components/ServiceMenu` (+ `ServiceForm`,
  `CategoryList`, `AddOnList`)
- `app/team` → `features/staff/components/StaffList` (+ `InviteForm`, `RoleManager`,
  `RoleForm`, `PermissionPicker`)
- `app/stylists` → `features/stylists/components/StylistList` (+ `StylistProfileForm`,
  `StylistServiceMatrix`, `StatusToggle`)
- `app/queue` → `features/queue/components/QueueBoard` (+ `QueueEntryCard`,
  `JoinQueueForm`, `AssignDialog`, `WaitEstimate`) — live via `queue:<branchId>`
- `app/pos` → `features/tickets/components/Register` (+ `TicketPanel`, `LineItem`,
  `ServicePicker`, `DiscountDialog`, `PaymentDialog`, `ReceiptView`)
- `app/reports` → `features/reports/components/DayReport` (+ `SalesByStylist`,
  `SalesByService`)

Every large component is split into small single-purpose children in the same folder;
every API call is its own file under `lib/api/<domain>/`.

---

## Realtime & jobs

- **Realtime topics:** `queue:<branchId>`, `stylist-status:<branchId>`,
  `bookings:<stylistId>`.
- **BullMQ queues:** `events` (outbox relay), `notifications` (stub — real dispatch in
  Phase 2).
- **Tests:** Vitest + supertest + Testcontainers for the ticket → payment → receipt →
  report flow; Playwright for the walk-in → queue → assign → POS → pay → receipt journey.

## Entitlements introduced

`salon.core`, `services.core`, `stylists.core`, `staff.core`, `queue.core`,
`appointments.core`, `pos.core`, `payments.core`, `customers.core`, `reports.core`.

## Acceptance

1. An owner sets up one branch, its hours, its chairs, and a tax rate.
2. Stylists are added with per-stylist service pricing; a Stylist role cannot open the
   roles screen, and the salon can create a "Senior Stylist" custom role and assign it.
3. RBAC blocks a Front Desk user from issuing a refund without permission; granting the
   permission (via a custom role) lets it through.
4. A walk-in joins the queue, gets a live wait estimate, is assigned to a stylist and
   chair, and the board updates in real time on every open device.
5. A ticket is built from the queue entry with services + add-ons + a per-stylist price,
   a discount is applied with a reason, payment is taken (cash and card), and a receipt
   is issued.
6. Voids, discounts and refunds require permission and appear in the audit log with
   reason and actor.
7. A `Customer` is created at checkout and their visit count / spend update atomically
   with the payment.
8. The day report's gross, net, tax, discount, void and refund totals reconcile exactly
   to the underlying tickets and payments for the same date.
9. One salon cannot read another salon's services, stylists, tickets, customers or
   reports.
