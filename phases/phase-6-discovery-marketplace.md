# Phase 6 — Coifyn Discover (the marketplace)

## Overview

**What this phase is for.** Build the `marketNetwork` app — the operator-run consumer
marketplace in front of salon brands and, crucially, in front of **individual
stylists**. It solves Coifyn's second problem ("new city, can't find the right salon"):
search by the *result* you want, not the shop; portfolio-first stylist profiles where
the verified work *is* the listing; a permanent offers hub every salon can use; premium
placement that is always labelled; and **closed-loop attribution** that ties a
marketplace impression back to a real completed booking in the salon's dashboard.

**Depends on.** Phases 1–5 — real stylists, portfolios, reviews, bookings, and the
operator entitlement + billing engine.

**Primary displays.** `marketNetwork` (public consumer + brand-growth side), `management`
(moderation, placement, marketplace analytics).

**Infra added.** **Typesense** for search/faceting (indexed from the event log, never
off the OLTP primary); aggressive **Cloudflare** edge caching on public profile / offer /
home pages; **Kafka** is likely on by now (attribution rollups + search indexing +
webhook fan-out). This is where the "millions of users" load lives — read-heavy,
cacheable, isolated from the operational core.

**Leaves out.** AI ranking and campaign suggestions (Phase 7). Everything customer-
facing here is discovery and booking hand-off; the booking itself runs through the
Phase 4 `customer-portal` flow.

**Done when.** A stylist's verified portfolio appears in a "skin fade near me" search
ranked by genuine match quality; a free-tier salon publishes a real offer that shows in
Highlights then moves to the permanent Offers Hub; a premium salon's sponsored card is
clearly labelled and never outranks a better match; and a QR-redeemed offer is matched
to a completed booking and shown as attributed revenue with the attribution method
named.

---

## Feature modules

### `discover-profiles` — `backend/src/modules/discover-profiles`
- **Entities:**
  - `SalonProfile` (salonId, slug, name, logo, cover, description, verifiedBadge,
    location, hours, contact, socialLinks, categories, status: `draft|pending|approved|
    rejected|suspended`)
  - `StylistPublicProfile` (stylistUserId, slug, displayName, headline, bio, home salon,
    specialties, `portableRating`, `portableReviewCount`, status) — **the stylist, not
    the shop, is the listing**; it survives a `StylistMove` (Phase 4)
  - `PortfolioItem` (ownerType: `stylist`, ownerId, objectKey, serviceTags[],
    resultTags[] e.g. `skin_fade|balayage|beard_sculpt`, isVerified, sourceBookingId?)
  - `ProfileApproval` (reviewer, decision, reason)
- **API:**
  - brand side: `GET/PATCH /discover/salon`, `POST /discover/salon/submit`,
    `GET/PATCH /discover/stylists/:id/public-profile`,
    `POST /discover/portfolio` (from a verified cut-record photo or an upload)
  - operator: `GET /operator/discover/profiles`,
    `POST /operator/discover/profiles/:id/approve|reject|suspend`
  - public: `GET /d/salon/:slug`, `GET /d/stylist/:slug`, `GET /d/categories`
- **Rules:** nothing public goes live until it passes configured validation/approval.
  A portfolio item is `isVerified` when it comes from a completed booking's verified
  photo. Per-stylist trust signals only — never a shop star average on a stylist card.
- **Events:** `ProfileSubmitted`, `ProfileApproved`, `PortfolioItemPublished`.
- **Entitlements:** `discover.profile` (free/included), `discover.growth`,
  `discover.premium`, `discover.enterprise`.

### `discover-search` — search by result — `backend/src/modules/discover-search`
- **Infra:** `SearchIndex` provider flips to `TypesenseProvider`; indexed documents are
  stylist profiles + their portfolio result-tags + live availability summary + location.
  Fed from the event log (`PortfolioItemPublished`, `ShiftPublished`, `ReviewPublished`,
  `StylistMoved`, …) — never a query against the OLTP primary.
- **API (public):**
  - `GET /d/search?result=&location=&radius=&date=&priceBand=&openNow=&rating=` —
    "who near me actually delivers a skin fade", ranked
  - `GET /d/search/suggest?q=` (result + category typeahead)
  - `GET /d/stylist/:slug/availability` (next open slots, pulled live with permission)
- **Ranking config** (`RankingConfig`, operator-editable): weights for result-match
  quality, portfolio verification depth, distance, availability, rating, profile
  completeness, customer preference, and — only where applicable — premium eligibility.
  **A sponsored card never outranks a materially better match.**
- **Events:** `DiscoverSearchPerformed`.
- **Jobs:** `search-reindex` (consumes the event log), `availability-summary-refresh`.

