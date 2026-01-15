# Stripe Checkout + Access Gating (Organization + Accelerator)
Status: Draft
Owner:
Priority: P0
Target release: Launch

---

## Purpose
- Ensure paid access is enforced server-side (no UI-only gating).
- Support two paid products: Organization ($/month subscription) and Accelerator ($ one-time payment).
- Prevent unauthorized access to Accelerator routes and content.
- Bundle rule: purchasing Accelerator grants the Organization plan for the first month (trial) so users can publish/share immediately.

## Current State
- Pricing page includes Stripe CTAs and checkout logic, plus webhook-driven subscription sync.
- Some paid gating exists, but Accelerator access is not strictly enforced end-to-end.
- Roadmap “make live” toggle does not clearly enforce Organization subscription requirement.

## Scope
In scope:
- Stripe Checkout for Organization monthly (subscription).
- Stripe Checkout for Accelerator one-time (payment).
- Accelerator bundle: on Accelerator purchase, start an Organization subscription with a 30-day trial (idempotent + retry-safe).
- Webhook idempotency + entitlement sync for both.
- UI gating (nav item visibility) + route protection for `/accelerator/**`.
- Roadmap publish toggle gating for non-Organization users (disabled control + upgrade prompt).

Out of scope:
- Proration, plan changes, and complex tier permutations beyond Organization monthly.
- Discounts and promo permutations beyond “Accelerator includes 30-day Organization trial”.
- Team seat billing / per-seat pricing.

## UX Flow
- Entry points:
  - `/pricing` → “Upgrade Organization” checkout.
  - `/pricing` → “Enroll in Accelerator” checkout.
  - Roadmap page → “Make roadmap live” toggle (Organization only).
- Primary user path:
  - Pay → return → subscription/entitlement appears → UI unlocks.
- Empty / loading / error states:
  - Checkout failure returns a friendly message and retry link.
  - While subscription status resolves, show skeletons or a small “Checking plan…” state.

## UI Requirements
- Hide Accelerator nav item for users without Accelerator entitlement.
- Any attempt to access `/accelerator/**` without entitlement shows a clear 403/upgrade message (no content leakage).
- On roadmap publish toggle: disabled switch + inline upgrade banner/CTA (Organization checkout).

## Data & Architecture
- Tables / fields touched:
  - `subscriptions` (Organization subscription status).
  - Add an entitlement record for Accelerator (either in `subscriptions` or a new table like `purchases`/`entitlements`).
- RLS / permissions:
  - Users can read their own entitlement/subscription status.
  - Admin can read all.
- Server actions / routes:
  - Pricing checkout actions.
  - Webhook handler for Accelerator payment completion.
  - Route guard for `/accelerator/**` (layout-level, server-side check).
- Caching / ISR / no-store:
  - Authed plan status reads should be `no-store`.

## Integrations
- Stripe:
  - Checkout Sessions (subscription + payment).
  - Webhook events:
    - Subscription: `checkout.session.completed`, `customer.subscription.*`
    - Accelerator: `checkout.session.completed`, `payment_intent.succeeded` (as needed)
- Supabase:
  - Persist entitlement/subscription status.

## Security & Privacy
- Verify Stripe webhook signatures.
- Idempotent processing (by Stripe `event_id`) and retry-safe failure handling (do not mark events as processed if side effects fail).
- Server-side authorization for Accelerator content (no relying on client checks).

## Performance
- Keep plan checks minimal (single query/cached helper per request).

## Accessibility
- Disabled toggle is focusable/readable and has an associated explanation.
- Upgrade CTA is keyboard accessible.

## Analytics & Tracking
- Track: pricing_upgrade_click, checkout_started, checkout_success, checkout_cancel, accelerator_locked_view.

## Edge Cases
- User pays but webhook delivery is delayed (show “Processing payment…” state).
- User has Organization but not Accelerator (and vice versa).
- User cancels Organization subscription (loss of roadmap publish access).

## Migration / Backfill
- If adding a new entitlement table: backfill Accelerator purchasers (if any) from Stripe events or existing records.

## Acceptance Criteria
- Users without Accelerator entitlement cannot see Accelerator nav item and cannot access `/accelerator/**` directly.
- Users without Organization subscription cannot enable roadmap public toggle and see an upgrade prompt.
- Stripe webhooks correctly persist entitlement/subscription status with idempotency.

## Test Plan
- Integration tests:
  - Route guard denies Accelerator without entitlement.
  - Roadmap publish toggle disabled for non-Organization.
- RLS tests:
  - Users can only read their own entitlement/subscription.
- Manual QA path:
  - Free user → attempt Accelerator → blocked.
  - Organization subscriber → roadmap publish toggle enabled.
  - Accelerator purchaser → Accelerator nav visible and content accessible.

## Rollout Plan
- Feature flags:
  - Optional `accelerator_entitlements_v1` if needed.
- Deploy steps:
  - Apply migrations → deploy → verify webhooks in Stripe → smoke test.
- Rollback plan:
  - Disable route access (403) if entitlement sync breaks, without exposing content.

## Dependencies
- Stripe price IDs for Organization + Accelerator.
- Decide where Accelerator entitlement should live (new table vs existing subscriptions).

## Open Questions
- Should Accelerator entitlement be lifetime, or time-bound?
- Is Organization subscription required to use Accelerator content, or independent?

## Moonshot
- Unified entitlement system supporting seats, add-ons, and trials.
