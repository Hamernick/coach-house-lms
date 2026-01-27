# Electives Add-Ons (Paid Modules + Accelerator Discount)
Status: Draft
Owner:
Priority: P0
Target release: Launch

---

## Purpose
- Monetize Electives as paid, lifetime add-ons (per-elective purchases).
- Offer Accelerator purchasers a discounted elective price ($25 each) vs non-Accelerator purchasers ($100 each).
- Make elective access enforceable server-side (no UI-only gating) and manageable post-purchase.

## Current State
- Electives exist as lessons/modules in the `classes`/`modules` curriculum (sidebar shows a separator when a class slug includes `electives`) (`src/components/app-sidebar/classes-section.tsx`).
- `/academy/electives` routes are placeholders (no real content, no purchase flow) (`src/app/(dashboard)/academy/electives/page.tsx`, `src/app/(dashboard)/academy/electives/[slug]/page.tsx`).
- Stripe flows exist for:
  - Organization subscription checkout (`/pricing` → Stripe Checkout subscription).
  - Accelerator one-time purchase (`/pricing` → Stripe Checkout payment) with lifetime access via `accelerator_purchases`.
  - Bundle rule: Accelerator purchase starts Organization with a 30-day trial (first month free) via webhook/success handling.
- Billing page currently opens Stripe Customer Portal (subscription management), but has no one-time add-on management UI (`src/app/(dashboard)/billing/page.tsx`).

## Scope
In scope:
- Add Electives as first-class paid add-ons with entitlements stored in Supabase.
- Stripe Checkout support for Electives:
  - Standalone Electives purchase (payment mode).
  - Accelerator checkout flow that can include Electives as promoted add-ons in the same checkout.
- Pricing logic:
  - If the user already has Accelerator entitlement (or is purchasing Accelerator in the same checkout), Electives cost $25 each.
  - Otherwise Electives cost $100 each.
- Server-side access control:
  - Locked Elective modules do not render paid content unless entitled.
  - Locked Elective modules are excluded from search results.
  - UI visibility matches entitlements (sidebar/module lists show locked or hidden states).
- Post-purchase management:
  - A minimal “Add-ons” section in Billing/Settings showing purchased Electives and a “Buy more electives” flow.
- Lifetime access:
  - Electives purchases remain accessible even if the Organization subscription is canceled.

Out of scope (for launch unless explicitly pulled in):
- Seat-based elective pricing.
- Refund handling automation (beyond marking refunded in DB).
- Admin UI for managing Electives catalog/prices (we can hardcode the elective list for launch and backfill later).

## UX Flow
- Entry points:
  - Accelerator overview: “Electives” section showing available electives + price (discounted if eligible).
  - During Accelerator checkout: optional add-on selection step before redirecting to Stripe.
  - Billing/Settings: “Add-ons” section with purchased electives + “Buy more electives”.
  - Direct navigation to an elective module: show locked page with CTA if not purchased.
- Primary user paths:
  1) Accelerator buyer → selects electives (optional) → Stripe checkout → return → electives unlocked.
  2) Non-accelerator user → buys a single elective → return → elective unlocked (without Accelerator access).
  3) Existing user later buys more electives from Billing/Settings or Accelerator overview.
- States:
  - Loading: “Checking access…” while entitlements resolve (server-first; minimal client spinners).
  - Empty: no electives available (admin/config issue) shows a friendly placeholder.
  - Error: Stripe unavailable → show “Contact support” fallback + no broken UI.

## UI Requirements
- Accelerator overview (`/accelerator`):
  - Add a dedicated “Electives” section below Progress/Start Building, with cards for each elective.
  - Each elective card shows: title, 1-line description, price, “Owned” state, and “Buy” CTA when locked.
  - If user has Accelerator entitlement: show “Accelerator discount” pill and $25 price.
  - If not: show $100 price and a small note that Accelerator owners get discounted electives.
- Module pages (elective modules only):
  - If not entitled: show a lock state and CTA to purchase (do not show lesson content).
  - If entitled: behave normally (full content, progress tracking).
- Sidebar/module list:
  - Elective modules should be clearly marked (e.g., “Add-on” or lock icon).
  - Clicking locked modules should route to the locked view (no content leakage).
- Billing/Settings:
  - Add a lightweight “Add-ons” panel: Accelerator status + purchased electives list + “Buy more electives”.
  - “Buy more electives” triggers the same in-app selection UI → Stripe checkout.