### `match-my-usual` (marketplace ranking — extends Phase 4) — `backend/src/modules/match`
- **API:** `GET /d/match?cutProfileId=&location=` — ranks nearby stylists by how well
  their verified work matches the customer's portable `CutProfile` (guards, fade type,
  length, style tags), so a customer in a new city gets "these three do your cut well".
- **Rules:** match score is explained on each result (which tags matched, verification
  depth). No fabricated "X% match" without the underlying signals.
- **Events:** `MatchSearchPerformed`.
- **Entitlements:** `match.core` (customer side, from Phase 4).

### `offers-hub` — `backend/src/modules/offers-hub`
- **Entities:** `Offer` (ownerType: `salon|stylist`, ownerId, type: `seasonal|new|
  regular|premium_campaign`, title, benefit, startAt, endAt, exclusions,
  redemptionMethod: `code|qr|booking_linked|pos`, stockLimit, status),
  `OfferRedemption` (immutable: offerId, customerId, channel, validatedBy,
  matchedBookingId?), `VoucherCode`, `ReferralCode`, `OfferApproval`, `FraudFlag`.
- **API:**
  - brand: `GET/POST /discover/offers`, `POST /discover/offers/:id/submit|pause`
  - operator: `POST /operator/discover/offers/:id/approve|reject`
  - public: `GET /d/offers?city&category&result&discount&day&openNow` (the permanent
    Golootlo-style hub), `GET /d/offers/:id`
  - redemption: `POST /d/offers/:id/redeem` (code / QR / POS validation)
- **Rules:** every approved profile — not only premium — can publish a genuine offer.
  Active offers stay visible until expiry, stock limit, or manual pause. Expired offers
  auto-hide and survive only in reporting.
- **Jobs:** `offer-expiry`, `fraud-detection` (duplicate / invalid / excessive
  redemption).
- **Events:** `OfferPublished`, `OfferRedeemed`, `OfferExpired`, `FraudFlagRaised`.
- **Entitlements:** `discover.offers`.

### `premium-placement` — `backend/src/modules/premium-placement`
- **Entities:** `PremiumSubscription` (plan: `growth|premium|enterprise`, status,
  renewal), `SponsoredSlot` (category / location inventory), `PlacementCampaign` (dates,
  targeting, budget, pause).
- **API:**
  - operator: `GET/POST /operator/discover/placements`,
    `POST /operator/discover/placements/:id/pause`,
    `GET/PATCH /operator/discover/ranking-config`
  - brand: `GET /discover/premium/plans`, `POST /discover/premium/subscribe` (→ billing)
- **Rules:** paid positions are labelled "Sponsored" / "Featured". Premium buys
  visibility, never a right to outrank a better match or to skip offer-quality and
  disclosure rules.
- **Events:** `PremiumSubscribed`, `PlacementActivated`, `PlacementPaused`.

### `social-promotion` — managed social campaigns — `backend/src/modules/social-promotion`
- **Entities:** `SocialAccount` (platform-owned handles), `SocialCampaign` (ownerId,
  creative, offerRef, targetArea, budget, managementFee, adSpendCap, status: `draft|
  brand_review|approved|live|completed`), `SocialPost`, `CampaignApproval`,
  `ContentRightsGrant`.
- **API:**
  - operator: `GET/POST /operator/discover/social/campaigns`,
    `POST .../:id/publish`, `GET .../:id/report`
  - brand: `GET /discover/social/campaigns`,
    `POST /discover/social/campaigns/:id/approve`,
    `POST /discover/social/content-rights`
- **Rules:** the brand approves content, offer, target area, budget, duration and final
  creative before publishing; the approval record is kept. Coifyn's management fee is
  separated from ad-platform spend, with caps and pause controls. No unverified claims,
  no expired offers, follow each platform's ad rules.
- **Events:** `SocialCampaignApproved`, `SocialCampaignLive`, `SocialCampaignCompleted`.
- **Entitlements:** `discover.social`.

### `discover-consumer` — the public app — `backend/src/modules/discover-consumer`
- **Entities:** `DiscoverCustomer` (may link a Phase 4 `Customer`), `SavedStylist`,
  `SavedSalon`, `DiscoverSearchLog`, `HomeFeedConfig`.
- **API:**
  - `GET /d/home` — deterministic ordered sections:
    1 Highlights · 2 Premium spotlight · 3 New stylists & work · 4 Special discounts ·
    5 Regular discounts (Offers Hub preview) · 6 Stylists to explore · 7 Trending nearby ·
    8 Events & experiences · 9 Saved & returning
  - `GET /d/feed/nearby?location=`, `POST /d/saved-stylists`, `GET /d/me`
- **Rules:** within a section — current content first, then normal active, then older;
  premium and normal content never mixed without a visible label and a defined ranking
  rule; never fake popularity or reviews.
