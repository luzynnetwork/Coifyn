# Phase 5 — Operator control plane & billing

## Overview

**What this phase is for.** Build the `management` console — the SaaS control plane
Coifyn's own team uses to run the business. Onboard salons, decide exactly which modules
each salon and branch gets, meter usage, produce reproducible invoices, take payment,
and message salons — all without one salon's private operational data ever being visible
as another's. Plus **payments-as-a-product**: Coifyn as the payment facilitator, routing
card payments and paying salons (and chair renters) out via Stripe Connect.

**Depends on.** Phase 0 (the entitlement *guard* is already called everywhere) and
Phases 1–4 (there is now real usage to meter and real salons to bill).

**Primary display.** `management`.

**Leaves out.** The consumer marketplace (Phase 6) and AI (Phase 7). This phase governs
operator→salon relationships and money, not consumer discovery.

**Done when.** The operator can onboard a salon, run its checklist, turn POS + inventory
on for one salon while another stays booking-only with no cross-tenant access; usage
events accrue immutably; the billing calculator produces an itemised invoice tied to
those events; an issued invoice is locked against later rate changes; and a salon
onboarded to platform payments takes a card payment that reconciles into a released
payout.

---

## Feature modules

### `operator-clients` — `backend/src/modules/operator-clients`
- **Entities:** `ClientRecord` (extends `SalonOrganization`: contract owner, billing
  contacts, region, dataResidency, status), `ClientLifecycle` (`lead|trial|onboarding|
  active|suspended|offboarding|archived`, reason, owner, approvals),
  `Contract` (plan, moduleBundle, pricing, term, billingCycle, includedUnits,
  overageRules, discounts, documents, renewalDate),
  `ClientHealth` (adoption, data freshness, failed jobs, support load, payment status,
  login activity, score), `OnboardingChecklist` + `OnboardingTask`.
- **API:**
  - `GET/POST /operator/clients`, `GET/PATCH /operator/clients/:id`
  - `POST /operator/clients/:id/lifecycle` (status change + reason + approval)
  - `GET/POST /operator/clients/:id/contracts`, `POST /operator/contracts/:id/renew`
  - `GET /operator/clients/:id/health`, `GET /operator/onboarding/:clientId`,
    `POST /operator/onboarding/:clientId/tasks/:taskId/complete`
- **Events:** `ClientOnboarded`, `ClientSuspended`, `ClientOffboarded`,
  `ContractRenewed`, `HealthScoreChanged`.

### `entitlements` — the real engine (replaces the Phase 0 stub) — `backend/src/modules/entitlements`
- **Entities:** `Plan`, `Module` (family, key), `PlanModule`, `ClientEntitlement`
  (clientId, branchId nullable, moduleKey, status: `enabled|disabled|trial|scheduled|
  expired|grandfathered|suspended`, limits jsonb, activateAt, expireAt),
  `FeatureFlag`, `EntitlementChangeRequest` (dual approval for high-risk changes).
- **API:**
  - `GET/POST /operator/plans`, `GET/POST /operator/modules`
  - `GET /operator/clients/:id/entitlements`,
    `POST /operator/clients/:id/entitlements` (grant / revoke)
  - `POST /operator/entitlements/:id/schedule`, `POST /operator/feature-flags`
- **Rules:** entitlements are evaluated **server-side** on every request by the
  `EntitlementGuard` already wired in Phase 0; the UI only mirrors them. Client impact
  is shown before activation. Dual approval for price overrides, irreversible
  disablement, and retention actions.
- **Limits:** branches, chairs, active staff users, monthly SMS/email/WhatsApp, API
  calls, storage GB, AI credits, support tier.
- **Events:** `EntitlementChanged`, `EntitlementScheduled`, `FeatureFlagToggled`.

### `usage-metering` — `backend/src/modules/usage-metering`
- **Entities:** `UsageMeter` (key: `messages|ai_requests|api_calls|active_branches|
  active_chairs|active_staff|storage_gb|completed_bookings|platform_txn_count|
  support_hours`), `UsageEvent` (immutable: meterKey, clientId, quantity, occurredAt,
  sourceRef), `UsageRollup` (period aggregates), `UsageThreshold`.
- **API:**
  - `GET /operator/usage?clientId&meter&from&to`,
    `GET /operator/usage/rollup?clientId&period`
  - `POST /operator/usage/correction` (reason + permission + audit)
