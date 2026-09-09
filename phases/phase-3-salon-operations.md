# Phase 3 — Complete salon operations

## Overview

**What this phase is for.** Everything a salon needs to run the *business* around the
chair, not just the appointment: retail and backbar stock, product usage per service,
memberships and packages and gift cards, staff pay (commission, tips, chair rental,
payroll export), consultation forms and consent, reviews and reputation, and a marketing
engine. After this phase the `client` console is a complete operating system for a
single- or multi-branch salon.

**Depends on.** Phase 2 (appointments, customers, loyalty, notifications, dashboard).

**Primary display.** `client` (salon console).

**Leaves out.** The customer app (Phase 4), the operator/billing console (Phase 5), the
marketplace (Phase 6), AI (Phase 7). Marketing here is the salon messaging *its own*
clients — the public discovery channel is Phase 6.

**Done when.** Stock deducts automatically as services are performed and low-stock
reorders are raised; a client can buy a membership that bills monthly and unlocks member
pricing; a stylist's pay run reconciles commission + tips + product bonus − chair rent;
an intake form with e-signature attaches to the client record; and a win-back campaign
sends to a consented segment with delivery tracking.

---

## Feature modules

### `inventory` — `backend/src/modules/inventory`
- **Entities:**
  - `Product` (name, brand, sku, barcode, kind: `retail|backbar|both`,
    retailPriceMinor?, costMinor, unit, sizeMl?, reorderLevel, isActive)
  - `StockLocation` (branchId, name), `StockLevel` (productId, locationId, onHand)
  - `StockMovement` (productId, locationId, deltaQty, reason: `sale|usage|receipt|count|
    wastage|transfer|adjustment`, sourceType, sourceId, actorId) — immutable
  - `ServiceConsumption` (serviceId, productId, qtyPerService) — the "recipe"
  - `StockCount` + `StockCountLine`, `WastageEntry` (reason, qty, costMinor),
    `StockTransfer` (from, to, lines)
- **API:**
  - `GET /products`, `POST /products`, `PATCH /products/:id`, `GET /products/:id/stock`
  - `GET /inventory/movements?productId&from&to`
  - `POST /inventory/receipts` (receive stock), `POST /inventory/counts`,
    `POST /inventory/counts/:id/submit` (variance → adjustments)
  - `POST /inventory/wastage`, `POST /inventory/transfers`
  - `GET /inventory/reorder-suggestions`
  - `GET/PUT /services/:id/consumption`
- **Jobs:** `service-consumption-deduction` (on `AppointmentCompleted` / `TicketPaid`,
  post negative `StockMovement`s from the recipe), `low-stock-watch`.
- **Events:** `StockReceived`, `StockDeducted`, `StockLow`, `StockCounted`,
  `WastageRecorded`.
- **Entitlements:** `inventory.core`.

### `retail` — selling products on a ticket — `backend/src/modules/retail`
- **Entities (extends `tickets`):** `TicketLine.kind` gains `retail`; `RetailSale` view
  over paid retail lines.
- **API:** `POST /tickets/:id/lines` accepts `{kind: "retail", productId, qty}`;
  `GET /reports/retail?from&to` (units, revenue, attach rate, per-stylist retail).
- **Rules:** a retail sale posts a `sale` `StockMovement`; overselling below zero is
  blocked unless `inventory:oversell` is held.
- **Events:** `RetailItemSold`.

### `memberships-packages` — `backend/src/modules/memberships`
- **Entities:**
  - `Package` (name, serviceIds[] + qty, priceMinor, validityDays) — prepaid series
  - `PackagePurchase` (customerId, packageId, remaining jsonb, expiresAt)
  - `Membership` (name, priceMinor, interval: `monthly|yearly`, benefits jsonb:
    included services, member % off retail/services, priority booking)
  - `MembershipSubscription` (customerId, membershipId, status: `active|past_due|
    paused|cancelled`, currentPeriodEnd, providerRef)
  - `MembershipBenefitUsage` (subscriptionId, benefit, period, usedQty)
- **API:**
  - `GET/POST /packages`, `POST /customers/:id/packages` (sell), redemption happens on
    a ticket line (`{kind: "service", packagePurchaseId}`)
  - `GET/POST /memberships`, `POST /customers/:id/membership` (subscribe → Stripe),
    `POST /subscriptions/:id/pause|resume|cancel`
  - `GET /customers/:id/wallet` (packages, membership, gift cards, loyalty in one view)
- **Jobs:** `membership-billing` (recurring charge via `PaymentProvider`),
  `membership-dunning`, `package-expiry-reminder`.
