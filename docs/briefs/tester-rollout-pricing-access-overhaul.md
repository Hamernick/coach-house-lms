# Tester Rollout + Pricing/Access Overhaul Plan
Status: Approved
Owner: Caleb + Codex
Priority: P0
Target release: Tester-ready today, production rollout after QA gates
Last updated: 2026-02-16

---

## Purpose
- Convert current launch flow to a simpler 3-tier model (`Free`, `$20/mo`, `$58/mo`) with accurate copy, consistent entitlement behavior, and clean paywalls.
- Separate admin/test tooling from normal user UX so regular users never see internal controls.
- Keep onboarding friction low: complete account/org setup first, then present a skippable paywall + upgrade flow.
- Ship this as an iterative, testable sequence so external testers can run today.

## Decision Lock (from this planning session)
- Pricing model:
  - Tier 1: `Free`
  - Tier 2: `$20/mo` (`Organization`) includes Accelerator
  - Tier 3: `$58/mo` (`Operations Support`) includes Accelerator + discounted coaching + expert network access language
- Remove pricing surfaces for:
  - `Accelerator Pro`
  - `Accelerator Base`
  - `Buy Electives only`
- Electives are no longer paywalled.
- Test/dev tool access:
  - Regular users: no admin/testing tooling.
  - Testers: testing/tutorial/payment playground tools only (no seed actions).
  - Admins: full tooling, including seed actions.
- Onboarding:
  - Add early “user type / intent” selection.
  - Some intents are `Coming soon` and disabled.
  - Do not block initial onboarding completion behind payment.
  - Show skippable paywall after onboarding completion.
- Accelerator card visuals:
  - Remove gradient + grid treatment on Accelerator module cards.
  - Keep card shells and icon containers.
  - Keep gradient/grid on Strategic Roadmap cards.

## Non-Negotiable Standards (from AGENTS/docs contracts)
- Follow `AGENTS.md` + `docs/agent/**` as canonical contract.
- Security defaults stay intact:
  - Server-side authz
  - RLS enforcement
  - Stripe webhook signature verification
  - Stripe idempotency (`event_id`)
- Run validation gates for rollout branches:
  - `pnpm lint`
  - `pnpm test:snapshots`
  - `pnpm test:acceptance`
  - `pnpm test:rls`
- Append each implementation session summary to `docs/RUNLOG.md`.

## Current-State Audit Highlights (already confirmed)
- `react-grab` currently runs only in development, but is effectively default-on in dev unless env explicitly disables it (`src/components/dev/react-grab-loader.tsx`).
- Admin test controls live in `src/components/nav-user.tsx` and are role-gated by `isAdmin`.
- Paywall overlay currently still exposes legacy Accelerator Pro/Base and elective purchase flows (`src/components/paywall/paywall-overlay.tsx`).
- Checkout action currently supports `organization | accelerator | elective` modes (`src/app/(public)/pricing/actions.ts`).
- Webhook + lifecycle logic currently supports accelerator/elective purchases and rollover paths (`src/app/api/stripe/webhook/route.ts`).
- Billing portal exists and can handle self-serve subscription management when Stripe is configured (`src/app/(dashboard)/billing/actions.ts`).

## Scope
In scope:
- Pricing + copy + entitlements + paywall realignment to 3-tier strategy.
- Admin/tester/dev tooling governance and visibility controls.
- Onboarding intent step and skippable post-onboarding paywall.
- Tutorial refresh and route walkthrough verification.
- Stripe dev/test/prod readiness and subscription lifecycle checks.

Out of scope (this cycle):
- Full redesign of pricing page layout pattern (keep existing structure).
- New standalone role model replacing current `profiles.role` + org membership roles.
- New seed datasets for testers (testers should use real input, no seed controls).

## Workstream Architecture

### WS1 — Tooling Governance (Admin vs Tester vs Member)
Goal: centralize all internal tool visibility in one policy layer.

Implementation direction:
- Add a single resolver for tooling permissions (example: `src/lib/devtools/access.ts`):
  - `canSeeTestingPanel`
  - `canRunSeedActions`
  - `canUsePaymentPlayground`
  - `canReplayTutorials`
- Introduce explicit tester switch (non-destructive):
  - recommended: `profiles.is_tester boolean default false`
  - keep `profiles.role` for platform admin authorization (`member/admin`) only.
- Update UI consumers (`nav-user`, any testing FABs) to use this resolver.

Acceptance:
- Regular members never see internal testing controls.
- Testers see test/tutorial/payment tools but not seed actions.
- Admins keep full controls.

---

### WS2 — Pricing Strategy Consolidation (3 tiers only)
Goal: make all pricing surfaces and copy consistent with new business model.

