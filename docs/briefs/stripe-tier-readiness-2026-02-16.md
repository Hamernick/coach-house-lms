# Stripe Tier Readiness — 3-Tier Model
Status: active
Owner: Caleb + Codex
Last updated: 2026-02-16

## Objective
Validate billing readiness for the simplified pricing model:
- Free
- Organization ($20/mo)
- Operations Support ($58/mo)

## Source of Truth (Code)
- Checkout entrypoint: `src/app/(public)/pricing/actions.ts`
- Billing portal entrypoint: `src/app/(dashboard)/billing/actions.ts`
- Webhook sync/idempotency: `src/app/api/stripe/webhook/route.ts`
- Access gating (team/admin + accelerator):
  - `src/lib/billing/subscription-access.ts`
  - `src/lib/accelerator/entitlements.ts`

## Required Env (Test + Live)
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_ORGANIZATION_PRICE_ID`
- `STRIPE_OPERATIONS_SUPPORT_PRICE_ID`

Notes:
- `STRIPE_OPERATIONS_SUPPORT_PRICE_ID` is required for Operations Support checkout.
- If missing, Operations checkout is disabled in the UI and server action redirects with an explicit pricing error.
- Legacy accelerator/elective price envs still exist for backward compatibility but are no longer part of public checkout flow.

## Current Checkout Contract
`startCheckout` now creates only subscription-mode sessions with metadata:
- `kind: "organization"`
- `plan_tier: "organization" | "operations_support"`
- `planName`
- `user_id`

## Current Management Contract
Users manage subscription state via Stripe Billing Portal from `/billing`.
Expected user actions handled there:
- upgrade/downgrade
- cancel
- resume/reactivate (if enabled in Stripe portal settings)
- payment method updates

## Verified via Automated Tests (2026-02-16)
- `pnpm test:acceptance` ✅
- `pnpm test:rls` ✅

Directly relevant test coverage:
- `tests/acceptance/pricing.test.ts`
- `tests/acceptance/pricing-accelerator-checkout-metadata.test.ts`
- `tests/acceptance/billing.test.ts`
- `tests/acceptance/stripe-webhook-route.test.ts`

## Transition Matrix
1. Free -> Organization ($20)
- Path: `/pricing` -> checkout -> webhook subscription upsert -> entitled access.
- Status: implemented and covered.

2. Organization ($20) -> Operations Support ($58)
- Path: `/pricing` (operations tier checkout) or Billing Portal plan change.
- Status: implemented; webhook/portal sync path covered at integration level.

3. Operations Support ($58) -> Organization ($20)
- Path: Billing Portal plan change.
- Status: supported through Stripe Portal + webhook subscription updates.

4. Paid -> Free (cancel)
- Path: Billing Portal cancellation.
- Status: supported through webhook subscription status updates and entitlement recalculation.

5. Renew/resume
- Path: Billing Portal (Stripe-config dependent).
- Status: supported when enabled in Stripe portal configuration.

## Remaining Ops Tasks
- Confirm live Stripe portal configuration includes allowed plan switches and cancel/resume policy.
- Verify both live price IDs are connected to the production project.
- Run a manual end-to-end smoke in Stripe test mode for all 5 transitions.
- Capture screenshots + webhook event IDs for release QA notes.

## Recommended Manual Smoke (Stripe Test Mode)
1. Create new free user; confirm onboarding completes without payment.
2. Upgrade to Organization from pricing/paywall.
3. Confirm app access unlocks and billing portal opens.
4. Upgrade to Operations Support.
5. Downgrade back to Organization in portal.
6. Cancel and verify paid access is removed after period-end/termination behavior.
7. Resume/reactivate if enabled; confirm access returns.

## Release Gate
Do not ship production rollout until all five transition states are validated in live-mode dry run (internal account) with webhook receipts captured.
