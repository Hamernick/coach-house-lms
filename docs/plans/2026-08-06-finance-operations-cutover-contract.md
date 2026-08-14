# Finance Operations and Cutover Contract

Date: 2026-08-06
Status: Draft 1; Research 7 operations answer complete, operational evidence and
approval still open
Scope: Finance, Stripe Connect, fiscal funds, public Finance projections,
monitoring, support, canaries, incident response, rollback, and recovery
Non-goals: Finance UI, screenshot review, production configuration, live Stripe
objects, deployment, public status claims, or approval on behalf of a human owner

## Decision

Release Finance through server-enforced organization cohorts, not a single
global switch. Separate the ability to provision Connect accounts, create
campaigns, expose public Finance projections, and operate fiscally sponsored
funds. Every capability defaults off in production and fails closed when its
configuration is missing.

Financial correctness and privacy are invariants, not error-budget items. Any
duplicate financial effect, cross-organization or cross-environment write,
destructive ledger mutation, restricted-balance breach, or public donor/private
contact disclosure stops the affected capability immediately.

Availability and freshness use provisional launch SLOs. They become approved
release gates only after a named engineering owner, finance/fiscal operations,
support, security/privacy, and the release approver sign them. Fiscal custody,
disbursement, and the grant-allocation-only 7% rule also require the separate
counsel/accounting approval already tracked by Gate 3.

## Current Repository Evidence

| Area                | Current evidence                                                                       | Release consequence                                                                              |
| ------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Application logs    | `src/lib/logger.ts` emits structured JSON                                              | Add Finance event names and redaction; a log line is not an alert                                |
| Tracing             | `src/instrumentation.ts` enables OpenTelemetry only on Vercel or with an OTLP exporter | Verify exporter, retention, deployment tags, and alert delivery in each release environment      |
| Hosting metrics     | Vercel Analytics, Speed Insights, and OTEL packages are installed                      | Current plan, rolling-release support, skew protection, and alert routing are unverified         |
| Database operations | Supabase is authoritative storage                                                      | Backup/PITR, restore proof, log retention, and any log drain remain unverified                   |
| Status page         | `/status` explicitly says that measured public status is unavailable                   | Do not use it for incident truth until it is backed by measured checks and operator state        |
| Feature flags       | Current flags are coarse environment booleans                                          | Add server-only Finance capability flags plus organization allowlists                            |
| CI                  | GitHub Actions runs `pnpm check:quality`                                               | Branch protection, required review, preview, and production checks still need release-time proof |
| Connect runtime     | Research 6 defines the contract; implementation does not exist                         | No Connect dashboard, alert, canary, or live readiness claim is currently valid                  |

This contract defines required implementation and proof. It does not describe
the current production system as ready.

## Integrity Invariants

The following have zero tolerance in every environment:

1. One semantic financial transition creates at most one immutable ledger effect.
2. Every Stripe object, event, campaign, ledger entry, aggregate, and
   reconciliation finding matches one connected account, legal recipient,
   organization, environment, and currency.
3. Test data never contributes to live, sponsored, public, or reported totals.
4. Posted financial history is never updated or deleted. Corrections use linked
   compensating entries.
5. A restricted balance never becomes available to another organization or
   project and never goes below the approved posting rules.
6. Donor identity, payment data, exact user coordinates, private representative
   contacts, secrets, Account Links, and raw webhook bodies never enter public
   payloads, metrics, alerts, or support notes.
7. Independent direct charges have no Coach House application fee, transfer, or
   custody behavior.
8. The 7% fee applies only to an approved fiscally sponsored grant allocation,
   never an independent donation, general contribution, payout, or transfer.
9. `economic-engine` remains unchanged and is not a Finance fallback.
10. Webhook ingestion and reconciliation stay enabled while payment creation or
    public presentation is rolled back.

## Provisional Launch SLOs

Targets apply only to enabled cohorts. Measure production and sandbox separately,
tag every metric with deployment ID and environment, and exclude synthetic probes
from user-success rates while charting them separately.

