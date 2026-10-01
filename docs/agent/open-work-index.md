# Open Work Index

Updated 2026-09-28. Read after `AGENTS.md`, `docs/RUNLOG.md`, and its latest monthly entries. Current release base: `origin/main` `5f02a334`; recheck only before starting new work.

Maintain one active entry per lane or preservation hold. Update entries in place:
replace renamed branch references and obsolete next actions instead of appending
duplicates. Keep historical closeout records in the logs; they do not reopen work.
When changing the startup sequence, keep `AGENTS.md`, `docs/RUNLOG.md`, and the
workflow checkpoint aligned in the same change.

## Closed

Personal coaching credits and bundled Resources/Documentation fixes are closed per Caleb: PR #263 shipped at `59b89421`; production activation and user review are complete. Do not reopen this lane.

Caleb confirmed Public Documentation / S02 shipped and PRs #247–#251 merged. Do not reopen them, repeat production checks, or restart the historical menu investigation from old handoffs. #249 changed test isolation only. The separate public navigation change in PR #253 is also closed per Caleb; do not reopen it.

AppShell/mobile is closed for implementation: Caleb confirmed PR [#254](https://github.com/Hamernick/coach-house-lms/pull/254) merged, approved appearance and confirmed authenticated Menu/dock/Details/desktop checks passed. The merged revision is `54ed2c3c`. Production deployment/smoke verification was not independently established in this session; do not infer it or reopen the lane without a reported issue or explicit request. Preserve `6b13dd82`, the release worktree, `/tmp/app-shell-draft-20260925.yv1Vat` and `/tmp/app-shell-recovery.6Y6oFk`.

## Open lanes

The original four `chore/*` backup branches start at `32d7e8d8` and remain backed up on GitHub. AppShell has since merged; the three remaining feature backups are **unfinished, not release-ready**. Original sources remain. Old runlog versions were excluded; Particles and Calendar acceptance manifest additions were merged with current main.

| Lane | GitHub backup / source | Remaining work and validation |
| --- | --- | --- |
| Internal projects/tasks — onboarding release; UI paused | Active release: `fix/organization-onboarding-recovery-20261001`, worktree `coach-house-platform-organization-onboarding-release-20261001`, base `59b89421`. Scoped onboarding PR [#265](https://github.com/Hamernick/coach-house-lms/pull/265) is ready for review; hosted acceptance/RLS/static passed on the first revision, a build variable error is corrected with a passing local production build; corrected-head hosted quality/review pending. Caleb authorizes deployment after gates. Real signup/payment tests deferred. Dialog/document scrolling paused by latest instruction for another model to plan orchestration. Source/simulator/private evidence preserved in `coach-house-platform-internal-updates-20261001`. [Release executor](../plans/2026-10-01-onboarding-release-executor.md); [audit](../plans/2026-10-01-organization-onboarding-audit.md); [validation](../plans/2026-10-01-onboarding-validation.md). Customer input/human disposition remains separate from code release. | All #261 hosted checks including quality passed; coachhouse.app Ready on the merged revision. Tracker import reconciled: 40 projects, 255 tasks, nine reference notes; 348 source records accounted for, 11 held. Existing manual records unchanged. Joel: 82 assignments (49 open/33 done), four proposals, 34 collaborator appearances. Monthly-date constraint 20260928180000 applied and validated; cross-scope proposals/collaborations stay read-only. Implementation/import/runtime review fixes closed. Offline-only project-priority validation follow-up is on `fix/tracker-project-priorities-20260928`; original manifest remains byte-identical, no reimport or migration. Remaining: Caleb/Joel task view and save/reopen review. Google sign-in on the only local server, localhost:3000, confirmed by Caleb. Franklin unlinked; templates/recurrence inactive; proposal history omitted. Acme rename and Calendar provider/canary work remain separate. [Production handoff](../operations/tracker-import/README.md). |
| Marketplace people — next active lane | Release: `feat/marketplace-people-release-20260928`; preservation: `chore/marketplace-people-20260924` (`21026428`), `feat/public-profiles-marketplace-people-20260922` (`6b3be0b6`) | Clean release checkout based on current main plus this documentation closeout. Preserved implementation has not yet been ported. Compare its ten-file patch, bring forward only unfinished owned work, then finish list/detail integration and review privacy, handles and empty/error states. |
| Particles/Objectives — high priority | `chore/workspace-particles-objectives-20260924` (`8eabd28e`); `feat/workspace-particles-objective-resume-20260922` (`c855aea6`) | Product concept and UI/UX remain rough. Decide the flow, then review canvas/drawer/mobile and Drive authorization. Passing tests do not establish readiness. |
| Google Calendar — active release preparation | Release: `feat/google-calendar-release-20260928`; preservation: `chore/google-calendar-20260924` (`a1acccad`), `feat/google-calendar-resume-20260922` (`508b8df0`) | Tools/roadmap/mobile Calendar integration is ported onto main `aa2fc54f`; registered OAuth callback remains port 3012, but that server was stopped at Caleb's request; the consolidated app/sign-in server is localhost:3000. User authorized production shipping after gates; user review, current-head hosted quality, provider/scheduler audit and authorized live canary remain. Google approval was previously recorded; do not repeat submission from stale setup notes. See the [current checklist](../plans/2026-09-28-google-calendar-release-readiness.md). |

## Marketplace continuation

- Worktree: `/Users/calebhamernick/Development/coach-house-platform-marketplace-people-release-20260928`.
- Branch: `feat/marketplace-people-release-20260928`; base: `54ed2c3c` plus the human-first review policy and mobile closeout commit. No new preview process, dependency installation, provider mutation or application changes were made for this handoff.
- Start with the scoped patch `git show 21026428`; it contains ten files / 678 added lines. Compare with current main before porting; do not replay mixed recovery branches or historical runlogs.
- Owned starting points: `src/features/public-profiles/**`, `src/lib/queries/public-people.ts`, `src/app/(public)/documentation/marketplace/people/[handle]/page.tsx`, and `tests/acceptance/public-profiles-marketplace-people.test.ts`. Inspect the Marketplace list composition owner before integrating; do not change shared shell or shipped Documentation incidentally.
- Next product step: identify the remaining list/detail integration gaps, expose the existing design in an isolated preview, and let Caleb test. Resolve concrete issues from that review; no redesign, new testing framework, agents or goals by default.
- Focused validation: existing public-profiles acceptance coverage, relevant changed-file lint, visibility/privacy and handle behavior. Human review covers appearance and interactive list/detail/empty/error states; use Playwright for specific unresolved questions. Required security/RLS checks (if affected), hosted quality, visual comparisons and review remain release gates.
- Preserve root checkout/server and all existing worktrees. Keep Calendar, Particles/Objectives, auth/provider changes, map integration and closed Documentation outside this lane. The mobile shipping authorization does not by itself authorize Marketplace deployment.

## Named preservation holds

The mixed root history has broad candidate areas. No file/hunk review yet proves which changes remain unshipped. Keep the source locally; never push or replay the mixed history wholesale.

| Hold | Owner/source | Concrete next step |
| --- | --- | --- |
| `H-FIND` | Public Find/resource-map UI; root `0a1895fc`, launch reference `f15ce510`, Find branches | Compare public UI/data files with main; isolate residuals and prove raw intake/synthetic seeds cannot enter `/find`. AppShell map navigation/context/control/panel remnants remain only in preservation commit `2f15f54f`; they are excluded from the mobile release. |
| `H-ACQUISITION` | Private resource acquisition scripts; root `0a1895fc` | Compare `scripts/resource-map/**` and tests with main; keep private tools separate from publication. |
| `H-ORG-DOCS` | Org/Documents leftovers; root and Documents/Drive branches | Compare with shipped Core Documents/Drive work; isolate only remaining hunks. |
| `H-ACCOUNT` | Account/settings/profile; root and profile/settings branches | Compare with shipped admin/auth/profile work; resolve Marketplace people and shared-shell ownership. |

`H-LEGACY` holds other historical local refs whose current-main equivalence is unproven. See the [branch ledger](../plans/2026-09-24-local-branch-ledger.csv) for every local ref, saved head, matching remote, purpose, and next action, and the [worktree ledger](../plans/2026-09-24-worktree-ledger.csv) for every checkout. Nine stale registrations remain untouched.

## Clean state and release gates

All 61 valid registered worktrees were clean after cleanup. Closed S02 notes were saved locally on `chore/preserve-s02-closeout-local-20260924` (`80cb2c3f`); this is historical, not a release branch or remote backup. The token-bearing legacy file was copied byte-for-byte to a mode-0700 private archive outside all worktrees, verified, then removed from launch-clean. Its contents were not printed or uploaded. Ignored credentials/data and localhost:3000 were left alone.

The root mixed recovery branch remains local. Four scoped backup branches passed staged and complete outgoing-commit secret scans and diff hygiene. No new application or hosted release tests ran in this organization pass. No open lane is marked release-ready.

Before shipping any lane: inspect branch/upstream/dirt and compare with current main; resolve shared-file ownership; run focused checks and browser review for affected UI; append the current monthly runlog; pass the current PR's hosted `quality`, code-owner review, and branch protection. Provider setup, live data, deployment, and production verification have separate gates. Particles and Calendar own only their respective additions to `tests/acceptance/projects.json`; current-main entries must remain. Work one lane at a time.
