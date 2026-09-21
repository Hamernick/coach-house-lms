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

## Release-candidate verification

- Replacement draft PR #242: https://github.com/Hamernick/coach-house-lms/pull/242. First head e9f4ce20 passed local/hosted static, acceptance, RLS, build compilation and all 45 production visual cases; no baselines changed. The performance check alone failed: admin shell 1001 KB against the unchanged 1000 KB limit (public shell 1825.5/1975 KB; community 607.4/900 KB).
- Follow-up loads the staff-only navigation group separately with React lazy/Suspense; ordinary public navigation retains its synchronous production rendering. Streaming SSR navigation test retains all active-link/accessibility assertions; 17 navigation checks pass. Full gate is rerunning for the final bundle measurement. No budget relaxation.
- Production-mode local browser rehearsal: assigned coach sees one assigned organization, one standard project and one personal task; completion persisted after full reload. Workstream shows the five-day Sep 21–25 task. Mission edited/saved/reloaded and exact content retained. 390px Dashboard has 390px document width and no mobile Find bar. Existing signed-in admin dashboard read-only also loaded.
- Temporary-file API canary passed upload/list/download/trash/restore/permanent removal; storage cleanup verified. Disposable owner/coach and organization/project/tasks removed afterwards. No real organization changes, invitations or Google authorization/activation. Google Calendar is unavailable in local environment; new OAuth consent/provider synchronization remains unverified.
- Graphify update completed 18,044 nodes / 50,815 edges / 1,039 communities. Production remains d88a0943; required code-owner approval still applies.

## P1 review repair checkpoint — September 20

PR #241 is now closed as superseded; its branch/worktree remain preserved. PR #242's previous head ea87f464 passed local and hosted quality; required code-owner approval still blocks merging.

Two review defects are repaired: explicit account-deletion Google revocation occurs before token erasure, while ordinary disconnect stays local-only; elevated document/file writes carry authenticated actor context into their database triggers. The new forward migration `20260921002000_preserve_document_activity_actor.sql` must be applied before the repaired code is released. It ignores spoofed actor headers on ordinary user JWTs and does not fabricate historical actors. Migration rollback and detailed evidence are in the current monthly log.

The repaired source passes the complete local quality gate (407.91 seconds), 2,532 acceptance tests plus all RLS suites, and 45 unchanged production visual cases. Public paths remain identical to production. No production deployment, Google revocation, invitation, or live migration occurred in this repair batch. Next: hosted checks at the repair commit, code-owner review, then migration/deployment and production verification under the existing release authorization.
