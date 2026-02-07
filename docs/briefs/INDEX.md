# Brief Index

Keep this file up to date so Codex can pick up without re-triage.
Canonical launch status board: `docs/organize.md`.

Status legend:
- `active`: expected to be implemented next / still current
- `blocked`: needs a decision before building
- `needs_update`: brief exists but assumptions changed
- `done`: implemented (verify against `docs/RUNLOG.md`)
- `superseded`: replaced by a newer brief

| Brief | Status | Owner | Last touched | Notes |
|---|---|---|---|---|
| `docs/briefs/onboarding-simplification.md` | active | Caleb | 2026-01-15 | Needs follow-through on remaining onboarding/UI polish tasks. |
| `docs/briefs/coaching-booking.md` | done | Caleb | 2026-01-16 | Standardized booking CTAs + 3-tier scheduling links. |
| `docs/briefs/budget-table-ux.md` | done | Caleb | 2026-01-16 | Updated budget table UX, CSV template, and mini guide. |
| `docs/briefs/budget-table-rebuild.md` | active | Caleb | 2026-01-16 | TanStack rebuild for spreadsheet-grade budget table behavior. |
| `docs/briefs/notifications.md` | active | Caleb | 2026-01-16 | System-wide notifications brief (accelerator/coaching/roadmap events). |
| `docs/briefs/app-shell-unification.md` | active | Caleb | 2026-01-18 | Unified internal app shell layout (center screen + left/right rails). |
| `docs/briefs/app-shell-header-stability.md` | active | Caleb | 2026-01-22 | Stabilize header layout across mobile/desktop + smooth sidebar animation. |
| `docs/briefs/accelerator-shell-polish.md` | active | Caleb | 2026-01-23 | Sync track selectors, unify toggles, and move module header stepper. |
| `docs/briefs/module-right-rail-tool-tray.md` | active | Caleb | 2026-01-24 | Module right-rail tool tray (notes/resources/coaching/AI). |
| `docs/briefs/accelerator-roadmap-strip.md` | active | Caleb | 2026-01-24 | Full-width roadmap strip + pagination on `/accelerator`. |
| `docs/briefs/roadmap-module-mapping.md` | active | Caleb | 2026-01-27 | Map every roadmap section to module prompts; align copy; add missing prompts. |
| `docs/briefs/roadmap-checkpoints-module-ui.md` | active | Caleb | 2026-01-27 | Render roadmap-linked module prompts with roadmap layout + stepper icon rules. |
| `docs/briefs/roadmap-calendar.md` | active | Caleb | 2026-01-24 | Replace Roadmap Calendar editor with interactive calendar + recurrence. |
| `docs/briefs/accelerator-launch-system-unification.md` | active | Caleb + Codex | 2026-02-06 | Master launch brief for shell system rules, canvas auth/onboarding, role-aware UX, bento `/my-organization`, notifications, roadmap-module bridge, and security hardening. |
| `docs/briefs/accelerator-launch-mvp-sprint.md` | active | Caleb + Codex | 2026-02-06 | Step-by-step MVP sprint queue (`S01`-`S14`) with dependencies, cut line, and launch gates. |
| `docs/briefs/accelerator-launch-active-worklog.md` | active | Caleb + Codex | 2026-02-07 | Live phase tracker for open accelerator launch work: org snapshot strip, checkpoint rail, roadmap+lessons integration, and remaining launch-critical backlog. |
| `docs/briefs/accelerator-readiness-criteria-and-journey.md` | active | Caleb + Codex | 2026-02-07 | V1 evidence-based Fundable/Verified criteria, journey map, gamification/flywheel model, and implementation backlog. |
| `docs/briefs/accelerator-billing-lifecycle-qa-matrix.md` | active | Caleb + Codex | 2026-02-06 | WS-J QA matrix for one-time 180-day window, monthly installment metering, cancellation, and `$20/mo` rollover transitions. |
| `docs/briefs/my-organization-bento-rules.md` | active | Caleb + Codex | 2026-02-06 | Layout contract for stretch behavior and per-card span/min-height rules on `/my-organization`. |
| `docs/briefs/ui-unification-refactor-evaluation.md` | active | Codex | 2026-02-06 | Assessment + phased plan to unify visual system, tokens, and shell patterns. |
| `docs/briefs/roadmap-section-routing.md` | done | Caleb | 2026-01-26 | Persist roadmap section selection via slug routes. |
| `docs/briefs/frameworks.md` | active | Caleb | 2026-01-20 | Frameworks: context-aware roadmap suggestions + popover actions; AI provider TBD. |
| `docs/briefs/stripe-gating.md` | active | Caleb + Codex | 2026-02-06 | Updated billing + entitlement contract for Accelerator one-time (180-day included), monthly installment metering, and rollover logic. |
| `docs/briefs/pricing-page.md` | needs_update | Caleb | 2026-01-13 | Update copy/features for new Accelerator payment option + “public org profile” in free tier. |
| `docs/briefs/pricing-accelerator-bundle.md` | needs_update | Caleb | 2026-01-13 | Update (installment option replaces older bundle notes). |
| `docs/briefs/electives-addons.md` | blocked | Caleb | 2026-01-15 | Blocked on “Electives 1–3 = free formation flow?” decision. |
| `docs/briefs/elective-entitlement-scenarios.md` | done | Codex | 2026-02-06 | Implemented v1 matrix for formation vs elective vs accelerator access, checkout modes, and route guards. |
| `docs/briefs/global-search.md` | done | Caleb | 2026-01-15 | v1 shipped; revisit only if new scope added. |
| `docs/briefs/multi-account-org-access.md` | done | Caleb | 2026-01-15 | v1 shipped (RLS + active org resolver). |
| `docs/briefs/roles-permissions.md` | done | Caleb | 2026-01-15 | Keep aligned with org membership + board/staff rules. |
| `docs/briefs/supabase-security-scan.md` | active | Caleb | 2026-01-15 | Continue CSP/headers + rate limiting + storage review. |
| `docs/briefs/onboarding.md` | superseded | Caleb | 2026-01-15 | Use `onboarding-simplification.md` as the active plan. |
| `docs/briefs/roadmap-formation.md` | active | Codex | 2026-01-27 | Roadmap landing + Formation free track + gating. |

## Planned (no brief yet)

| Target brief | Status | Owner | Notes |
|---|---|---|---|
- ui-rapid-fire-batch.md — UI rapid-fire fixes (nav/header/accelerator/roadmap)