- **Booking hand-off:** a "Book" action deep-links into the Phase 4 `customer-portal`
  booking flow for that stylist — Discover never re-implements booking.
- **Events:** `StylistSaved`, `DiscoverProfileViewed`.

### `attribution` — closed loop — `backend/src/modules/attribution`
- **Entities:** `AttributionEvent` (funnel stage: `discovery|interest|conversion|
  outcome|retention`, metric, ownerId, campaignRef?, customerRef?, method:
  `direct_profile|campaign_code|qr|last_click|multi_touch`),
  `CampaignResult` (impressions, profileViews, clicks, leads, bookings, completed
  bookings, redemptions, attributedRevenueMinor, costPerLead, costPerBooking,
  returnOnSpend).
- **API:**
  - `GET /discover/results?from&to` (a salon's / stylist's marketplace results —
    also embedded in the `client` dashboard)
  - `GET /operator/discover/marketplace-analytics` (demand by area / result / category,
    conversion, premium revenue, supply gaps)
- **Rules:** the attribution method is shown next to every result; no revenue is claimed
  where it cannot be measured honestly; one brand's customer or operational data is
  never shared with another.
- **Jobs:** `attribution-rollup`, `revenue-match` (ties an `OfferRedemption` /
  `DiscoverProfileViewed` → booking → **completed** Phase 1 ticket).
- **Events:** `AttributionRecorded`, `CampaignResultUpdated`.

### `discover-moderation` (operator) — `backend/src/modules/discover-moderation`
- **API:** `GET /operator/discover/moderation/queue`,
  `POST /operator/discover/moderation/:id/reject` (misleading offers, false claims,
  prohibited material, abusive reviews, wrong prices, expired promos — reason + audit
  retained), `GET /operator/discover/reports` (customer-submitted inaccuracy / fraud
  reports).

---

## `marketNetwork` app — screens

- `app/` → `features/home/components/HomeFeed` (+ one component per ordered section:
  `HighlightsRow`, `PremiumSpotlight`, `NewWork`, `SpecialDiscounts`, `OffersHubPreview`,
  `StylistsToExplore`, `TrendingNearby`, `Events`, `SavedAndReturning`)
- `app/search` → `features/search/components/{SearchBar,ResultFilters,ResultList,
  StylistResultCard,MapToggle,SponsoredLabel}`
- `app/d/stylist/[slug]` → `features/stylist/components/{PublicProfile,PortfolioGrid,
  ResultTagFilter,VerifiedBadge,ReviewList,AvailabilityStrip,BookCta}`
- `app/d/salon/[slug]` → `features/salon/components/PublicSalonPage`
- `app/offers` → `features/offers/components/{OfferGrid,OfferFilters,OfferCard,
  RedeemSheet}`
- `app/match` → `features/match/components/{CutProfileImport,MatchResults,MatchScoreChip}`
- `app/saved` → `features/saved/components/SavedList`

Cross-app primitives (`StylistResultCard`, `VerifiedBadge`, `PortfolioGrid`,
`LiveStatusDot`) come from `@coifyn/ui` / `@coifyn/shared` and are shared with the
`customer` app.

---

## Realtime & jobs

- **BullMQ / Kafka topics:** `search-reindex`, `attribution-rollup`, `revenue-match`,
  `offer-expiry`, `fraud-detection`, `social-campaign`.
- Public pages are edge-cached; personalised sections (`Saved & returning`, `match`)
  are client-fetched after hydration.

## Entitlements introduced

`discover.profile`, `discover.growth`, `discover.premium`, `discover.enterprise`,
`discover.offers`, `discover.social`.

## Acceptance

1. A stylist submits a portfolio; the operator approves it; it appears in "skin fade
   near me" ranked by verified match quality, with a verified badge.
2. A free-tier salon publishes a genuine seasonal discount; it shows in Highlights
   during its freshness window, then moves to the permanent Offers Hub until expiry.
3. The consumer home feed renders the 9 sections in fixed order; sponsored cards are
   clearly labelled; ranking never places a poor match above a better one.
4. A premium salon subscribes; a social campaign is created, approved by the brand,
   published on platform-owned accounts, with the management fee separated from ad spend
   and a spend cap enforced.
5. A customer new to a city imports their cut profile and gets ranked stylists who
   verifiably do that cut; each result explains the match.
6. A customer redeems an offer via QR at the salon; the redemption is matched to a
   completed booking and appears as attributed revenue in the salon's results dashboard
   with the attribution method labelled.
7. Marketplace analytics show demand, conversion and premium revenue for the operator —
   with no cross-brand data leakage.
8. A misleading offer is rejected in moderation with a retained reason and audit entry.
9. Discover search p95 stays within target under load with Typesense fed only from the
   event log — the OLTP primary is untouched by consumer traffic.
