# Accelerator Launch Active Worklog
Status: In Progress
Owner: Caleb + Codex
Priority: P0
Last updated: 2026-02-07

---

## Purpose
- Keep one source of truth for what is still open before evaluator onboarding.
- Sequence work in safe phases so design-system alignment improves without regressions.
- Track decisions, assumptions, and immediate next actions.

## Current Build Direction
- Primary progression surface on `/accelerator` becomes `RoadmapRailCard`.
- `StartBuildingPager` lessons/modules are integrated into that same progression surface, not shown as a disconnected block.
- A top inline org snapshot strip (not wrapped by parent card title chrome) anchors context and readiness.
- Progress rail uses checkpoint semantics (`Fundable`, `Verified`) with deterministic color states.

## Open Workstreams (Consolidated)

## Incremental Execution Queue (Current)
- INC-01 (done): readiness missing-criteria checklist UI in accelerator snapshot (linked to exact destinations).
- INC-02 (done): calendar parity spacing pass (accelerator calendar layout/margins normalized toward `/my-organization` surface tokens).
- INC-03 (done): pricing/home-canvas scroll boundary QA pass in tests (browser route-handoff smoke still optional).
- INC-04 (done): deterministic full-case demo seed verification run + fixture consistency checks.
- INC-05 (done): readiness criteria score visibility + admin audit notes surface.
- INC-06 (done): pricing section behavior contract + acceptance coverage for scrollable panel and handoff rules.
- INC-07 (done): seed-script CI guardrail (`--dry-run`) integration and docs update in runbook.
- INC-08 (done): readiness checklist deep-link refinement (module-specific direct links for each missing criterion).
- INC-09 (done): full-account seed realism pass (idempotent profile/settings seeding, calendar event duration fix, and stricter fixture validation/status reporting).
- INC-10 (done): readiness + journey strategy expansion (evidence matrix, gap analysis, game-theory/flywheel model, and v1 completion checklist).
- INC-11 (done): residual lock-model cleanup in accelerator/sidebar module UX (normalize locked -> not started labels while keeping entitlement redirects).
- INC-12 (done): WS-D tier-path QA coverage pass (pricing checkout fallback routes for org/accelerator/elective, organization/elective Stripe metadata assertions, onboarding incomplete/completed gate assertions).
- INC-13 (done): webhook route acceptance coverage for WS-D lifecycle scenarios (early monthly cancellation no-rollover, completed-installment cancellation rollover, one-time accelerator purchase with existing org subscription no-duplicate).
- INC-14 (done): webhook idempotency + invoice lifecycle route coverage (already-processed duplicate event short-circuit and invoice installment metadata/cancel-at-period-end progression assertions).
- INC-15 (done): webhook retry/no-op route coverage (duplicate event with unprocessed payload retries successfully; non-cycle invoice path does not advance installments).
- INC-16 (done): webhook edge/error path coverage (missing signature `400`, and idempotency lock non-duplicate failure returns `500 processing_failed`).
- INC-17 (done): webhook `customer.subscription.updated` transition coverage (completed-installment + canceled status rolls over; active status does not roll over).
- INC-18 (done): accelerator calendar parity spacing pass (board calendar surface/container/padding aligned to `/my-organization` calendar token rhythm while preserving functionality).
- INC-19 (done): webhook acceptance test output cleanup (expected error-path console noise suppressed via scoped console spy for cleaner launch QA logs).
- INC-20 (done): webhook checkout subscription-mode coverage (`checkout.session.completed` with `mode=subscription` now asserted to upsert local subscription row with expected metadata/customer/status).
- INC-21 (done): webhook additional edge coverage (`customer.subscription.updated` `past_due` no-rollover and one-time accelerator checkout with missing `customer` no org subscription creation).
- INC-22 (done): WS-D live-execution runbook documented (staging/pre-prod checklist with deterministic step-by-step verification and sign-off artifacts).
- INC-23 (done): seed fixture determinism hardening (centralized org-people/org-profile builders + required org-profile key/shape validation in dry-run checks).
- INC-24 (done): accelerator progress type hardening (removed `locked` from `ModuleCardStatus`, normalized DB status parsing, and removed residual lock branches from accelerator/my-org/roadmap module UI paths).
- INC-25 (done): accelerator checkout metadata coverage extension (monthly `without_coaching` variant now explicitly asserted for price selection + metadata contract).
- INC-26 (done): roadmap ordering + notifications cleanup pass (shared Formation/electives ordering helper wired into roadmap timeline cards, inbox-only notifications query to match UI, and snapshot lessons counter no longer falls back to deliverables).
- INC-27 (done): ordering unification follow-up (accelerator page group normalization now also uses shared module-order helper, with full acceptance + lint sweep to lock deterministic Formation-first sequencing end-to-end).
- INC-28 (done): org chart runtime quality upgrade (hierarchical non-overlapping React Flow layout, pan/zoom usability fixes, auto-layout control, saved node-position API route, and seeded people expansion to 100+ records for stress testing).
- INC-29 (done): roadmap/module UX stabilization follow-up (Formation-first ordering heuristics hardened for mixed legacy elective index schemes so paid add-ons cannot jump ahead of core modules, plus accelerator module rich-text assignment editors now use roadmap-parity minimum heights for consistent workspace depth).
- INC-30 (done): org chart interaction-mode pass (default pan mode + explicit move-nodes mode toggle, expanded canvas translation bounds for large seeded datasets, and clearer interaction affordances in-canvas).
- INC-31 (done): pricing copy/packaging clarity pass (Accelerator plan switch labels updated to `Pay once`/`Pay monthly`, billing continuation language normalized, and Pro coaching-link lifecycle now stated clearly in both card checklists and feature breakdown rows without raw URL clutter).
- INC-32 (done): org chart stability rollback + hierarchy hardening (removed interaction-mode toggle and node-drag mutation loop, switched to deterministic global hierarchy layout, capped canvas node density for runtime safety, and added below-canvas overflow cards grouped by category for people that exceed stable chart capacity).
- INC-33 (done): targeted launch-account seed execution (ran dry-run fixture verification and full live seed for `caleb@bandto.com` with `variant=with_coaching` + `progress=mixed`, refreshing deterministic org/profile/people/program/roadmap fixtures).
- INC-34 (done): targeted seed correction for primary account (`caleb.hamernick@gmail.com`) with safe existing-user behavior (no forced password rotation), plus script hardening so password updates only occur when explicitly requested via `--password`.

