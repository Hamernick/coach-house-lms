# Payment User Journey Hardening Plan (Tester + Production)
Status: Draft for immediate execution
Owner: Caleb + Codex
Date: 2026-02-18

## Objective
Ship a stable, secure, end-to-end payment journey for:
- testers (sandbox Stripe, no auth-email bottlenecks), and
- real users (live Stripe),

while preserving strict access control and production safety.

## Current Problems To Eliminate
1. Tester sign-up intermittently blocked by email rate-limit errors.
2. Checkout CTA can fail with generic `checkout_failed` and weak diagnosability.
3. Inconsistent trust in deploy state (code deployed, but not verifiably observed by stakeholders).
4. Payment journey confidence is low because flows are not validated from one controlled matrix.

## Non-Negotiables
- No relaxed security for real users.
- No bypass of RLS or server-side authorization.
- Stripe webhook signature validation must remain enforced.
- Tier entitlements must be server-derived (never client-trusted).
- Every execution step logged in `docs/RUNLOG.md`.

## Scope
In:
- signup -> onboarding -> paywall -> checkout -> success -> entitlements -> billing portal.
- tester and production payment routes.
- observability, diagnostics, and deploy verification discipline.

Out:
- broad redesign of pricing visuals.
- non-payment product feature work.

---

## Workstream A: Identity/Audience Reliability
Goal: tester accounts never block on verification emails; real users keep normal auth constraints.

Plan:
1. Keep tester-only instant provisioning on `/tester/sign-up` with strict audience tagging.
2. Ensure all tester instructions/entry points route to `/tester/sign-up` and not `/sign-up`.
3. Add clear UI copy in tester auth screens:
   - “Tester route uses sandbox payment + instant verification.”
4. Add one-click fallback runbook for manual tester account rescue (service-role script path).

Acceptance:
- Tester can create account repeatedly without provider email throttle dependency.
- Regular `/sign-up` behavior unchanged.

---

## Workstream B: Checkout Path Unification
Goal: one stable checkout entry path used by paywall and pricing surfaces.

Plan:
1. Use `GET /api/stripe/checkout` as the canonical checkout launcher for paid plans.
2. Normalize accepted params:
   - `plan=organization|operations_support`
   - `source=<safe string>`
3. Keep audience-aware Stripe runtime selection in route:
   - tester -> test keys/prices
   - production user -> live keys/prices
4. Migrate all paid CTA surfaces to canonical route (no mixed form/server-action pathing for paywall).
5. Preserve login redirect continuity when unauthenticated.

Acceptance:
- Clicking paid CTA always goes to Stripe Checkout or returns a specific diagnostic error code.
- No silent same-page refresh loops.

---

## Workstream C: Error Diagnostics + Observability
Goal: every checkout failure is actionable within one debugging pass.

Plan:
1. Replace generic failure-only behavior with structured diagnostics:
   - error source, plan tier, audience mode, stripe error type/code/param.
2. Add correlation key:
   - append request-scoped debug token in redirect error query (non-sensitive).
3. Persist checkout attempts/failures to a lightweight internal event table (or centralized logger payload format) for trend analysis.
4. Add production log query runbook with exact commands.

Acceptance:
- On any failure, we can identify root cause within one click reproduction.

---

## Workstream D: Entitlements + Lifecycle Integrity
Goal: post-payment access is deterministic and secure.

Plan:
1. Verify webhook processing for both Stripe modes against current tier IDs.
2. Ensure subscription metadata always includes:
   - `plan_tier`
   - `stripe_mode`
   - `user_id` and org context.
3. Validate transitions:
   - free -> $20
   - $20 -> $58
   - $58 -> $20
   - paid -> cancel -> free behavior
4. Verify billing portal session creation supports both tester/live customers and returns correct mode.

Acceptance:
- Entitlements in app update correctly after Stripe lifecycle events.

---

## Workstream E: QA Matrix + Test Protocol
Goal: stop ad-hoc testing and run a single repeatable matrix.

Test matrix (minimum):
1. Tester new account -> onboarding -> choose $20 -> checkout opens.
2. Tester new account -> onboarding -> choose $58 -> checkout opens.
3. Tester existing free -> paywall -> $20.
4. Real user free -> live $20.
5. Real user $20 -> upgrade $58.
6. Real user $58 -> downgrade $20.
7. Billing portal open for tester and real user.

For each row capture:
- route entered
- CTA clicked
- resulting URL
- Stripe mode expected vs observed
- entitlement result.

Acceptance:
- 100% pass on matrix before calling “good to go”.

---

## Workstream F: Deployment Discipline
Goal: remove ambiguity around what is live.

Plan:
1. Always execute:
   - `git rev-parse HEAD`
   - `git ls-remote --heads origin main`
   - `npx vercel deploy --prod --yes`
   - `npx vercel inspect coach-house-platform.vercel.app`
2. Post deployment tuple every time:
   - commit SHA
   - deployment ID
   - created timestamp
   - alias target URL.
3. Use one canonical project linkage check:
   - `.vercel/project.json` + `vercel project inspect`.

Acceptance:
- Stakeholder can match code and live deploy without ambiguity.

---

## Execution Sequence
Phase 1 (Immediate unblock, today)
1. Complete A + B + C.
2. Run tester matrix rows 1-3 with live observation.
3. Fix any residual failures before expanding scope.

Phase 2 (Stability)
1. Complete D.
2. Run full matrix rows 1-7.
3. Lock runbook + troubleshooting doc.

Phase 3 (Hardening)
1. Add regression tests for checkout route logic and mode selection.
2. Add alerting thresholds for repeated checkout failures.

## Commands/Gates
- `pnpm lint`
- `pnpm build`
- `pnpm test:snapshots`
- `pnpm test:acceptance`
- `pnpm test:rls`

## Completion Definition
The payment journey is “complete/strong/secure/good to go” when:
1. Tester onboarding and checkout are repeatable without email throttle blockers.
2. Real payment flow works in production with correct live Stripe routing.
3. Entitlements reflect subscription state transitions without manual correction.
4. Failures are diagnosable from logs/events in one pass.
5. Deployment provenance is explicit and verifiable every time.