| SLI                                      | Provisional objective                                                                                                           | Hard release/rollback gate                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Valid Connect webhook durable acceptance | 99.9% over 30 days; p95 <= 2 seconds and p99 <= 5 seconds from request receipt to committed inbox row and `2xx`                 | Any accepted event without a durable row; canaries require 100%                                   |
| Inbox processing freshness               | 99% of accepted events reach a terminal processed/review state within 60 seconds                                                | Oldest unclaimed/processing event > 5 minutes                                                     |
| Connect readiness freshness              | 99% of `account.updated` events and authenticated onboarding returns reflect retrieved Stripe state within 5 minutes            | State older than 15 minutes blocks campaign activation                                            |
| Reconciliation freshness                 | Every tracked live account has a successful run less than 24 hours old; operator-requested runs finish within 15 minutes at p95 | Any unexplained monetary delta, or no successful run within 24 hours                              |
| Public aggregate freshness               | 99% of enabled campaign projections are <= 5 minutes old                                                                        | At 15 minutes, suppress or freeze the affected total and show its last verified timestamp         |
| Enabled Finance route availability       | 99.9% successful non-user-error responses over 30 days                                                                          | Two consecutive synthetic failures or 5 minutes of elevated server errors pauses cohort expansion |

These are internal objectives, not a public SLA. Recalculate them after the
internal and first-organization canaries. Changing a threshold requires a dated
approval record, never an undocumented dashboard edit.

## Alert Contract

Alerts page a human only when they demand action. Dashboards can retain lower
severity signals without paging.

### SEV 0: integrity or privacy

Trigger immediately on any duplicate monetary effect, cross-account or
cross-environment post, live/test contamination, destructive financial-row
change, restricted-balance invariant failure, public donor/private-contact
exposure, or secret/Account-Link exposure.

Action: stop the affected write/public capability, preserve ingestion, freeze
affected aggregates, page incident command plus finance/fiscal operations and
security/privacy, and begin an immutable incident record. Do not delete rows or
payload evidence needed for a scoped investigation.

### SEV 1: money path unavailable or untrusted

Trigger on:

- any valid signed live event that cannot be durably accepted;
- oldest unclaimed/processing inbox item above 5 minutes;
- any live event for an unknown connected account;
- any unexplained reconciliation delta after a fresh scoped Stripe read;
- any tracked account without successful reconciliation for 24 hours;
- `charges_enabled` or `payouts_enabled` becoming false for an active account;
- public aggregate age above 15 minutes; or
- five invalid live signatures in five minutes when they also exceed 1% of
  requests to the endpoint.

Action: halt expansion; isolate the account or capability; keep durable
ingestion/reconciliation running; acknowledge within 15 minutes; notify the
organization owner when its account is affected.

### SEV 2: degraded objective or support risk

Trigger on an SLO burn without a hard-gate breach, repeated onboarding return
without readiness, elevated API latency, public aggregate age above 5 minutes,
failed synthetic checks, or unresolved support ownership.

Action: acknowledge within one business day, assign an owner, and block the next
canary stage if the issue affects its exit criteria.

Alert payloads contain opaque internal IDs, environment, deployment ID, metric,
threshold, first/last observed UTC timestamps, runbook link, and correlation ID.
They exclude names, emails, donor details, coordinates, secrets, raw Stripe
payloads, and payment method data.

## Monitoring Views

One operator workspace may compose these views, but each metric keeps a single
definition and owner:

1. **Release and canary:** deployed version, feature cohort, stage, time in
   stage, error budget, synthetic checks, and rollback readiness.
2. **Connect delivery:** valid/invalid signatures, accepted/duplicate/rejected
   events, endpoint latency, oldest claim, retries, failures, and API version.
3. **Financial integrity:** ledger effects by kind, semantic duplicate rejects,
   reconciliation deltas, stale runs, mode/account/currency rejects, refunds,
   disputes, and compensating entries.
4. **Account readiness:** requirements, capability changes, charges/payouts
   enabled, onboarding return outcomes, and stale synchronization.
5. **Public projection:** cache age, last verified timestamp, invalidations,
   suppressed/frozen totals, response errors, and payload latency.
6. **Fiscal funds:** organization/project balance checks, grant request age,
   approvals, allocations, disbursements, compensations, and reporting-period
   closure. This view remains disabled until fiscal approval.

The database owns durable operational state. Vercel/Supabase/Stripe dashboards
are evidence sources, not the only incident record. If a paid log drain is
proposed, cost and retention require explicit approval; the release cannot
quietly depend on an unverified add-on.

## Required Server-Side Controls

Implement independently disableable, server-evaluated controls for:

- connected-account provisioning and Account Link creation;
- campaign/Product/Price/Payment Link creation;
- public Finance projections;
- fiscally sponsored restricted-fund operations; and
- cohort membership by organization ID.

Client-visible flags may hide presentation but never authorize a capability.
Organization allowlists and environments are validated server-side. Missing,
malformed, preview/live-mismatched, or stale configuration fails closed.