## Data & Architecture
- Tables / fields:
  - Add `elective_purchases` (or more generic `content_entitlements`) with:
    - `user_id` FK → `auth.users`
    - `elective_key` (slug or module/class id reference)
    - Stripe identifiers: `stripe_checkout_session_id`, `stripe_payment_intent_id`, `stripe_customer_id`, `stripe_price_id`
    - `status` (`active`, `refunded`)
    - timestamps (`created_at`, `updated_at`)
    - Unique constraint on `(user_id, elective_key)` (lifetime access)
    - Unique on checkout session id / payment intent id for idempotency
- RLS:
  - Users can `select` their own purchases; admins can manage all.
  - Writes should be webhook/service-role only (mirror the `subscriptions` stance).
- Server actions / routes:
  - Extend pricing checkout action(s) to support:
    - Electives-only checkout
    - Accelerator+Electives checkout (single Stripe payment session)
  - Webhook handler:
    - On checkout completion, record elective purchases based on line items (price ids) and user id.
    - Maintain idempotency via existing `stripe_webhook_events` pattern.
- Search:
  - `/api/search` should filter out elective results unless the user has purchased them (plus admins).
- Entitlement helper:
  - Add a shared helper for “has accelerator?” + “has elective X?” used by sidebar, module routes, and search.

## Integrations
- Stripe
  - Products/prices:
    - One price per elective at $100 (standard).
    - One price per elective at $25 (accelerator discount).
    - Accelerator one-time purchase price (existing).
  - Checkout:
    - payment-mode sessions for elective purchases (alone or bundled with accelerator).
  - Webhooks:
    - `checkout.session.completed` + payment intent events as needed.
    - Continue `customer.subscription.*` for Organization plan.
- Supabase
  - Store entitlements, enforce RLS, keep service-role writes for payment-driven tables.

## Security & Privacy
- Server-side authorization for all elective content.
- Verify webhook signatures; no entitlement writes from the client.
- Idempotent processing: do not mark Stripe events processed if any entitlement writes fail.

## Performance
- Avoid N+1 entitlement checks; fetch all elective entitlements in one query where possible.
- Keep elective promo UI RSC-first with a minimal client checkout trigger.

## Accessibility
- Locked states have clear labels and CTAs; don’t rely on color-only cues.
- Purchase flows are keyboard accessible; focus management on modals/drawers.

## Analytics & Tracking
- Track: elective_upsell_view, elective_checkout_started, elective_checkout_success, elective_locked_view, elective_owned_click.

## Edge Cases
- Buying electives and accelerator in the same checkout: must apply discounted elective prices.
- Webhook delays: show “Processing purchase…” state on return page until entitlements appear.
- Refunds: if Stripe refunds a payment intent, mark the corresponding elective purchase as `refunded` (future automation).

## Migration / Backfill
- Create `elective_purchases` table and RLS policies.
- No backfill required unless we already sold electives via Stripe manually.

## Acceptance Criteria
- Non-entitled users cannot access elective module content and do not see electives in search results.
- Elective purchase grants lifetime access, independent of subscription status changes.
- Accelerator purchasers see $25 elective pricing; non-accelerator users see $100 pricing.
- Users can purchase electives during Accelerator checkout and later via Billing/Settings.
- Passes: `pnpm lint`, `pnpm test:snapshots`, `pnpm test:acceptance`, `pnpm test:rls`.

## Test Plan
- Acceptance:
  - Search filtering for elective results when not entitled.
  - Route guard / locked view for elective modules.
  - Pricing logic: accelerator-entitled vs not.
- RLS:
  - Users can read only their own elective purchases.
  - Users cannot insert/update/delete elective purchases.

## Rollout Plan
- Add migrations and deploy.
- Configure Stripe price IDs in Vercel env.
- Add webhook endpoint + events in Stripe dashboard.
- Smoke test: buy accelerator + elective, buy elective-only, cancel subscription, verify elective access persists.

## Dependencies
- Definitive elective catalog (which modules count as electives and their labels/descriptions).
- Stripe product/price IDs for elective standard + discounted prices.

## Open Questions
- Do we sell electives to platform-only users at launch, or only to Accelerator purchasers?
- Should elective access live under `/academy/electives`, `/accelerator`, or both?
- Should electives appear in sidebar if locked, or be hidden until purchased?

## Moonshot
- Unified “Entitlements” system for all add-ons (Accelerator, electives, AI credits, future coaching packs) with admin tooling.