- **Events:** `PackageSold`, `PackageRedeemed`, `MembershipSubscribed`,
  `MembershipRenewed`, `MembershipPastDue`, `MembershipCancelled`.
- **Entitlements:** `memberships.core`, `packages.core`.

### `gift-cards` — `backend/src/modules/gift-cards`
- **Entities:** `GiftCard` (code, initialMinor, balanceMinor, status, expiresAt,
  design), `GiftCardTransaction` (immutable: issue / redeem / reload / refund).
- **API:** `POST /gift-cards` (sell), `GET /gift-cards/:code`,
  `POST /gift-cards/:code/redeem` (on a ticket), `POST /gift-cards/:code/reload`.
- **Events:** `GiftCardIssued`, `GiftCardRedeemed`, `GiftCardReloaded`.
- **Entitlements:** `giftcards.core`.

### `staff-pay` — commission, tips, chair rental, payroll — `backend/src/modules/staff-pay`
- **Entities:**
  - `CompensationPlan` (stylistId, model: `commission|hourly|salary|chair_rent|hybrid`,
    commissionTiers jsonb (service vs retail, sliding by revenue), hourlyRateMinor?,
    chairRentMinor?, rentInterval?)
  - `TipEntry` (ticketId, stylistId, amountMinor, method), `TipPool` + `TipPoolShare`
  - `PayPeriod` (branchId, from, to, status: `open|calculated|approved|paid`)
  - `PayStatement` (payPeriodId, stylistId, lines jsonb: commission, retail bonus, tips,
    hourly, − chair rent, − deductions; grossMinor, netMinor)
  - `ChairRentInvoice` (stylistId, period, amountMinor, status) — for booth renters
- **API:**
  - `GET/PUT /stylists/:id/compensation`
  - `POST /tips`, `POST /tip-pools`, `POST /tip-pools/:id/distribute`
  - `GET/POST /pay-periods`, `POST /pay-periods/:id/calculate`,
    `POST /pay-periods/:id/approve`
  - `GET /pay-periods/:id/statements`, `GET /stylists/:id/pay-statements`
  - `GET /pay-periods/:id/export?format=csv` (to Gusto / accountant)
  - `GET /chair-rent/invoices`, `POST /chair-rent/invoices/:id/mark-paid`
- **Rules:** a pay statement must reconcile line-for-line to the tickets, tips and
  rental agreements in its period; recalculation after approval is blocked (a correction
  is a new adjustment line, audited).
- **Events:** `TipRecorded`, `TipsDistributed`, `PayPeriodCalculated`,
  `PayPeriodApproved`, `ChairRentInvoiced`.
- **Entitlements:** `staffpay.commission`, `staffpay.payroll`, `staffpay.chairrent`.

### `forms` — consultation, intake, consent — `backend/src/modules/forms`
- **Entities:** `FormTemplate` (name, trigger: `on_booking|pre_visit|post_visit|
  manual`, serviceIds[]?, fields jsonb with conditional logic, version),
  `FormSubmission` (templateId, customerId, appointmentId?, answers jsonb, signatureKey?,
  submittedAt).
- **API:**
  - `GET/POST /form-templates`, `POST /form-templates/:id/version`
  - `POST /appointments/:id/forms/send`, `GET /customers/:id/form-submissions`
  - `POST /portal/forms/:token` (customer fills a sent form — no login)
- **Rules:** a form marked required for a service blocks starting that service until
  submitted; submissions are immutable and attach to the customer + appointment.
- **Events:** `FormSent`, `FormSubmitted`, `ConsentCaptured`.
- **Entitlements:** `forms.core`.

### `reviews` — reputation — `backend/src/modules/reviews`
- **Entities:** `ReviewRequest` (appointmentId, customerId, sentAt, channel),
  `Review` (appointmentId, stylistId, rating 1–5, text, photos[], visibility:
  `private|public_pending|public|rejected`, isVerified), `ReviewResponse` (staff reply,
  approvedBy), `ServiceRecoveryCase` (reviewId, owner, status, actions, resolution).
- **API:**
  - `GET /reviews?stylistId&rating&from&to`, `POST /reviews/:id/respond`,
    `POST /reviews/:id/publish|reject`
  - `POST /reviews/:id/recovery-case`, `PATCH /recovery-cases/:id`
  - `GET /portal/feedback/:token` (customer submits — rating + text + optional photos),
    private complaint kept separate from a public testimonial
- **Rules:** a review is `isVerified` only if tied to a completed appointment; the salon
  can respond and can request publication of a private review but cannot edit its text
  or fabricate one. Per-**stylist** rating, never a shop average.