- **Rules:** usage events are append-only; a bill must be reproducible from events +
  rate cards alone. Meters are fed off the `domain_event` outbox — never counted by the
  app's hot path.
- **Jobs:** `usage-rollup` (hourly / daily), `threshold-watch`.
- **Events:** `UsageRecorded`, `UsageThresholdReached`.

### `billing` — the calculator — `backend/src/modules/billing`
- **Entities:** `RateCard` (versioned: per-line pricing, tiers, minimums, caps,
  currency, tax treatment), `Invoice` (clientId, period, status: `draft|review|approved|
  issued|delivered|paid|part_paid|overdue|disputed|credited|voided`, snapshot jsonb
  locked on issue), `InvoiceLine` (description, formula, qty, rate, adjustment, amount),
  `Payment`, `CreditMemo`, `PaymentAllocation`, `Dispute`, `CollectionCase`.
- **API:**
  - `GET/POST /operator/rate-cards`, `POST /operator/rate-cards/:id/version`
  - `POST /operator/invoices/calculate?clientId&period` (itemised, from subscription +
    usage + included allowance + overage + discount + tax)
  - `GET/POST /operator/invoices`, `POST /operator/invoices/:id/approve|issue|void`
  - `POST /operator/invoices/:id/credit`, `POST /operator/payments`,
    `POST /operator/payments/:id/allocate`
  - `GET /operator/collections`, `POST /operator/disputes`
- **Rules:** issued invoice snapshots are immutable — a later rate-card change cannot
  alter them; a credit memo is the only correction path. Every credit, refund, rate-card
  change and manual correction writes an audit record with actor, time, basis,
  before/after. Each line shows its `quantity × rate` formula.
- **Jobs:** `invoice-run` (per billing cycle), `overdue-sweep`, `dunning`,
  `renewal-reminder`.
- **Events:** `InvoiceGenerated`, `InvoiceIssued`, `PaymentReceived`, `InvoiceOverdue`,
  `CreditMemoIssued`, `DisputeOpened`.

### `operator-communications` — `backend/src/modules/operator-comms`
- **Entities:** `OperatorTemplate` (type: `operational|commercial|support|security`,
  variables, version), `OperatorAudience` (by status / plan / module / geo / role /
  usage / integration state), `OperatorCampaign`, `OperatorDelivery`,
  `CommunicationApproval`.
- **API:**
  - `GET/POST /operator/comms/templates`, `POST /operator/comms/send`,
    `POST /operator/comms/campaigns`, `POST /operator/comms/campaigns/:id/approve`
  - `GET /operator/comms/deliveries?campaignId`
- **Rules:** governs operator→salon messages only, never a salon's own client marketing.
  Frequency caps, quiet hours by salon timezone, unsubscribe for promotional, emergency
  override governance.
- **Events:** `OperatorMessageSent`, `OperatorMessageDelivered`, `OperatorMessageFailed`.

### `support-desk` — `backend/src/modules/support-desk`
- **Entities:** `SupportCase` (clientId, severity, sla, owner, module, status,
  customerImpact, linkedLogs, rootCause), `Escalation`, `SupportAccessGrant`
  (time-limited view-as: scope, reason, approver, expiresAt, revoked).
- **API:**
  - `GET/POST /operator/support/cases`,
    `POST /operator/support/cases/:id/escalate|resolve`
  - `POST /operator/support/access-grants` (scoped impersonation with a persistent
    banner + full audit), `POST /operator/support/access-grants/:id/revoke`
- **Rules:** an operator can enter a salon workspace only through a time-limited,
  clearly-marked, fully-audited grant that auto-revokes at expiry.
- **Events:** `SupportCaseCreated`, `SupportCaseEscalated`, `SupportAccessGranted`,
  `SupportAccessRevoked`.

### `platform-health` — `backend/src/modules/platform-health`
- **Entities:** `IntegrationConnection` (per client/provider; status, lastSync,
  syncLag), `WebhookDelivery` (retry / dead-letter), `JobRun`, `ReleaseRecord`,
  `DataQualityException`.
- **API:**
  - `GET /operator/health/overview` (API latency/error, queue depth, job failures,
    uptime, backup health)
  - `GET /operator/health/integrations`,
    `POST /operator/health/integrations/:id/disable`
  - `GET /operator/health/data-quality`, `GET /operator/health/webhooks`
- **Events:** `IntegrationFailed`, `JobFailed`, `DataQualityExceptionRaised`,
  `ReleaseDeployed`.

