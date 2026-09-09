# Phase 7 — Intelligence & automation

## Overview

**What this phase is for.** Add the intelligence layer on top of a complete, accurate
platform: an **AI receptionist** that answers calls and DMs and turns them into
bookings, predictive signals (no-show risk, churn / at-risk clients, rebooking gaps,
demand-based pricing suggestions), review-theme analysis, a proper analytics warehouse,
multi-branch consolidation, and **governed automation** where anything sensitive still
needs a human to approve it.

**Depends on.** All prior phases — AI is an analyst on top of real operational data, not
a substitute for it.

**Primary displays.** `client` (salon console — advisor, analytics, automation) and
`management` (network analytics, model config). No new consumer surface.

**Leaves out.** Nothing planned after this — later work is depth, not new pillars.

**Design rule (non-negotiable).** AI is an **analyst, never an autonomous manager**. It
labels facts vs forecasts vs recommendations, shows the evidence, states uncertainty,
and **requires human approval** for any financial, staffing, pricing, communication or
configuration action. Every accepted/rejected recommendation is logged. Personal data
sent to a provider is minimised. Strict per-salon isolation.

---

## Feature modules

### `ai-receptionist` — inbound booking — `backend/src/modules/ai-receptionist`
- **Entities:** `InboundContact` (channel: `voice|sms|whatsapp|webchat|instagram_dm`,
  fromRef, transcript, intent, status: `handled|booked|handed_off|missed`),
  `AiBookingDraft` (contactId, proposed stylist / service / slot, confidence, status:
  `proposed|confirmed|rejected`), `HandoffTicket` (to the front desk when confidence is
  low or the request is out of scope).
- **API:**
  - `POST /webhooks/telephony/:provider`, `POST /webhooks/messaging/:provider`
    (idempotent, signed)
  - `GET /ai/inbound`, `GET /ai/inbound/:id`,
    `POST /ai/inbound/:id/confirm-booking|hand-off`
  - `GET/PUT /ai/receptionist/config` (hours it covers, greeting, escalation rules,
    which services it may book)
- **Rules:** the receptionist may **create a booking hold and confirm it** only within
  configured limits (known customer or verified new one, service on the allowed list,
  slot genuinely open); anything else becomes a `HandoffTicket`. It never takes payment,
  never gives a refund, never changes a price. Missed calls outside hours get an
  auto-text with a booking link.
- **Events:** `InboundContactReceived`, `AiBookingConfirmed`, `AiHandoffCreated`,
  `MissedCallRecovered`.
- **Entitlements:** `ai.receptionist`.

### `ai-advisor` — signals & recommendations — `backend/src/modules/ai-advisor`
- **Entities:** `AiInsight` (type: `fact|forecast|recommendation`, subjectArea:
  `bookings|revenue|retention|stylist|retail|reviews|inventory`, evidence[], confidence,
  uncertaintyNote), `AiRecommendation` (linked tasks, status: `proposed|accepted|
  rejected`, ratedBy), `AiConversation` + `AiMessage` (NL Q&A over authorised salon
  data), `AiProviderConfig` (provider-agnostic, scoped access, PII-minimisation rules).
- **API:**
  - `GET /ai/summary?range` (daily business summary)
  - `GET /ai/insights?area=`, `POST /ai/ask` ("Why were Tuesdays slow last month?")
  - `GET /ai/recommendations`,
    `POST /ai/recommendations/:id/accept|reject|rate`,
    `POST /ai/recommendations/:id/to-tasks`
- **Scope:** what to feature as the brand (from verified reviews + portfolio
  performance), service-recovery priorities, which stylists have rebooking gaps,
  retail-attach opportunities, reorder timing, no-show-risk flags, simple financial
  anomaly flags. Deeper accounting is explicitly **out of scope** — there is no separate
  finance product in Coifyn.
- **Events:** `AiInsightGenerated`, `AiRecommendationAccepted`, `AiRecommendationRejected`.
- **Jobs:** `daily-summary`, `anomaly-scan`, `forecast-refresh`.
- **Entitlements:** `ai.advisor`.

### `retention-intelligence` — churn & rebooking — `backend/src/modules/retention-intelligence`
- **Entities:** `ClientRiskScore` (customerId, score, drivers[], lastComputedAt),
  `RebookingGap` (customerId, expectedBy, stylistId, status), `WinBackSuggestion`
  (customerId, proposed offer, channel, status: `proposed|approved|sent`).
- **API:**
  - `GET /retention/at-risk`, `GET /retention/rebooking-gaps`
  - `GET /retention/suggestions`, `POST /retention/suggestions/:id/approve`
    (approving hands it to the Phase 3 `marketing` engine to actually send)
- **Rules:** a suggestion is never sent without approval; the offer proposed stays
  inside the salon's configured discount ceiling.
- **Events:** `ClientRiskScored`, `RebookingGapDetected`, `WinBackApproved`.
- **Jobs:** `risk-refresh` (nightly), `rebooking-gap-scan`.
- **Entitlements:** `retention.intelligence`.

### `demand-pricing` — recommendations only — `backend/src/modules/demand-pricing`
- **Entities:** `DemandSignal` (branchId, slotBand, occupancy, pace, day-of-week,
  season, event), `PriceRecommendation` (serviceId / stylistId, slotBand, currentMinor,
  suggestedMinor, confidence, drivers[]), `PricingGuardrail` (floorMinor, ceilingMinor,
  maxAdjustPct, blackout), `PriceOverrideLog`.
- **API:**
  - `GET /pricing/recommendations`,
    `POST /pricing/recommendations/:id/accept|reject`
  - `GET/PUT /pricing/guardrails`, `POST /pricing/auto/toggle` (guarded by guardrails;
    owner approves the policy)