- **Events:** `ReviewRequested`, `ReviewSubmitted`, `ReviewPublished`,
  `RecoveryCaseOpened`.
- **Entitlements:** `reviews.core`.

### `marketing` — salon → its own clients — `backend/src/modules/marketing`
- **Entities:** `Segment` (rule: last visit, spend, service history, stylist, tier,
  no-show count, consent), `Campaign` (channel, template, segmentId, schedule, status:
  `draft|approved|scheduled|sending|sent`, approvalBy), `CampaignDelivery`,
  `AutomationFlow` (trigger: `first_visit|lapsed_45d|birthday|post_visit|
  membership_lapsed`, delay, template, active).
- **API:**
  - `GET/POST /segments`, `GET /segments/:id/preview` (count + sample)
  - `GET/POST /campaigns`, `POST /campaigns/:id/approve`, `POST /campaigns/:id/schedule`
  - `GET /campaigns/:id/results` (sent, delivered, opened, bookings attributed)
  - `GET/POST /automation-flows`, `POST /automation-flows/:id/toggle`
- **Rules:** every bulk send passes a consent + frequency-cap + approval gate; results
  attribute a booking to a campaign only when it can be measured honestly (link click or
  code). No fake urgency, no messaging a non-consented client.
- **Jobs:** `campaign-send`, `automation-tick`, `segment-materialize`.
- **Events:** `CampaignApproved`, `CampaignSent`, `AutomationTriggered`.
- **Entitlements:** `marketing.core`, `marketing.automation`.

### `client-dashboard` (extends Phase 2)
- Adds: stock value, low-stock count, retail attach rate, membership MRR and churn,
  outstanding gift-card liability, pay-run status, review rating trend, campaign
  performance, service-recovery backlog.

---

## `client` console — screens this phase

- `app/inventory` → `features/inventory/components/{ProductList,StockView,ReceiveStock,
  CountSheet,ReorderSuggestions,ConsumptionMatrix}`
- `app/products` (retail on the POS ticket — `RetailPicker`)
- `app/memberships` → `features/memberships/components/{PlanList,PackageBuilder,
  SubscriberList,WalletView}`
- `app/gift-cards` → `features/gift-cards/components/{IssueCard,LookupCard}`
- `app/pay` → `features/staff-pay/components/{CompensationForm,TipEntry,PayPeriodList,
  PayStatementView,ChairRentList,PayrollExport}`
- `app/forms` → `features/forms/components/{TemplateBuilder,FieldEditor,SubmissionList}`
- `app/reviews` → `features/reviews/components/{ReviewInbox,ReviewCard,ResponseEditor,
  RecoveryBoard}`
- `app/marketing` → `features/marketing/components/{SegmentBuilder,CampaignComposer,
  CampaignResults,FlowList}`

Each split into small single-purpose components; each API call its own file.

---

## Realtime & jobs

- **BullMQ queues (adds):** `inventory`, `membership-billing`, `staff-pay`,
  `campaign-send`, `automation`, `review-requests`.
- **Scheduled:** membership billing, dunning, package expiry, automation tick, campaign
  schedules, review requests after completed appointments.

## Entitlements introduced

`inventory.core`, `memberships.core`, `packages.core`, `giftcards.core`,
`staffpay.commission`, `staffpay.payroll`, `staffpay.chairrent`, `forms.core`,
`reviews.core`, `marketing.core`, `marketing.automation`.

## Acceptance

1. A service with a defined product recipe deducts backbar stock automatically on
   completion; a low-stock item appears in reorder suggestions.
2. A retail product is sold on a ticket, stock drops, and it shows in the per-stylist
   retail report.
3. A client buys a package; redeeming a service on a later ticket decrements the
   remaining count and never charges again.
4. A client subscribes to a monthly membership; it bills automatically, unlocks member
   pricing on the next ticket, and a failed charge moves it to past-due with dunning.
5. A gift card is sold, partially redeemed on a ticket, and its balance is correct.
6. A pay period calculates commission + retail bonus + tips − chair rent per stylist,
   reconciles to the period's tickets, and exports to CSV after approval.
7. A required consultation form with an e-signature is sent, filled by the customer
   without logging in, and attaches to their record; the service cannot be started until
   it is submitted.
8. A verified review is left for a specific stylist, the salon responds, and a low
   rating opens a service-recovery case.
9. A win-back campaign to a consented "lapsed 45 days" segment sends, tracks delivery,
   and attributes the resulting bookings; a non-consented client is excluded.
10. All new dashboard KPIs reconcile to source for the same period; one salon's stock,
    pay, memberships and campaigns are never visible to another.
