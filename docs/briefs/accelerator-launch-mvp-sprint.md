# Accelerator MVP Sprint Queue
Status: Draft
Owner: Caleb + Codex
Priority: P0
Linked brief: `docs/briefs/accelerator-launch-system-unification.md`

---

## Sprint Goal
Ship a stable evaluator-ready MVP with:
- reliable shell behavior
- canvas-native signup/onboarding
- operational `/my-organization`
- completed coaching/notification/progression flows
- launch-safe public content

## Execution Status (2026-02-06)
- `S01` pending
- `S02` done
- `S03` done
- `S04` pending
- `S05` pending
- `S06` pending
- `S07` done
- `S08` pending
- `S09` pending
- `S10` pending
- `S11` pending
- `S12` pending
- `S13` pending
- `S14` pending

## Non-Negotiables
- Keep PRs small and reversible.
- No destructive rewrites.
- Pass: `pnpm lint`, `pnpm test:snapshots`, `pnpm test:acceptance`, `pnpm test:rls`.
- Every step updates `docs/RUNLOG.md`.

## Sequence

### S01 - Shell Bug Audit + Token Contract
Objective:
- Capture all overlap/squish/focus/collapse defects and lock geometry tokens.

Primary files:
- `src/components/app-shell.tsx`
- `src/components/ui/sidebar/layout.tsx`
- `src/app/globals.css`
- `docs/agent/ui-rubric.md`

Exit criteria:
- Defect list with repro steps.
- Token contract added and applied to shell primitives.

### S02 - Home-Canvas Launch Hygiene (Quick Win)
Objective:
- Hide Team section for launch and replace placeholder News links/copy.

Primary files:
- `src/components/public/home-canvas-preview.tsx`
- `src/components/public/home2-sections.tsx`

Exit criteria:
- Team not visible in home-canvas nav/panels.
- News cards point to real destinations (Substack/internal post) with accurate copy.

### S03 - Coaching Entitlement Flow Hardening
Objective:
- Validate and standardize coaching booking UX and link resolution.

Primary files:
- `src/app/api/meetings/schedule/route.ts`
- `src/components/...` coaching CTA surfaces
- `docs/briefs/coaching-booking.md`

Exit criteria:
- 4-free then discounted logic verified for eligible users.
- Non-eligible users route to full-price link.
- Missing-link failures handled cleanly.

### S04 - Canvas Auth Entry Stabilization
Objective:
- Stabilize sign-in/sign-up routing and canvas entry behavior.

Primary files:
- `src/components/public/home-canvas-preview.tsx`
- `src/app/(auth)/**`
- `src/components/navigation/frame-escape.tsx`

Exit criteria:
- Consistent auth entry from canvas across desktop/mobile.
- No iframe/focus/scroll regressions.

### S05 - Onboarding In Canvas (No Dialog Dependency)
Objective:
- Move onboarding into panel flow in the canvas shell.

Primary files:
- `src/components/onboarding/**`
- `src/app/(dashboard)/layout.tsx`
- onboarding actions/routes

Exit criteria:
- User can complete setup in canvas flow.
- Resume flow works if interrupted.

### S06 - Role + Stage Visibility Matrix Implementation
Objective:
- Implement explicit per-role/per-stage visibility rules.

Primary files:
- `src/components/app-sidebar/nav-data.ts`
- `src/components/app-shell.tsx`
- `src/lib/organization/active-org.ts`

Exit criteria:
- owner/admin/staff/board/member visibility behavior is deterministic and documented.

### S07 - `/my-organization` Bento Skeleton
Objective:
- Replace full-page profile-first composition with bento operations layout.

Primary files:
- `src/app/(dashboard)/my-organization/page.tsx`
- `src/components/organization/**`

Exit criteria:
- New bento layout in place with shell-aligned geometry and placeholder tool cards wired.

### S08 - Notifications Coverage Completion
Objective:
- Close event coverage gaps and role targeting.

Primary files:
- `src/app/actions/notifications.ts`
- `src/lib/notifications.ts`
- event trigger call sites
- `supabase/tests/rls.test.mjs`

Exit criteria:
- Launch-critical event matrix complete.
- RLS tests confirm isolation and admin behavior.

### S09 - Module/Roadmap Bridge Component
Objective:
- Add shared progression bridge visible in module + roadmap contexts.

Primary files:
- `src/components/training/module-detail/**`
- `src/components/roadmap/**`

Exit criteria:
- Users can see strategic progress linked to module progress in both surfaces.

### S10 - Find MVP Surface
Objective:
- Launch map/search/filter/save experience.

Primary files:
- new find route + components
- map/search/query utilities
- profile preview card components

Exit criteria:
- User can search/filter and save organizations in one surface.

### S11 - Org Chart V2 Foundation (React Flow)
Objective:
- Upgrade org chart architecture for layout quality + runtime stability.

Primary files:
- `src/components/people/org-chart-canvas.tsx`
- layout worker/utilities
- people persistence APIs

Exit criteria:
- Worker-based layout path available.
- Manual node override model defined and persisted.
- Interaction vs idle update separation implemented.

### S12 - Security + Next.js Conformance Pass
Objective:
- Final launch hardening.

Primary files:
- route handlers and authz checks
- `next.config.ts`
- security and runbook docs
- RLS tests and migration scripts as needed

Exit criteria:
- No unresolved critical security gaps in launch path.
- Runtime/cache choices documented and consistent.

### S13 - Performance Budget + Stress QA
Objective:
- Ensure map/org chart/shell interactions stay stable.

Primary files:
- shell/map/org-chart components
- perf scripts/docs

Exit criteria:
- Interaction remains smooth on target evaluator dataset sizes.
- No crash/freeze scenarios in Chrome under normal use.

### S14 - Launch Checklist + Rollback Plan
Objective:
- Final go/no-go with rollback readiness.

Primary files:
- `docs/GO.md`
- `docs/CODEX_RUNBOOK.md`
- launch checklist doc section

Exit criteria:
- Environment, data, and ops checklist complete.
- Clear rollback actions documented.

## Parallelization Notes
Safe parallel tracks after S01:
- Track A: S02 + S03
- Track B: S04 + S05
- Track C: S07 + S08

Sequential dependencies:
- S06 depends on S04/S05 foundations.
- S09 depends on S06 visibility/stage rules.
- S10 and S11 can progress in parallel after S01.
- S12-S14 are finalization gates.

## MVP Cut Line (If Time Tight)
Must ship:
- S01, S02, S03, S04, S05, S07, S08, S12, S14

Can defer to next iteration if needed:
- S10 (Find full feature depth)
- S11 (advanced org chart optimization beyond stable baseline)
- S13 (extended stress/perf scenarios after evaluator launch)