Implementation direction:
- Update pricing surface content + comparison matrix:
  - `src/components/public/pricing-surface.tsx`
  - `src/app/(public)/pricing/page.tsx` metadata if needed
- Remove/deprecate accelerator split cards (`Pro/Base`) and elective-only purchase section.
- Replace “Fee-for-service” copy with expert-network language:
  - “Access our expert network”
  - “Hire specialists as needed”
  - “Contract support through our professional marketplace”
- Ensure all button labels/feature checks match tier reality.

Acceptance:
- Only 3 tiers are visible.
- No stale references to separate accelerator plans or elective checkout cards.
- Copy is clear, modern, and internally consistent across hero/cards/table/CTA text.

---

### WS3 — Entitlements + Checkout + Billing Lifecycle
Goal: enforce new access model at server level and keep subscriptions manageable.

Implementation direction:
- Checkout action (`src/app/(public)/pricing/actions.ts`):
  - remove public entry paths for `accelerator` and `elective` purchases.
  - support tier-specific checkout for `$20` and `$58` only, with metadata for plan tier.
- Entitlements (`src/lib/accelerator/entitlements.ts`):
  - Accelerator access granted by paid tiers (`$20`/`$58`) and admin.
  - Electives included with accelerator access.
  - remove per-elective purchase dependency from user-facing logic.
- Paywall overlay (`src/components/paywall/paywall-overlay.tsx`):
  - show only relevant upgrade choices tied to 3-tier model.
- Billing flows:
  - verify upgrade/downgrade/cancel/resume through Stripe portal + webhook sync.
  - ensure “downgrade to free” semantics are explicit and reflected in app gating.

Acceptance:
- Paid-tier users get accelerator + electives access.
- Free users do not get accelerator/admin-only capabilities.
- Portal and webhook updates reflect status changes reliably.

---

### WS4 — Onboarding + Intent Selection + Post-Onboarding Paywall
Goal: preserve conversion to account creation, then offer upgrade path without blocking setup.

Implementation direction:
- Onboarding UI:
  - add a new early intent step/cards (Find/Build/Fund/Board/Team language set).
  - mark selected intents as `Coming soon` (disabled) per decision.
  - keep core org/account onboarding completion fast.
- Persistence:
  - save intent choice (or skipped choice) to profile/org metadata.
- Post-onboarding:
  - show skippable paywall panel in main canvas.
  - prefill checkout inputs with known account name/email where safe.
  - allow return to paywall later from consistent entry points.

Acceptance:
- User can always complete onboarding without paying.
- Paywall can be skipped and revisited.
- Intent selection behaves as designed and disabled options cannot be selected.

---

### WS5 — Accelerator UI Visual Adjustments
Goal: remove non-target visual treatment while preserving existing component structure.

Implementation direction:
- Remove gradient + grid background from accelerator module cards:
  - `src/components/accelerator/start-building-pager.tsx`
  - `src/components/accelerator/accelerator-next-module-card.tsx`
- Preserve card shell, icon container, spacing, and status elements.
- Keep Strategic Roadmap card visuals unchanged.

Acceptance:
- Accelerator module cards no longer render gradient/grid backgrounds.
- Strategic Roadmap cards still render existing visual pattern.

---

### WS6 — Tutorial + Route Journey Audit
Goal: ensure first-time flow and guidance are aligned with new pricing/access model.

Implementation direction:
- Audit and refresh tutorial copy/targets:
  - `src/components/tutorial/tutorial-manager.tsx`
  - welcome/onboarding handoff components
- Produce final route walkthrough doc after implementation:
  - signup -> onboarding -> paywall -> app surfaces -> billing management paths
- Verify testing controls visibility on all key pages for admin/tester/member personas.

Acceptance:
- Tutorials point to current UI elements and flows.
- No broken tutorial targets.
- Route walkthrough is complete and reproducible.

---

### WS7 — Stripe Environment + Ops Readiness
Goal: ensure test/dev/prod configs all support the simplified pricing strategy.

Implementation direction:
- Validate env map for:
  - test mode prices (`$20`, `$58`)
  - live mode prices (`$20`, `$58`)
  - webhook secret(s), portal config
- Stripe CLI + local webhook replay checklist.
- Confirm subscription transition matrix:
  - free -> $20
  - $20 -> $58
  - $58 -> $20
  - paid -> canceled/free
  - renew/resume path

Acceptance:
- All plan transitions work in test mode and are reflected in app entitlements.
- No orphaned states between Stripe and Supabase after webhook processing.

## Sequential Execution Plan

