# Accelerator Billing Lifecycle QA Matrix
Status: Active
Owner: Caleb + Codex
Priority: P0
Last updated: 2026-02-06

---

## Purpose
- Validate WS-J billing lifecycle behavior end-to-end before launch.
- Cover deterministic transitions for one-time and monthly Accelerator plans.
- Ensure rollover into Organization `$20/month` is correct and idempotent.

## Implementation Contracts Under Test
- One-time Accelerator purchase provisions Organization subscription with a 180-day trial.
- Monthly Accelerator purchase stores installment metadata:
  - `accelerator_installment_limit=10`
  - `accelerator_installments_paid` increments on `invoice.paid`.
- At installment limit, Accelerator monthly subscription is set to `cancel_at_period_end=true`.
- On Accelerator monthly cancellation/deletion, webhook provisions Organization `$20/month` unless an active/trialing subscription already exists.
- Webhook processing remains idempotent by Stripe event id lock + subscription existence checks.

## Test Matrix

### 1) Accelerator One-time: happy path
- Setup:
  - User has no active/trialing subscription.
- Trigger:
  - Complete one-time Accelerator checkout (`checkout.session.completed`, `mode=payment`, `kind=accelerator`).
- Expected:
  - `accelerator_purchases` active row exists.
  - New Organization subscription created with `trial_period_days=180`.
  - Local `subscriptions` row includes metadata `context=accelerator_bundle_one_time`.

### 2) Accelerator One-time: duplicate webhook retry
- Trigger:
  - Replay same `checkout.session.completed` event id.
- Expected:
  - No duplicate side effects.
  - No extra Organization subscription created.
  - Event lock marks duplicate as ignored.

### 3) Accelerator Monthly: first invoice progression
- Setup:
  - New accelerator monthly subscription via checkout.
- Trigger:
  - First `invoice.paid` with `billing_reason=subscription_create`.
- Expected:
  - Subscription metadata increments to `accelerator_installments_paid=1`.
  - `cancel_at_period_end=false`.
  - Local `subscriptions` metadata reflects updated count.

### 4) Accelerator Monthly: mid-cycle invoice progression
- Trigger:
  - Additional `invoice.paid` cycle events up to installment 5.
- Expected:
  - `accelerator_installments_paid` increments by 1 per cycle.
  - No rollover subscription created.

### 5) Accelerator Monthly: installment 10 limit hit
- Trigger:
  - Tenth eligible `invoice.paid`.
- Expected:
  - Metadata reaches `accelerator_installments_paid=10`.
  - Subscription updated with `cancel_at_period_end=true`.
  - No immediate Organization subscription while Accelerator is still active in current period.

### 6) Accelerator Monthly: natural period-end cancellation
- Trigger:
  - `customer.subscription.deleted` (or `updated` with `status=canceled`) after final period end.
- Expected:
  - Organization `$20/month` subscription created with metadata `context=accelerator_rollover`.
  - No duplicate Organization subscription if already active/trialing.

### 7) Accelerator Monthly: user cancels early
- Trigger:
  - User cancels before installment 10; subscription eventually transitions to canceled/deleted.
- Expected:
  - No Organization rollover is provisioned.
  - User exits Accelerator monthly path without automatic `$20/month` continuation.

### 8) Accelerator Monthly: payment failure + recovery
- Trigger:
  - Subscription enters `past_due`, then invoice is paid later.
- Expected:
  - Installment count increments only on successful `invoice.paid`.
  - Rollover not triggered unless subscription becomes canceled/deleted.

### 9) Accelerator Monthly: payment failure + terminal cancellation
- Trigger:
  - Failed payments lead to canceled/deleted subscription.
- Expected:
  - If installment term not complete, no rollover subscription is provisioned.
  - If installment term already complete, rollover subscription is provisioned.

### 10) Existing Organization subscriber buys Accelerator
- Setup:
  - User already has active/trialing Organization subscription.
- Trigger:
  - One-time Accelerator purchase or monthly rollover path.
- Expected:
  - No duplicate Organization subscription is created.
  - Accelerator purchase/subscription still recorded correctly.

## Manual Verification Checklist
- Stripe Dashboard:
  - Confirm subscription metadata values and `cancel_at_period_end` transitions.
  - Confirm created Organization subscription plan id and trial timing.
- Supabase:
  - `subscriptions` rows reflect expected status + metadata chronology.
  - `accelerator_purchases` row exists for one-time flow.
  - `stripe_webhook_events` entries show processed/duplicate handling.
- App behavior:
  - `/my-organization` remains accessible throughout expected lifecycle windows.
  - Coaching schedule logic remains unaffected by billing lifecycle transitions.

## Live Execution Runbook (Staging / Pre-Prod)
Use this to close remaining integration-level WS-D checks.