### `platform-payments` — payments-as-a-product — `backend/src/modules/platform-payments`
- **Entities:** `MerchantAccount` (per client; KYC status, payout schedule, feeSchedule),
  `SubMerchant` (per chair renter who takes their own payments), `PlatformTransaction`
  (client, gross, platformFee, providerFee, net), `Payout`, `PayoutItem`, `Chargeback`,
  `SettlementBatch`.
- **API:**
  - `POST /operator/merchants` (onboard a salon to platform payments),
    `GET /operator/merchants/:id`, `POST /operator/merchants/:id/sub-merchants`
  - `GET /operator/payments/transactions`, `GET /operator/payments/payouts`,
    `POST /operator/payments/payouts/:id/release`
  - `GET /operator/payments/chargebacks`
  - webhook: `POST /webhooks/psp/:provider` (idempotent, signature-checked)
- **Rules:** PCI scope minimised via hosted/tokenised provider (facilitator / Connect
  model); platform fee configurable per client; every settlement reproducible.
  A salon's own POS card payments (Phase 1) route through here once the salon is a
  merchant; before that they use their own terminal.
- **Events:** `MerchantOnboarded`, `PlatformTransactionCaptured`, `PayoutReleased`,
  `ChargebackReceived`.
- **Entitlements:** `payments.platform`.

### `operator-dashboard` — `backend/src/modules/operator-dashboard`
- **API:** `GET /operator/dashboard` — active/trial/suspended/onboarding salons, active
  branches and chairs, MRR/ARR, overdue invoices, pending approvals, critical incidents,
  commercial performance, salon health, operations watch, action queue.
- **Rules:** every KPI returns definition, comparison period, source, last refresh,
  drill-down path.

---

## `management` console — screens this phase

- `app/overview` → `features/operator-dashboard/components/NetworkDashboard`
- `app/clients` → `features/operator-clients/components/{ClientDirectory,ClientDetail,
  LifecyclePanel,ContractForm,HealthCard,OnboardingChecklist}`
- `app/catalog` → `features/entitlements/components/{PlanList,ModuleGrid,
  EntitlementMatrix,LimitEditor,ScheduleDialog,FeatureFlags}`
- `app/usage-billing` → `features/billing/components/{UsageLedger,BillingCalculator,
  InvoiceList,InvoiceView,RateCardEditor,CollectionsBoard}`
- `app/communications` → `features/operator-comms/components/{TemplateLibrary,
  AudienceBuilder,CampaignComposer,ApprovalQueue,DeliveryLog}`
- `app/operations` → `features/platform-health/components/{HealthOverview,
  IntegrationList,DataQuality,WebhookLog}` + `features/support-desk/components/{CaseList,
  CaseView,AccessGrantForm}`
- `app/payments` → `features/platform-payments/components/{MerchantList,TransactionList,
  PayoutList,ChargebackList}`
- `app/governance` → users, roles, approvals, audit log

---

## Realtime & jobs

- **BullMQ (adds):** `usage-rollup`, `invoice-run`, `dunning`, `operator-comms`,
  `psp-webhooks`, `payouts`.

## Entitlements introduced

`payments.platform`, plus the entitlement **engine** now governs every `*.core` flag
from Phases 1–4. Operator-internal capabilities: `operator.clients`, `operator.billing`,
`operator.communications`, `operator.support`, `operator.health`, `operator.dashboard`,
`operator.payments`.

## Acceptance

1. The operator onboards a salon, runs its checklist, and activates POS + inventory for
   one salon while another stays booking-only — with no cross-tenant access.
2. Granting or revoking a module changes behaviour server-side immediately; a high-risk
   change requires dual approval.
3. Usage events accrue immutably off the event log; the calculator produces an itemised
   invoice (subscription + usage + allowance + overage + discount + tax) tied to those
   events.
4. An issued invoice cannot be altered by a later rate-card change; a credit memo is the
   only correction path, and it is audited.
5. The operator sends an approved maintenance notice to active salon admins in one
   region and sees delivery / failure status.
6. A support user enters a salon workspace via a time-limited, banner-marked, audited
   view-as grant that auto-revokes at expiry.
7. A failed integration appears in the action queue with the affected salon/branch, last
   sync, and owner.
8. A salon is onboarded to platform payments; a customer card payment is captured with
   the platform fee split out, and a payout is released and reconciles to its
   transactions.