- **Rules:** AI proposes, a human accepts; auto-pricing (if enabled at all) stays inside
  `PricingGuardrail` floors/ceilings; every applied change writes `PriceOverrideLog` +
  `AuditEvent` with the drivers. Off-peak discounting and peak uplift are surfaced as
  recommendations, not silently applied.
- **Events:** `PriceRecommended`, `PriceRecommendationAccepted`, `AutoPriceApplied`.
- **Jobs:** `demand-refresh` (nightly), `recommendation-engine`.
- **Entitlements:** `pricing.recommendations`, `pricing.auto`.

### `analytics-bi` — the warehouse — `backend/src/modules/analytics-bi`
- **Infra:** **ClickHouse** loaded async from the event log / Kafka — never queried by
  the app's hot path. **Metabase** (or Superset) for operator + salon dashboards. OLTP
  Postgres keeps only live operational reporting.
- **Entities:** `MetricDefinition` (documented, reconciled), `SavedView`,
  `ScheduledReport`, `DataExport`, `WarehouseSync` (connector config).
- **API:** `GET /analytics/metrics`, `GET/POST /analytics/views`,
  `POST /analytics/reports/schedule`, `POST /analytics/exports`,
  `GET /analytics/cohort`, `GET /analytics/forecast`.
- **Rules:** KPI definitions documented; dashboard totals reconcile to source for the
  same filter/period; export controls + generation timestamps.
- **Entitlements:** `analytics.advanced`, `analytics.warehouse`.

### `multi-branch` — `backend/src/modules/multi-branch`
- **API:** `GET /portfolio/branches`,
  `GET /portfolio/compare?metric&range` (consistent KPI definitions across branches),
  `GET /portfolio/reports/consolidated`, shared vs branch-specific templates (services,
  price lists, product catalog, forms), controlled cross-branch notifications, one
  customer identity with controlled visibility across a salon's branches.
- **Entitlements:** `multibranch.core`.

### `automation` — governed — `backend/src/modules/automation`
- **Entities:** `AutomationRule` (trigger event, condition, action, requiresApproval),
  `AutomationRun`, `AutomationApproval`.
- **API:** `GET/POST /automation/rules`, `POST /automation/rules/:id/enable`,
  `GET /automation/runs`, `POST /automation/runs/:id/approve`.
- **Examples:** "on `AppointmentNoShow` for a deposit booking → propose forfeiting the
  deposit (approval required)"; "on `StockLow` → draft a purchase order (approval
  required)"; "on `AppointmentCompleted` → send the review request (auto — not
  sensitive)".
- **Rules:** any automation touching money, staffing, pricing, communication to a
  segment, or configuration pauses for human approval before it runs; every run is
  audit-logged.
- **Events:** `AutomationTriggered`, `AutomationRunApproved`, `AutomationRunExecuted`.
- **Entitlements:** `automation.core`.

---

## Console screens this phase

`client`:
- `app/advisor` → `features/ai-advisor/components/{DailySummary,InsightList,AskBox,
  RecommendationCard,EvidencePanel}`
- `app/inbound` → `features/ai-receptionist/components/{InboundList,TranscriptView,
  BookingDraftCard,HandoffQueue,ReceptionistConfig}`
- `app/retention` → `features/retention/components/{AtRiskList,RebookingGaps,
  SuggestionQueue}`
- `app/pricing` → `features/demand-pricing/components/{RecommendationList,
  GuardrailForm,DriverBreakdown}`
- `app/analytics` → `features/analytics-bi/components/{MetricExplorer,SavedViews,
  CohortView,ForecastView}`
- `app/branches` → `features/multi-branch/components/{BranchCompare,ConsolidatedReport,
  TemplateSync}`
- `app/automation` → `features/automation/components/{RuleList,RuleBuilder,RunLog,
  ApprovalQueue}`

`management`:
- `app/network-analytics` → warehouse-backed operator dashboards
- `app/ai-config` → provider abstraction, per-plan model access, PII rules

---

## Realtime & jobs

- **Kafka / BullMQ:** `warehouse-sync`, `daily-summary`, `anomaly-scan`,
  `risk-refresh`, `demand-refresh`, `recommendation-engine`, `automation-tick`,
  `inbound-processing`.

## Entitlements introduced

`ai.receptionist`, `ai.advisor`, `retention.intelligence`, `pricing.recommendations`,
`pricing.auto`, `analytics.advanced`, `analytics.warehouse`, `multibranch.core`,
`automation.core`.

## Acceptance

1. The AI receptionist takes an after-hours WhatsApp message, books a known customer
   with a named stylist into a genuinely open slot within its configured limits, and
   hands off anything outside them to the front desk with the transcript attached.
2. A missed call outside hours triggers an auto-text with a booking link, and the
   resulting booking is attributed to that recovery.
3. The advisor produces a daily summary and area insights, each with evidence and an
   uncertainty note; a recommendation can be accepted, rated, and turned into tasks; it
   cannot silently execute a sensitive action.
4. "Bookings fell 18% this month" returns evidence (two stylists on leave, rebooking
   gaps up, three lapsed regulars) and a recommendation; accepting it creates an
   approved win-back task through the marketing engine; the outcome is measured.
5. A price recommendation shows its drivers; accepting it updates the price and logs the
   change; auto-pricing never moves a price outside its guardrail.
6. Multi-branch comparison uses identical KPI definitions across branches and the
   consolidated report reconciles.
7. A governed automation that would forfeit a deposit or message a segment pauses for
   human approval before running; a non-sensitive one (review request) runs
   automatically; both are audit-logged.
8. Warehouse dashboards reconcile to source and never run against the OLTP primary.