### Phase 0 (Now, blocker removal)
1. Create tooling-permission contract and file grouping for dev/test tools.
2. Lock down seed actions to admin only.
3. Make `react-grab` opt-in (explicit enable flag), never active in production/public.

### Phase 1 (Today’s tester-critical path)
1. Collapse pricing to 3 tiers in UI/copy.
2. Remove legacy accelerator/elective purchase surfaces from paywall + pricing page.
3. Wire checkout + entitlement logic to paid tier model (`$20`, `$58`).
4. Run payment smoke in Stripe test mode.

### Phase 2
1. Add onboarding intent step with disabled “coming soon” options.
2. Add skippable post-onboarding paywall in main UI canvas.
3. Prefill checkout with known identity fields.

### Phase 3
1. Apply accelerator module-card visual updates.
2. Refresh tutorials to new flow targets.
3. Complete full route walkthrough documentation.

### Phase 4 (stabilization)
1. Execute full QA matrix + regression tests.
2. Patch copy and edge-case regressions.
3. Release to tester cohort, then production.

## File-Level Change Map (expected)
- Tooling/access:
  - `src/components/nav-user.tsx`
  - `src/components/app-shell.tsx`
  - `src/components/dev/react-grab-loader.tsx`
  - `src/lib/devtools/access.ts` (new)
- Pricing/paywall:
  - `src/components/public/pricing-surface.tsx`
  - `src/app/(public)/pricing/page.tsx`
  - `src/components/paywall/paywall-overlay.tsx`
- Billing/entitlements/checkout:
  - `src/app/(public)/pricing/actions.ts`
  - `src/lib/accelerator/entitlements.ts`
  - `src/app/api/stripe/webhook/route.ts` (if metadata/state handling changes)
  - `src/app/(dashboard)/billing/actions.ts`
  - `src/app/(dashboard)/billing/page.tsx`
- Onboarding:
  - `src/components/onboarding/onboarding-dialog.tsx`
  - `src/app/(dashboard)/onboarding/actions.ts`
  - optional profile schema/migrations for tester/intent fields
- Tutorials:
  - `src/components/tutorial/tutorial-manager.tsx`
  - `src/components/onboarding/onboarding-welcome.tsx`
- Accelerator cards:
  - `src/components/accelerator/start-building-pager.tsx`
  - `src/components/accelerator/accelerator-next-module-card.tsx`

## Copywriting Standards for This Pass
- Plain-language, benefit-first, no jargon.
- One idea per bullet.
- Avoid redundant feature bullets across tiers.
- Keep “included vs add-on vs available through network” explicit.
- Replace “fee-for-service” with clearer “expert network / hire specialists / contract support” phrasing.

## QA Plan (required)
- Automated:
  - `pnpm lint`
  - `pnpm test:snapshots`
  - `pnpm test:acceptance`
  - `pnpm test:rls`
- Manual persona pass:
  - Member (free)
  - Tester (non-admin)
  - Admin
- Manual flow pass:
  - signup/onboarding/paywall skip + return
  - each subscription transition in Stripe test mode
  - billing portal open + return + reflected status

## Rollout Plan
- Feature flag approach for risky deltas:
  - `pricing_v3_enabled`
  - `post_onboarding_paywall_enabled`
  - `devtools_audience_policy_v1`
- Deploy order:
  1. schema flags (if needed)
  2. entitlement + checkout backend
  3. pricing/paywall UI
  4. onboarding/tutorial updates
  5. visual polish + final QA
- Rollback:
  - Keep legacy pricing/paywall code path behind temporary flag until sign-off.

## Resources We Will Use
- Internal:
  - `AGENTS.md`
  - `docs/agent/workflow-quality.md`
  - `docs/briefs/stripe-gating.md`
  - `docs/briefs/accelerator-billing-lifecycle-qa-matrix.md`
  - `docs/briefs/onboarding-simplification.md`
  - `docs/briefs/pricing-page.md`
- External/official:
  - Stripe official docs for Checkout, Customer Portal, subscriptions, and webhook event contracts.

## Open Questions (to resolve before WS2/WS4 implementation)
1. Are electives included only for paid tiers, or also for free users?
2. Final naming for the `$58` tier card title (`Operations Support` vs another label)?
3. Final disabled intent options in onboarding:
   - confirm exact set marked `Coming soon`.
4. Should tester-only payment playground be shown in production for tester accounts, or staging/dev only?

## Iterative Execution Mode
- We will execute in strict sequence: WS1 -> WS2 -> WS3 -> WS4 -> WS5 -> WS6 -> WS7.
- We will not parallelize risky flow changes (checkout/entitlements/onboarding) in the same commit.
- Each workstream ends with:
  - diff summary
  - test results
  - route verification notes
  - RUNLOG entry
