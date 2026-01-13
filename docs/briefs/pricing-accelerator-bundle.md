# Pricing — Accelerator Bundle + Tier Copy Refresh
Status: Done
Owner: Caleb
Priority: P0
Target release: ASAP (launch)

---

## Purpose
- Tighten the `/pricing` page to match the intended tier naming/copy.
- Promote the Accelerator as an add-on/bundle and clarify its relationship to the Platform subscription.
- Enable a Stripe path where buying the Accelerator also starts the Platform subscription with the first month free.

## Current State
- `/pricing` shows three vertical tier cards (Individual, Organization, Accelerator) and a separate “Not sure which plan…” callout.
- Tier feature lists contain redundant items (e.g., “Everything in Free”, duplicate Community Access).
- Roadmap feature visibility (public/private) is expressed via parentheses, not a pill.
- Stripe checkout scaffolding exists (`src/app/(public)/pricing/actions.ts`) but is not wired to pricing CTAs and does not support bundles/add-ons.

## Scope
In scope:
- Move the Accelerator presentation into the mid-page callout slot as a horizontal add-on card.
- Improve the Accelerator dashed border visibility (longer dashes / clearer color).
- Refresh tier feature copy + remove redundancies (Organization list).
- Render Roadmap visibility (Public/Private) as a pill, not parentheses.
- Add Stripe checkout support for:
  - Organization subscription purchase.
  - Accelerator add-on purchase that starts Organization subscription with a free first month.

Out of scope:
- Stripe Dashboard configuration (products/prices/coupons) beyond documenting required IDs.
- Admin reporting for Accelerator purchases (no new tables in this pass).

## UX Flow
- Entry points: `/pricing`
- Primary user path:
  - Anonymous → review tiers → sign up (Individual) or sign in then checkout (Organization/Accelerator).
  - Authed → checkout → return to `/my-organization`.
- Empty / loading / error states:
  - If Stripe keys/price IDs are missing, fall back to the current “trialing” redirect stub.

## UI Requirements
- Screens or components affected: `src/app/(public)/pricing/page.tsx`
- Design patterns to follow: existing shadcn `Card`/`Button` surfaces; Cal.com-inspired spacing.
- Copy updates:
  - Free tier title: “Individual”
  - Organization features:
    - Remove “Everything in Free”
    - Remove duplicate “Community Access”
    - “AI Consultant …” → “AI enabled NFP development”
    - “Fundraising Campaign Tools …” → “Fundraising tools”
    - Roadmap row uses pill: `Roadmap` + `Public` pill; copy emphasizes fundraising tools/frameworks (no “live pitch deck”).
  - Individual features:
    - “501(c)(3) Formation Flow (Guided)” → “Guided 501(c)(3) Formation Flow”
    - “Stripe Connect (Accept donations)” → “Stripe Connect (Accept and track donations)”
    - Roadmap row uses pill: `Roadmap` + `Private` pill.
  - Accelerator features:
    - Add `Roadmap` + `Public` pill.
    - Remove “(Locked to one founder)” from “Single User License”.

## Data & Architecture
- Server actions / routes:
  - Extend `startCheckout` to support:
    - Organization-only subscription checkout.
    - Accelerator bundle checkout (Organization subscription + Accelerator one-time line item, with a free first month on the subscription).
- Env vars:
  - Add optional Stripe price IDs (Organization subscription + Accelerator one-time) used by server actions and rendered into pricing forms.

## Integrations
- Stripe:
  - `mode=subscription` checkout for Organization.
  - Accelerator bundle: `mode=subscription` with 2 line items (subscription + one-time) and `trial_period_days` for the subscription.
- Supabase:
  - Continue using `subscriptions` upserts for status/metadata via existing webhook + success callback.

## Security & Privacy
- Secrets remain server-only (Stripe secret key).
- Price IDs are safe to expose client-side.
- No new PII stored.

## Acceptance Criteria
- `/pricing` shows only the two Platform tiers at the top, and the Accelerator appears as a horizontal add-on card mid-page.
- Accelerator dashed border is visibly stronger than before.
- Organization tier list has no duplicated Community Access and no “Everything in Free”.
- Roadmap rows show a `Public`/`Private` pill.
- If Stripe env vars are configured, Organization checkout and Accelerator bundle checkout redirect to Stripe.
- Accelerator bundle checkout results in a subscription with a free first month (trial) for the Platform.

## Test Plan
- `pnpm lint`
- `pnpm test:acceptance -- pricing`
- If env vars are configured locally, manual QA:
  - Visit `/pricing` authed → purchase flows open Stripe checkout.

## Open Questions
- Exact Stripe price IDs to use in prod (need to be configured and placed in env).
- Whether Accelerator purchase should also be recorded separately in Supabase (future).