### WS-A Accelerator progression redesign
Status: In progress
- Convert roadmap rail into the main progression system.
- Re-introduce visible winding connector path with stronger contrast.
- Keep section cards as `Deliverables` and module cards as `Lessons` with connected iconography semantics.
- Preserve lesson track switching while reducing cognitive load and layout compression.
- Move current welcome copy into a dedicated welcome dialog card (style spec pending).

### WS-B Top org snapshot strip on `/accelerator`
Status: In progress
- Add mini org snapshot above progression system.
- Use horizontal composition:
  - left: header/media/identity block
  - right: status rows + completion stats + actions
- Remove parent card-title wrapper behavior for this surface.
- Progress rail redesign:
  - base neutral rail
  - checkpoint 1 (`Fundable`) icon marker + tooltip
  - checkpoint 2 (`Verified`) icon marker + tooltip
  - pre-checkpoint: orange
  - checkpoint 1 reached: segment 1 green, segment 2 neutral
  - checkpoint 2 reached: full green
  - progress label text uses `Progress` (not `Readiness Progress`)

### WS-C Curriculum + entitlement integrity
Status: In progress
- Ensure Formation modules are first in learner sequence.
- Keep electives separate and paid-gated:
  - `retention-and-security`
  - `due-diligence`
  - `financial-handbook`
- Keep formation/free lessons:
  - `naming-your-nfp`
  - `nfp-registration`
  - `filing-1023`
- Validate tier permutations (base/coaching/monthly/elective-only) end-to-end.

