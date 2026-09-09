# Phase 4 — Customer app

## Overview

**What this phase is for.** Ship the full `customer` app — the salon client's own
companion. It answers the two problems Coifyn exists for from the customer's side: book
*a specific stylist* and know exactly what's happening with them (working, on leave,
running late, 2 ahead), and carry your cut record and history with you — including when
your stylist moves shops (**follow-your-stylist**). Everything staff did on the client's
behalf in Phases 2–3 (book, reschedule, resolve a disruption, fill a form, leave
feedback) the customer can now do themselves.

**Depends on.** Phase 2 (availability, appointments, disruptions, cut records,
notifications) and Phase 3 (memberships, packages, gift cards, forms, reviews).

**Primary display.** `customer`.

**Leaves out.** Cross-salon discovery and the offers marketplace (Phase 6 — this phase
is one salon at a time, reached by its link or QR). Operator and AI features.

**Done when.** A customer can register, book a named stylist into a real open slot with
a deposit if required, watch that stylist's live status and their own queue position,
get a running-late alert with choices they resolve themselves, pre-fill an intake form,
see their folio at checkout, leave verified feedback, view a transparent loyalty ledger,
and follow a stylist to a new salon with history intact.

---

## Feature modules

### `customer-portal` — `backend/src/modules/customer-portal`
All endpoints authenticate against `req.customer` (Phase 0 `customer-auth`); a customer
can only ever read or write **their own** records — a client-supplied customer id is
never trusted.

- **API — account & profile:**
  - `GET/PATCH /portal/me`, `GET/PATCH /portal/me/preferences`,
    `GET/PATCH /portal/me/communication-preferences`
  - `POST /portal/me/delete` (deletion / anonymization request; explains retained
    financial records)
- **API — discovery of one salon (no account needed):**
  - `GET /portal/s/:salonSlug` (branches, hours, services, policies)
  - `GET /portal/s/:salonSlug/stylists` — each with live `status`, next open slot,
    portfolio preview, verified rating
  - `GET /portal/stylists/:id` (full profile, portfolio, services, reviews)
- **API — booking:**
  - `GET /portal/stylists/:id/availability?serviceIds&date`
  - `POST /portal/bookings/hold` → `POST /portal/bookings/confirm` (takes a deposit via
    `PaymentProvider` when the service / stylist requires one)
  - `GET /portal/bookings`, `GET /portal/bookings/:id`
  - `POST /portal/bookings/:id/reschedule`, `POST /portal/bookings/:id/cancel`
    (within policy; a late cancel may forfeit the deposit)
  - `POST /portal/waitlist` (join for a full day/stylist), `DELETE /portal/waitlist/:id`
- **API — live status & queue:**
  - `GET /portal/branches/:id/queue` (public board), `POST /portal/queue/join`
  - `GET /portal/queue/:id` (your position, ahead count, ETA) — SSE-backed
- **API — disruptions (self-resolve):**
  - `GET /portal/disruption-offers/:id`, `POST /portal/disruption-offers/:id/resolve`
    (`wait | next_slot | stand_in:<id> | cancel`)
- **API — pre-visit & in-visit:**
  - `GET /portal/bookings/:id/forms`, `POST /portal/forms/:token`
  - `POST /portal/bookings/:id/requests` (special requests, add-ons — subject to
    availability), `GET /portal/bookings/:id/requests`
  - `GET /portal/bookings/:id/folio` (live charges during the visit)
- **API — after the visit:**
  - `GET /portal/bookings/:id/cut-record` (guards, products, verified photos of your
    own last cut)
  - `POST /portal/bookings/:id/photos` (submit a post-visit photo → becomes a
    **verified** trust signal once approved)
  - `POST /portal/feedback/:token` (rating + text; private complaint kept separate from
    a public testimonial; consent asked before any testimonial goes public)
- **API — wallet & loyalty:**
  - `GET /portal/wallet` (memberships, packages, gift cards, saved cards)
  - `GET /portal/loyalty`, `GET /portal/loyalty/ledger` (every earn / redeem / expire)
  - `POST /portal/memberships/:id/subscribe`, `POST /portal/subscriptions/:id/cancel`
- **Events:** `PortalBookingCreated`, `PortalBookingCancelled`,
  `PortalDisruptionResolved`, `PortalFormSubmitted`, `PortalPhotoSubmitted`,
  `PortalFeedbackSubmitted`, `CustomerDeletionRequested`.
- **Realtime:** the customer opens `GET /api/v1/portal/realtime/stream` — topics
  `queue-position:<queueEntryId>`, `stylist-status:<stylistId>` (only stylists they
  have an upcoming booking with or are queued for), `booking:<bookingId>`.