1. Setup
- Ensure staging has:
  - valid Stripe API keys and webhook secret
  - `STRIPE_ORGANIZATION_PRICE_ID`
  - accelerator one-time + monthly price ids
- Seed a clean staging user:
  - `pnpm seed:full-account --email <staging-user-email> --password '<temp-pass>' --variant with_coaching --progress mixed`
- Keep a second user with an active Organization subscription for duplicate-prevention checks.

2. One-time accelerator lifecycle
- Run checkout using one-time Accelerator plan.
- Verify webhook `checkout.session.completed`:
  - `accelerator_purchases` row created (status `active`)
  - Organization subscription created with 180-day trial and `context=accelerator_bundle_one_time`
- Replay same webhook event id from Stripe dashboard.
- Verify no duplicate side effects.

3. Monthly accelerator installment lifecycle
- Run checkout using monthly Accelerator plan.
- Verify initial metadata:
  - `accelerator_installment_limit=10`
  - `accelerator_installments_paid=0`
- Advance invoice cycles (or use test clock) and verify:
  - increment on each `invoice.paid` with cycle/create reasons
  - no increment on manual/non-cycle invoice reasons
- On installment 10:
  - `cancel_at_period_end=true`
- At cancellation/deletion after term completion:
  - Organization rollover subscription created (`context=accelerator_rollover`)

4. Early-cancel / failure behavior
- Cancel before installment completion:
  - verify no rollover subscription is created.
- Simulate payment failure (`past_due`) then recovery:
  - verify installment progression only occurs on successful `invoice.paid`.
- Simulate terminal cancellation from failed payments:
  - verify rollover only if installment completion requirement is satisfied.

5. Existing Organization subscriber check
- Run one-time Accelerator checkout for user already on active/trialing Organization subscription.
- Verify:
  - accelerator purchase is recorded
  - no additional Organization subscription is created.

6. Sign-off artifacts
- Capture:
  - Stripe event ids per scenario
  - Supabase row snapshots (`subscriptions`, `accelerator_purchases`, `stripe_webhook_events`)
  - any deviations + decision notes
- Append summary to `docs/RUNLOG.md` and mark WS-D execution pass complete in `docs/briefs/accelerator-launch-active-worklog.md`.

## Automated Coverage Snapshot (2026-02-07)
- `tests/acceptance/accelerator-billing-lifecycle.test.ts` currently covers:
  - installment parsing fallbacks;
  - installment progression + cancel-at-period-end trigger at limit;
  - non-cycle invoice exclusion;
  - rollover blocked before completion;
  - rollover allowed when completion is reached;
  - legacy monthly cancellation path without installment metadata;
  - no rollover on non-cancellation events;
  - installment counter capping at limit with no duplicate cancel toggles.
- `tests/acceptance/pricing.test.ts` now also covers checkout fallback routing per mode when Stripe is unavailable:
  - organization -> `/my-organization?subscription=trialing`
  - accelerator -> `/my-organization?purchase=accelerator`
  - elective -> `/my-organization?purchase=elective&elective=<slug>`
- `tests/acceptance/pricing-accelerator-checkout-metadata.test.ts` now also covers:
  - organization checkout session mode/line-item metadata contract;
  - elective checkout session mode/line-item metadata contract;
  - accelerator monthly `without_coaching` variant price + metadata contract.
- `tests/acceptance/stripe-webhook-route.test.ts` now covers route-level webhook processing scenarios:
  - missing signature request returns `400`;
  - `checkout.session.completed` with `mode=subscription` upserts the local `subscriptions` row;
  - one-time accelerator checkout with missing `customer` does not create Organization subscription rollover/bundle sub;
  - early monthly cancellation does not create Organization rollover;
  - completed-installment monthly cancellation does create Organization rollover;
  - `customer.subscription.updated` with `status=canceled` and completed installments creates Organization rollover;
  - `customer.subscription.updated` with `status=active` does not create rollover;
  - `customer.subscription.updated` with `status=past_due` does not create rollover;
  - one-time accelerator purchase with an already-active Organization subscription does not create a duplicate Organization subscription;
  - duplicate already-processed webhook event short-circuits with no additional side effects;
  - duplicate event with `processed=false` re-enters processing path (retry-recovery);
  - `invoice.paid` installment progression updates subscription metadata and enables `cancel_at_period_end` at installment limit;
  - non-cycle invoice events do not advance installments;
  - idempotency-lock write failures (non-duplicate DB error) return `500 processing_failed`.
- `tests/acceptance/onboarding.test.ts` now covers both gate states:
  - completed onboarding -> redirect to `/my-organization`;
  - incomplete onboarding -> onboarding page render path (no redirect).
- Remaining matrix items require integration-level Stripe/Supabase execution rather than pure helper-unit assertions.

## Open Decisions (Need Product Confirmation)
- If rollover fails payment immediately, should access be blocked instantly or include a grace period?