## Canary Sequence

Every stage requires a clean release artifact, the previous gate’s attached
evidence, no open SEV 0/1, remaining error budget, and a manual advance record.
Deployment traffic canaries do not replace organization capability allowlists.

| Stage                    | Scope                                                                                              | Minimum observation                                                        | Exit evidence                                                                                      |
| ------------------------ | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 0. Sandbox               | Dedicated sandbox endpoint and account; no production objects                                      | Complete lifecycle, outage, replay, mismatch, privacy, and rollback drills | All fixtures, RLS, browser, observability, and restore checks pass                                 |
| 1. Production dark       | Additive schema/code; all Finance capabilities off; no public UI                                   | 24 hours                                                                   | Logs, traces, synthetic checks, flags, rollback, old-code compatibility, and owner paging verified |
| 2. Internal live         | One allowlisted Coach House-controlled legal test account; one controlled direct charge and refund | 24 hours after final event                                                 | Stripe, inbox, ledger, reconciliation, aggregate, receipt, refund, and support evidence agree      |
| 3. Approved organization | One approved independent organization; no fiscal custody                                           | 72 hours and at least one controlled successful lifecycle                  | Organization owner confirms Dashboard/support path; SLOs and privacy checks pass                   |
| 4. Limited cohort        | Up to five approved independent organizations                                                      | 7 days and at least ten complete payment lifecycles across the cohort      | No unresolved integrity/reconciliation findings; support and SLO review signed                     |
| 5. Broader release       | 25% of eligible approved organizations, then 100%                                                  | 7 days at 25%, then one full SLO review                                    | Explicit production approval and completion evidence attached                                      |

Never use a Vercel traffic bucket as confidential access control. If the current
Vercel plan supports Rolling Releases, use deployment IDs and skew protection
for code-risk comparison; otherwise use preview proof, an instant rollback-ready
known-good deployment, and the server-side cohort controls above.

Fiscally sponsored funds are a separate canary after counsel, accounting, and
fiscal operations sign the custody, grant-only 7%, approval, disbursement, and
reporting rules. They never ride silently on the independent-organization canary.

## Rollback Order

1. Stop stage advancement and record the UTC time, deployment, cohort, actor,
   reason, and affected accounts.
2. Disable new account provisioning, campaign creation, and affected public
   projections at the narrowest safe capability/cohort boundary.
3. Deactivate affected Payment Links in their connected-account context when
   the risk involves accepting new payments.
4. Keep the Connect endpoint, durable inbox, event processor, immutable ledger,
   reconciliation, and support access running until in-flight events settle.
5. Freeze untrusted public totals at their last verified value with timestamp or
   suppress them; never invent a fallback total.
6. Roll application code to the known-good deployment only when its schema
   compatibility was already proven. Do not reverse an applied migration;
   forward-fix with a new corrective migration.
7. Correct financial state only through reviewed compensating entries and rerun
   scoped reconciliation.
8. Re-enable by repeating the failed stage, never by skipping it.

## Required Drills

Before Stage 2, execute and attach evidence for:

1. duplicate, equivalent-duplicate, replayed, and out-of-order Connect events;
2. three-hour webhook-delivery interruption followed by automated/manual retry
   and reconciliation recovery in sandbox;
3. wrong connected account, environment, mode, currency, campaign, and API
   version rejection;
4. database timeout/failure between durable acceptance, claim, and ledger post;
5. stale public cache with freeze/suppress behavior and recovery;
6. bad deployment rollback while old and new code tolerate the additive schema;
7. public donor/private-contact exposure kill switch and incident evidence;
8. Stripe, Supabase, Vercel, and notification-provider degradation;
9. primary-owner absence with backup acknowledgement and support handoff; and
10. backup/restore or PITR rehearsal in a disposable environment with no
    production restore or production data copied into fixtures.

Re-run affected drills after webhook/API-version, ledger, cache, authorization,
or deployment-topology changes.

## Owner and Support Matrix

Named primary and backup people must replace every role before Stage 1 exits.

