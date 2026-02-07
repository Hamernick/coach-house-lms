# Stripe Checkout + Entitlement Gating
Status: Active
Owner: Caleb + Codex
Priority: P0
Last updated: 2026-02-06

---

## Purpose
- Keep Stripe checkout + entitlement behavior deterministic across Organization, Accelerator, and Elective purchases.
- Enforce server-side gating (no UI-only access control).
- Document current lifecycle rules for Accelerator one-time and monthly billing.

## Current Billing Contracts
- Organization:
  - `$20/month` Stripe subscription (`kind` implicit or Organization metadata).
- Accelerator one-time:
  - Stripe `mode=payment` purchase record in `accelerator_purchases`.
  - Provisions Organization subscription with 180-day trial (`context=accelerator_bundle_one_time`).
- Accelerator monthly:
  - Stripe `mode=subscription` with metadata:
    - `kind=accelerator`
    - `accelerator_billing=monthly`
    - `accelerator_installment_limit=10`
    - `accelerator_installments_paid` incremented via webhook.
  - On each eligible `invoice.paid`, installment count increments.
  - At installment limit, subscription is set `cancel_at_period_end=true`.
  - On canceled/deleted state *after installment completion*, webhook provisions Organization `$20/month` rollover (`context=accelerator_rollover`) if no active/trialing subscription already exists.
- Coaching link routing:
  - Included/pro tier booking uses `NEXT_PUBLIC_MEETING_FREE_URL` when configured.
  - Default included booking fallback is `https://calendar.app.google/EKs5A4iaXFAbFSp57`.
- Elective add-ons:
  - One-time `mode=payment` purchase tracked in `elective_purchases`.

## Entitlement + Access Rules
- Accelerator content access:
  - Granted by active Accelerator purchase and/or active/trialing subscription status path.
- Organization-gated capabilities:
  - Must be enforced from server reads of subscription state/metadata.
- Coaching scheduling:
  - Uses entitlement + usage logic from dedicated scheduling route; independent from UI-only state.

## Webhook Rules
- Signature verification is mandatory.
- Event idempotency lock in `stripe_webhook_events` is mandatory.
- Do not mark event processed if side effects fail.
- Required event families:
  - `checkout.session.completed`
  - `customer.subscription.*`
  - `invoice.paid` (installment metering)

## Data Surfaces
- `subscriptions`
  - Source for active/trialing/canceled status + lifecycle metadata.
- `accelerator_purchases`
  - One-time accelerator ownership and coaching-included variant state.
- `elective_purchases`
  - Owned elective module slugs.

## Security Requirements
- Webhook signature verification.
- Server-side authz for accelerator and organization capabilities.
- RLS on all entitlement tables.
- No entitlement checks derived exclusively from client state.

## Open Decisions
- Grace-period policy for failed rollover charge attempts.

## Related Docs
- `docs/briefs/accelerator-launch-active-worklog.md` (WS-J live status)
- `docs/briefs/accelerator-billing-lifecycle-qa-matrix.md` (QA execution matrix)