### WS-D Checkout + onboarding verification
Status: In progress (automated coverage largely complete; live Stripe/Supabase execution pass pending)
- Test checkout + entitlements for each tier path.
- Validate onboarding at each account level.
- Seed full demo account with realistic complete data across organization/programs/calendar/team/progress.

### WS-H Coaching CTA avatar-group design pass
Status: In progress
- Across coaching prompt/booking CTA surfaces, integrate avatar-group visual treatment to make coach support feel human and immediate.
- Target registry component:
  - `npx shadcn@latest add \"https://mynaui.com/registry/avatar-groups/avatargroups2.json\"`
- Content spec:
  - One placeholder avatar slot.
  - Two existing team photos already used on the homepage Team section.
- Initial target surfaces:
  - Accelerator right rail coaching card.
  - Module right rail coaching card.
  - Any inline coaching upsell card on accelerator/home-canvas flows.
- Guardrails:
  - Keep CTA copy concise and avoid vertical card bloat.
  - Maintain accessibility labels for avatar images/group.
  - Preserve current booking entitlement logic; this is visual-layer enhancement only.
- Current implementation pass:
  - Added reusable `CoachingAvatarGroup` with one placeholder slot + two homepage team images.
  - Applied to accelerator overview coaching rail, module right-rail coach panel, inline lesson coaching CTA, module completion stepper coaching CTA, and Accelerator Pro pricing coaching option.
  - Added tier-aware helper copy (`free`/`discounted`/`full`) where schedule payload is available.
  - No entitlement/booking routing logic changed in this pass.

### WS-E `/my-organization` layout hardening
Status: In progress
- Remove stacked-card-inside-card anti-patterns where unnecessary.
- Enforce min/max sizing and scroll containment per card.
- Normalize footer/header action placement.
- Resolve residual overlap/squish issues in dense states.
- Keep calendar utility functional and properly scoped.

### WS-F People + org chart runtime quality
Status: In progress
- Fix delete feedback consistency and stale UI refresh behavior.
- Improve React Flow canvas defaults (zoom, pan/drag, hierarchy layout quality).
- Ensure seed data includes realistic org depth for chart testing.

### WS-G Comms and auth polish
Status: Pending
- Configure branded Supabase auth emails + correct redirect URL behavior.
- Replace placeholder/legacy news items with production sources.

### WS-I Home-canvas pricing scroll unification
Status: In progress (implementation + logic test coverage complete; browser QA pending)
- Fix `/home-canvas?section=pricing` internal scroll behavior in the shared `PricingSurface` panel:
  - allow full in-panel vertical scrolling to reach all pricing content;
  - preserve smooth, natural scroll up/down inside pricing;
  - at scroll boundaries (top/bottom), correctly hand off to canvas section navigation without dead zones or lockups.
- Align scroll logic with the rest of home-canvas sections so transitions feel consistent and intentional.
- Current implementation pass:
  - Pricing section panel now uses vertical overflow (`overflow-y-auto`) while other sections remain fixed.
  - Wheel/touch handlers now hand off section navigation only when pricing is at top/bottom boundary.
  - Embedded pricing surface uses `min-h-full` to avoid clipping inside home-canvas panels.
  - Extracted wheel/swipe section-handoff logic into shared helper for deterministic behavior:
    - `src/components/public/home-canvas-scroll.ts`
  - Added acceptance-level logic tests for boundary/threshold/animation behavior:
    - `tests/acceptance/home-canvas-scroll-logic.test.ts`

### WS-J Accelerator billing lifecycle automation
Status: In progress
- Implement billing lifecycle rules for Accelerator pricing:
  - one-time purchase grants 6 months of platform access included;
  - monthly plan keeps platform access active during installments;
  - after installment/free period completion, continue platform access as `$20/month` unless canceled.
- Coaching booking link routing:
  - Pro/included-session booking URL: `https://calendar.app.google/EKs5A4iaXFAbFSp57`
  - Full-rate coaching booking URL: `https://calendar.app.google/qJWKyoF4Yhip6i687`
  - Route Accelerator Pro users to the included link for first 4 sessions, then automatically switch to discounted booking link.
