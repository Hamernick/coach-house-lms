# Admin/coach-only production release

## Approved scope

User explicitly requested production admin/coach tools only, preserving production public pages. Start from production/main `d88a09431d474c8b4b13eeb102a63fba209546f9` in isolated `feat/admin-tools-production-20260920`. Preserve dirty development and rejected release worktrees. PR #241 remains draft and must not merge: its broad development baseline contained unapproved public changes.

## Implementation

Port the reviewed internal dashboard, Organizations/Projects/Tasks, guided project creation, shared project options, assignment filtering, revenue/coaching statistics, document editing/activity, and required Calendar/Drive services. Keep the client-only dashboard import boundary. Retain scoped database authorization and developer-only management authorization.

Adapt existing shared avatars with optional data/overflow props, preserving default rendering. Add Calendar branding without changing existing Tools catalog. Hide the mobile navigation only on `/admin/dashboard`. Navigation changes expose staff-only dashboard grouping; retain production public resource links.

No changes to public routes, public assets, global styles, shared UI primitives, dependency lockfile, or public screenshot baselines. No Marketplace, Documentation, Particles, Brand Identity, or general mobile-navigation redesign. Node 22 is consistent across package metadata and CI. Add isolated RLS suites for document files/activity and Calendar.

## Validation and continuation

Full quality gate running; candidate is uncommitted and not deployed. Record final checks and public-boundary evidence here before publishing. Production/main still at d88a0943. Shared team access must be verified on this narrow candidate; earlier broad-candidate checks are supporting evidence only. Do not send invitations. Code-owner review and all required checks remain mandatory.

## Checkpoint: scoped validation

- 237 selected files, about 14,600 insertions, versus 1,000 files / 84,811 insertions in rejected PR #241. All public routes, assets, UI primitives, global CSS, public visual tests/baselines, Next config and lockfile have zero diff against production d88a0943.
- Static checks and snapshots passed. Targeted 286 internal checks pass after a custom-avatar fallback adaptation. Full acceptance first pass: 2,526 passed, one outdated fiscal-tab contract failed; corrected to assert the requested dedicated tab and real schedule component, then its three tests passed. The complete union is rerunning.
- All isolated and live RLS suites passed; standalone production build passed. No TypeScript application errors. Full quality run continues.
- Graphify extraction/clustering finished: 17,665 nodes, 50,498 edges, 970 communities.
- The feature contract now recognizes explicit `/client` entrypoints, preserving the fix for the reported inline Server Action import failure. Public document-screen tests from the broad candidate were not adopted; only relevant file API/quota/retention assertions were retained. No existing production test was removed.