| Situation                                      | Accountable role              | Required supporting roles                  |
| ---------------------------------------------- | ----------------------------- | ------------------------------------------ |
| Release advance/rollback                       | Release manager               | Incident commander, engineering owner      |
| Platform ingest/reconciliation                 | Engineering owner             | Finance operations, security/privacy       |
| Financial interpretation/correction            | Finance operations            | Engineering owner, accounting reviewer     |
| Independent requirements/refund/dispute/payout | Connected organization owner  | Member support; Stripe support when needed |
| Sponsored grant/allocation/disbursement        | Fiscal sponsorship operations | Accounting, counsel, engineering owner     |
| Public aggregate or campaign presentation      | Product owner                 | Finance operations, engineering owner      |
| Donor/contact/privacy incident                 | Security/privacy owner        | Incident commander, counsel, support       |
| Member communication                           | Member support owner          | Organization owner or fiscal operations    |

For independent direct charges, Coach House support does not impersonate the
connected account or initiate its refund/payout. It routes the organization
owner to its full Stripe Dashboard and tracks platform-owned failures separately.

## Incident Record and Communication

Each SEV 0/1 record includes severity, UTC timeline, detection source, opaque
affected IDs, deployment/environment, integrity assessment, containment,
customer-impact boundary, decisions/actors, Stripe/Supabase/Vercel case IDs,
reconciliation proof, recovery checks, and follow-up owner/date.

Do not publish the current static `/status` page as evidence. A public incident
update requires an operator-controlled source, measured component status,
timestamp, and reviewed privacy-safe copy. Internal incident notes never expose
donor or representative identity unnecessarily.

## Cutover Checklist

### Required before Stage 1 exits

- clean release artifact and required CI/preview checks;
- additive migration and old/new-code compatibility proof;
- server-side controls default off and rollback exercised;
- dedicated sandbox/live Connect destinations and exact API versions recorded;
- structured Finance metrics visible by environment and deployment;
- alerts delivered to named primary and backup owners;
- backup/PITR posture recorded and disposable restore drill passed;
- support routes, escalation contacts, and incident template attached; and
- hard-coded `/status` claims removed, replaced, or explicitly excluded.

### Required before Stage 3

- internal live lifecycle and reconciliation proof;
- organization owner consent and support acknowledgement;
- SLO/error-budget review;
- no open SEV 0/1 or unexplained finding;
- privacy and public projection checks; and
- signed advance record.

### Required before Stage 5/100%

- limited-cohort evidence and observation window complete;
- `pnpm check:quality`, final-schema RLS, visual, browser, performance, and
  accessibility proof from the clean release artifact;
- production database, Stripe, browser, monitoring, alert, support, rollback,
  and recovery checks all verified;
- screenshot-derived Finance hierarchy approval complete;
- signed release, finance/fiscal operations, support, security/privacy, product,
  and required counsel/accounting approvals; and
- no claim that deployment succeeded until production evidence is attached.

## Approval Record

The signed record must capture:

- artifact commit and deployment IDs;
- migrations and Stripe endpoint/API versions;
- canary cohort and observation evidence;
- final SLO thresholds and dashboards;
- named primary/backup owners and contact paths;
- open risks and accepted exceptions with expiry dates;
- rollback target and last drill time;
- screenshot-review decision;
- fiscal custody/fee/disbursement decision when sponsored funds are enabled; and
- approver name, role, decision, UTC timestamp, and signature/equivalent audit
  evidence.

## Remaining Research 7 Inputs

Operations research now answers the required SLO, alert, canary, owner,
rollback, and cache-age question. The evidence remains **collecting** until the
dashboards, alerts, owner roster, drills, and signed approval exist.

Still not started:

1. three-pass review of the user’s Finance screenshots; and
2. screenshot-derived wireframe, deduplication, responsive, and error-state
   evidence.

No product-facing `/find` or Finance UI should be built from this research track
until the requested screenshots are attached and reviewed.

## Primary Sources

- [Stripe webhook delivery and security behavior](https://docs.stripe.com/webhooks)
- [Stripe Connect webhook account and environment behavior](https://docs.stripe.com/connect/webhooks)
- [Stripe undelivered-event recovery](https://docs.stripe.com/webhooks/process-undelivered-events)
- [Stripe webhook API-version migration](https://docs.stripe.com/webhooks/versioning)
- [Vercel Rolling Releases](https://vercel.com/docs/rolling-releases)
- [Vercel Observability](https://vercel.com/docs/observability)
- [Supabase database backups and PITR](https://supabase.com/docs/guides/platform/backups)
- [Supabase Log Drains](https://supabase.com/docs/guides/platform/manage-your-usage/log-drains)
- [Google SRE service-level objectives](https://sre.google/sre-book/service-level-objectives/)
- [Google SRE production-service practices](https://sre.google/sre-book/service-best-practices/)