- **Entitlements:** `customerportal.core` (per salon — the operator can gate the whole
  app for a salon that hasn't bought it).

### `follow-your-stylist` — `backend/src/modules/follow`
- **Entities:** `StylistFollow` (customerId, stylistUserId, since), `StylistMove`
  (stylistUserId, fromSalonId?, toSalonId, effectiveAt, isPublic) —
  recorded when a stylist's `User` gains a `StylistProfile` at a new salon.
- **API:**
  - `POST /portal/stylists/:id/follow`, `DELETE /portal/stylists/:id/follow`
  - `GET /portal/following` — each followed stylist's current salon, status, next slot
  - `GET /portal/following/moves` — "Ali now cuts at Fade Room, Gulberg — book him there"
- **Rules:** when a followed stylist moves, the customer's **cut records and history for
  that stylist** are made visible to that stylist at the new salon (with the customer's
  one-tap consent), and a notification offers a booking at the new shop. The old salon's
  other data does not travel. Portfolio and rating are the stylist's, so they move with
  the person.
- **Events:** `StylistFollowed`, `StylistMoved`, `FollowedStylistBookingOffered`,
  `CutHistoryPortabilityConsented`.
- **Entitlements:** `follow.core`.

### `match-my-usual` — `backend/src/modules/match` (customer-side; marketplace ranking is Phase 6)
- **Entities:** `CutProfile` (customerId, derived from cut records + explicit prefs:
  guards, fade type, length, style tags, products, sensitivities) — one per customer,
  portable across salons.
- **API:**
  - `GET/PATCH /portal/cut-profile`
  - `POST /portal/bookings/:id/apply-cut-profile` (hands the serving stylist — often a
    new one — the customer's spec before the appointment)
- **Events:** `CutProfileUpdated`.
- **Entitlements:** `match.core`.

---

## `customer` app — screens

Thin `app/` routes → one feature component each; small child components; one file per
API call.

- `app/(auth)/{login,register,verify,reset}` → `features/auth/components/*`
- `app/s/[salonSlug]` → `features/discover/components/SalonPage` (+ `StylistCard` with
  `LiveStatusDot`, `NextSlotChip`, `PortfolioStrip`)
- `app/stylists/[id]` → `features/stylist/components/StylistProfile` (+ `PortfolioGrid`,
  `ServiceList`, `ReviewList`, `BookCta`)
- `app/book/[stylistId]` → `features/booking/components/BookingFlow` (+ `ServiceStep`,
  `SlotPicker`, `DepositStep`, `ConfirmStep`, `HoldTimer`)
- `app/bookings` → `features/bookings/components/BookingList` (+ `BookingCard`,
  `RescheduleSheet`, `CancelDialog`)
- `app/bookings/[id]` → `features/bookings/components/BookingDetail` (+ `FolioSummary`,
  `RequestList`, `FormPrompt`, `CutRecordView`, `DisruptionOfferCard`)
- `app/queue/[entryId]` → `features/queue/components/MyQueuePosition` (SSE)
- `app/following` → `features/follow/components/FollowingList` (+ `MoveBanner`)
- `app/wallet` → `features/wallet/components/Wallet` (+ `MembershipCard`, `PackageCard`,
  `GiftCardCard`, `LoyaltyLedger`)
- `app/profile` → `features/profile/components/{ProfileForm,CutProfileForm,
  CommunicationPreferences,PrivacyControls}`
- `app/feedback/[token]` → `features/feedback/components/FeedbackForm`

---

## Customer protection & experience rules

- Never show a slot or confirm a booking the operational core has not accepted.
- One preference centre for channel + purpose; marketing is opt-in and never overrides a
  legitimate operational notice.
- Private complaint is always separate from a public testimonial; the customer gets a
  receipt for the complaint and a visible resolution path.
- Passwords argon2-hashed; verification/reset tokens short-lived and single-use; TLS;
  tokenised/hosted payments only — no raw card data.
- Responsive mobile-first; WCAG 2.2 AA target; salon-local currency, timezone, language.

## Realtime & jobs

- **Customer SSE topics:** `queue-position:<entryId>`, `stylist-status:<stylistId>`,
  `booking:<bookingId>`, `disruption-offer:<offerId>`.
- **BullMQ (adds):** `portal-photo-moderation`, `follow-offers`.

## Entitlements introduced

`customerportal.core`, `follow.core`, `match.core`.

## Acceptance

1. A customer registers, verifies, and books a named stylist into a real open slot; a
   deposit is taken where required and a confirmation + reminders arrive.
2. The customer opens their booking and sees the stylist's live status; when the stylist
   marks "running late" the customer gets options and resolves it themselves (waits,
   takes the next slot, or takes a vouched stand-in) with no staff involvement.
3. Queued for a walk-in, the customer watches their position and ETA update live.
4. The customer pre-fills a required intake form from a link without a second login; it
   attaches to the booking and unblocks the service.
5. During the visit the customer sees their folio update; after, they see their own cut
   record with verified photos and submit a post-visit photo that becomes a verified
   trust signal after moderation.
6. The customer follows a stylist; when that stylist moves salons, the customer is
   notified, consents in one tap to carry their cut history, and books the stylist at
   the new shop with the spec already attached.
7. The loyalty ledger shows every earn, redeem and expiry and reconciles to the balance.
8. A customer can only ever access their own bookings, folio, cut records and wallet;
   forging another customer's id is refused.