- Engineer this as deterministic backend logic (Stripe metadata + webhook/subscription transition handling + entitlement updates), not UI-only copy.
- Add QA matrix for timeline transitions (start, month 6 rollover, cancellation, payment failure, reactivation).
- Current implementation pass:
  - Stripe webhook one-time accelerator path now starts Organization subscription with a 180-day trial (`context=accelerator_bundle_one_time`).
  - Added rollover trigger: when an accelerator monthly subscription is canceled/deleted *after installment term completion*, automatically provision Organization `$20/mo` continuation if no active/trialing subscription exists (`context=accelerator_rollover`).
  - Added monthly-installment metering metadata on accelerator monthly checkout (`accelerator_installment_limit`, `accelerator_installments_paid`).
  - Added `invoice.paid` automation to increment installment count and set `cancel_at_period_end` once installment limit is reached (default: 6), allowing clean handoff to `$20/mo` rollover at cycle end.
  - Added legacy compatibility behavior for cancellation rollover: if an older accelerator monthly subscription lacks installment metadata, cancellation/deletion can still roll to Organization continuation.
  - Set the Pro included-session booking URL (`https://calendar.app.google/EKs5A4iaXFAbFSp57`) as the default free-tier scheduling fallback when no env override is configured.
  - Added pure billing lifecycle helper coverage (installment parsing/progression + rollover eligibility) with acceptance-level unit tests.
  - Fixed checkout redirect flow to rethrow redirect errors from server action checkout paths (prevents fallback redirect from swallowing valid Stripe checkout redirects).
  - Added acceptance coverage for accelerator checkout metadata (monthly vs one-time variant payloads).
  - Idempotency + duplicate-protection remains enforced through existing webhook event locks and subscription existence checks.
  - Remaining: full QA matrix execution across cancellation/payment-failure edge cases and explicit month-6 timeline simulation.

### WS-K Readiness criteria + journey optimization system
Status: In progress
- Establish deterministic criteria for `Fundable` and `Verified` based on persisted evidence.
- Tie checklist completion to real artifacts:
  - formation modules
  - roadmap section completion
  - uploaded documents
  - program funding goal/budget fields
- Publish explicit user journey map with gap analysis, gamification loop, and flywheel mechanics for v1 optimization.
- Current implementation pass:
  - Added v1 criteria and journey spec in:
    - `docs/briefs/accelerator-readiness-criteria-and-journey.md`
  - Added brief index entry in:
    - `docs/briefs/INDEX.md`

## Phased Execution Plan

### Phase 1 (current)
- Establish active worklog + phase checkpoints.
- Implement top accelerator org snapshot strip with redesigned checkpoint rail.
- Keep existing roadmap/modules functional while integrating new top context.

### Phase 2
- Merge lessons/modules into roadmap progression surface.
- Add improved winding connector with visible state progression.
- Add deliverables-vs-lessons visual key tied to actual status logic (not static legend-only mapping).

### Phase 3
- Welcome dialog card integration.
- Tier/checkout/onboarding full scenario pass.
- Seeded demo account validation and presentation flow.

### Phase 4
- Final layout polish, accessibility/performance/security sweeps.
- Launch checklist + rollback notes.

## Acceptance Gates For This Cycle
- No card/content overlap at desktop/tablet/mobile breakpoints.
- Keyboard focus is visible and logical through progression cards and controls.
- No skeleton flicker/reload loop on roadmap section switches.
- Entitlement gating is deterministic for formation/elective/accelerator access.
- `/home-canvas?section=pricing` uses the shared non-iframe pricing surface.

## Open Decisions
- `Fundable` checkpoint threshold (default proposal: 60% roadmap completion).
- `Verified` checkpoint threshold (default proposal: 100% roadmap completion).
- Final copy for the welcome dialog card (pending your style spec).

## Working Rules
- No quick-fix iframe substitutes.
- No visual patching without layout rules.
- Every phase must leave the app testable and demo-safe.
