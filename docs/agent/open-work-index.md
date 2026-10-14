# Open Work Index

Internal rapid-UI closure updated 2026-10-12; other entries retain their recorded reconciliation dates. Read after `AGENTS.md`, `docs/RUNLOG.md`, and its latest monthly entries. Previously recorded release base (October 5): `origin/main` `c8b411df`; refresh before starting release work.

Maintain one active entry per lane or preservation hold. Update entries in place:
replace renamed branch references and obsolete next actions instead of appending
duplicates. Keep historical closeout records in the logs; they do not reopen work.
When changing the startup sequence, keep `AGENTS.md`, `docs/RUNLOG.md`, and the
workflow checkpoint aligned in the same change.

## Closed

Rapid Workspace UI release — superseded by the internal MVP closeout above. PR [#276](https://github.com/Hamernick/CoachHouse/pull/276) merged October 8 as `2d1cc331`; its selected fixes were reconciled into the internal source and subsequent #288 release. Do not restart review/merge work on `fix/rapid-ui-release-20261007` from its historical checklist. Preserve the dirty source and recovery evidence; unverified live publication and remaining quality follow-ups stay in Caleb’s separate to-do list, not an active duplicate lane.

Internal rapid UI, onboarding, publication and stable MVP sprint — **closed by Caleb October 12, 2026**. Remaining follow-ups moved to his separate to-do list; do not resume the historical plans automatically. PR [#288](https://github.com/Hamernick/CoachHouse/pull/288) merged as `73dd8d15`; canonical `coachhouse` deployment succeeded. Access migration `20261012163000` was applied and verified. Closure does not certify the failed visual/quality checks, secondary Vercel deployment, or unverified authenticated signup/payment/unlock journey. See [closeout and historical sprint](../plans/2026-10-12-stable-mvp-release-sprint.md) and October runlog. Preserve the dirty `feat/rapid-ui-ux-20261007` source and recovery archives. The clean release checkout is retained only for closeout documentation; ports 3001/3009 have no listeners. Connected planner stays abandoned; PR #289 belongs to the separate public workstream.

Personal coaching credits and bundled Resources/Documentation fixes are closed per Caleb: PR #263 shipped at `59b89421`; production activation and user review are complete. Do not reopen this lane.

Caleb confirmed Public Documentation / S02 shipped and PRs #247–#251 merged. Do not reopen them, repeat production checks, or restart the historical menu investigation from old handoffs. #249 changed test isolation only. The separate public navigation change in PR #253 is also closed per Caleb; do not reopen it.

AppShell/mobile is closed for implementation: Caleb confirmed PR [#254](https://github.com/Hamernick/coach-house-lms/pull/254) merged, approved appearance and confirmed authenticated Menu/dock/Details/desktop checks passed. The merged revision is `54ed2c3c`. Production deployment/smoke verification was not independently established in this session; do not infer it or reopen the lane without a reported issue or explicit request. Preserve `6b13dd82`, the release worktree, `/tmp/app-shell-draft-20260925.yv1Vat` and `/tmp/app-shell-recovery.6Y6oFk`.

Personal coaching credits and the bundled Resources/Documentation fixes are closed. Caleb confirmed review complete on 2026-10-01. PR #263 merged at `59b89421cb11181e09cb8454480953920efd2554`; canonical production is Ready on that revision (deployment `dpl_3y2sDsGpuJbxSmzYG7jJTojc34BE`). All three coaching migrations are applied; both existing Accelerator participants have ten available credits, with original history preserved. Cloud Run revision `coach-house-calendar-broker-00009-hud` serves live traffic. One Supabase cron job, `coaching-calendar-reconcile`, runs every minute. Live authenticated reconciliation and coach-calendar deletion/refund passed, including duplicate-refund prevention and restoration of the verification account's original balance. Temporary booking/webhook pause, review database and eleven branch-specific Preview overrides were removed; the unrelated Calendar preview remains. See [release record](../plans/2026-09-30-coaching-credits.md). Do not list coaching credits as an open lane or repeat completed review, activation, canary or cleanup gates without a reported issue. PR #264 records this closeout only; its documentation merge does not reopen the product lane.

## SHIP orchestration

LIVE-04 Documents follow-up: production user review found verbose copy and
toolbar crowding after the shared banner change (PR298, main32e5199e). Continue
`fix/documents-upgrade-notice-20261013` in the existing banner checkout on
localhost:3116. Shorter Documents copy and explicit24px toolbar separation;
[scope and user review](../plans/2026-10-13-upgrade-banner-layout.md).
User owns appearance checks; hosted current-head quality/code-owner review and
deployment remain required. Preserve separate PR299 map audit work and its
unapplied coordinate corrections; no provider changes or Supabase previews.

LIVE-03 map changes and claim/cache review fixes merged through [PR299](https://github.com/Hamernick/CoachHouse/pull/299) as `164c640b`.
[Audit and repair boundary](../plans/2026-10-13-resource-map-audit.md): all 877 published resources,
877 underlying location rows and 21 public organizations audited; 875 real service records become 871 places.
Shared pins open a choice list first; all viewport pages load beyond 500; confirmed aliases preserve IDs/schedules.
Branch `fix/public-resource-test-records-20261013` in the map checkout, base e49a31bd, localhost3115.
Four verified public contact-coordinate corrections are prepared as guarded SQL, not applied.
Claim search/submission now share fixture visibility, and public profile cache advances tov2 after bot review.
30 focused review-regression/claim/directory tests pass. Preserve historical CI/review evidence;
deliberate data step, deployment and user map check are not confirmed by the merge.
No Supabase preview, production mutation or agent visual sweep. PR297 merged per user; do not recheck.


PR297 merged per Caleb; do not spend time rechecking his merge confirmation.
He is checking the map himself. [Map repair evidence](../plans/2026-10-13-live-map-markers.md):
57 focused tests, lint/prepush and Graphify passed. Preserve the separate visual,
quality/review and production-verification gaps; merge is not proof of those.
Preserve map worktree/localhost:3115 and pricing localhost:3119. No Supabase previews.

Prior PR296 is on intended coachhouse production at89c409bc, including PR295.
Historical failed visual/quality, missing review and unverified signup/menu/Collect
flows remain recorded in the October log and [prior plan](../plans/2026-10-13-live-site-pricing-donate.md).

[Shared entry point](../SHIP.md): `SHIP-000`, branch `chore/ship-harness-20261013`,
worktree `coach-house-platform-ship-20261013`. PR #291 externally merged as
`ce1436a2` on October 13; quality failed and code-owner review remains missing.
Shared closure is blocked; preserve its original reviewed head and evidence.
The requested original-plan linkage is prepared separately in
`chore/ship-plan-links-20261013`, worktree `coach-house-platform-ship-plans-20261013`.
It links the ten existing packets and 59 stages, without starting another product slice.
Read-only [AUDIT-001 preparation](../shipping/audit-001-preflight.md) records current
public findings and corrections to the old outside audit; website implementation remains separate.
Use the canonical shared record before selecting any new release slice. Source
packets are private references; existing closed lanes remain closed.

## Public indexing correction

[Original-packet implementation](../plans/2026-10-13-public-indexing.md):
`fix/public-indexing-20261013` in `coach-house-platform-public-indexing-20261013`,
base `ce1436a2`, draft [PR #293](https://github.com/Hamernick/CoachHouse/pull/293).
Community sitemap/robots now follow existing public access;
root canonical URLs use a shared absolute site origin. Ten focused tests, changed-file
checks and local rendered metadata verification pass. Preserve the unrelated blocked SHIP
release record; this candidate still requires hosted quality and review.

## Open lanes

Vercel CPU optimization: `fix/vercel-cpu-optimization-20261011` in
`/Users/calebhamernick/Development/coach-house-platform-vercel-cpu-20261011`, based
on `0819df5f`. User approved an isolated optimization branch and reported upgrading
to Pro. Scope: request-scoped verified-user deduplication, cookie-free public-read
Proxy fast path, and exclusion of the independently bearer-authenticated coaching
cron route. No UI, private-page caching, calendar timing, migration or provider
changes. See [plan and evidence](../plans/2026-10-11-vercel-cpu-optimization.md).
88 focused tests pass. PR [#285](https://github.com/Hamernick/coach-house-lms/pull/285)
is open; hosted quality, code-owner approval, merge and production measurement
remain pending. Automatic branch previews are disabled by the existing production-only
Vercel rule. Keep this lane separate from active UI/map worktrees.

National category integration: `feat/nonprofit-category-filters-20261007` in `/Users/calebhamernick/Development/coach-house-platform-category-filters-20261007`. See [current category plan](../plans/2026-10-07-national-nonprofit-category-filters.md). 1,337,767 private mapped EINs; serving/backfill implemented locally, no category publication. Permanent `CURRENT.json` still locates the private harness; retain it and running operators. Older directory totals below are historical.


The original four `chore/*` backup branches start at `32d7e8d8` and remain backed up on GitHub. AppShell has since merged; the three remaining feature backups are **unfinished, not release-ready**. Original sources remain. Old runlog versions were excluded; Particles and Calendar acceptance manifest additions were merged with current main.

| Lane | GitHub backup / source | Remaining work and validation |
| --- | --- | --- |
| Public pages — merged; guest fiscal activation/integration remains open | Public production previously verified at `408b36c6` (PRs #286/#287); browser/reference follow-up [#289](https://github.com/Hamernick/CoachHouse/pull/289) merged October 12 as `b1be59a7`. Preserve source/evidence in `/Users/calebhamernick/Development/coach-house-platform-frontpage-20261007`. | Do not restart #289 review or merge work. Its merge does not establish current-head quality, deployment or live fiscal verification. Remaining public-lane work: controlled intake/UI and guest/staff email activation, real submission/private-project/reviewer notification checks, delivery-webhook configuration and signed delivery verification, staff/applicant correction flow, and separately gated optional profile-import integration/migration. These flags were last recorded disabled; no new live configuration check or activation occurred during this closeout. See [public checklist](../plans/2026-10-12-public-product-master-checklist.md) and [release plan](../plans/2026-10-12-presentation-release.md); their pre-merge #289 instructions are superseded by this entry. Internal onboarding/billing and Tools-quality follow-ups were transferred to Caleb’s to-do list; they do not reopen the closed internal lane. Preserve localhost:3000 and unrelated lanes. |
| Find detail crash — active fix | `fix/find-resource-detail-loading-20261007`; worktree `coach-house-platform-find-detail-fix-20261007`; base `072b34d7` | Housing Forward click crash reproduced. Local loading boundaries fix whole-shell suspension/update loop. Desktop/mobile regression and exact public payload pass locally. [QA](../qa/find-detail-20261007/README.md). Hosted quality/review and deployment pending; preview localhost:3110. |
| Nonprofit directory — 10,001 published; reported click fix active | PR #270 merged as `e6361167`. Fix: `fix/nonprofit-directory-click-20261006`; worktree `/Users/calebhamernick/Development/coach-house-platform-nonprofit-directory-release-20261006` | Published 10,001 searchable IRS identities; no new map pins. Durable state: `~/.local/share/coach-house/nonprofit-enrichment/PUBLICATION.json`. React #185 stack identifies an unstable NavigationMenu root ref; isolated reproduction and version-bound patch, browser regression passes. Original click and search 503 not reproduced. Fix not deployed; hosted quality/review pending. Continue full-corpus work from private `CURRENT.json` afterward; do not repeat publication. |
| Production quick patches — PR review | `fix/quick-patches-20261006`; `/private/tmp/coach-house-platform-quick-patches-20261006`; base `5e482e85` | Organization setup/name consistency, durable lesson completion, NFP Registration resource, AI removal, and Finance/Stripe hiding. Drawer-only scope confirmed; standalone-only changes removed. 36 focused tests and lint pass after narrowing; prior production build passed. [PR #269](https://github.com/Hamernick/coach-house-lms/pull/269) open. Missing-completion-handler review fixed; stale Finance assertion corrected. Three intended Workspace Tools Linux baseline changes and current-head quality/review remain pending before merge. No deployment. Staff billing checked live: existing permanent 100% discount, next invoice $0, no open invoices. See October runlog. |
| Internal projects/tasks — deployed; human review remaining | Active release: `fix/organization-onboarding-recovery-20261001`, worktree `coach-house-platform-organization-onboarding-release-20261001`, base `59b89421`. Scoped onboarding PR [#265](https://github.com/Hamernick/coach-house-lms/pull/265) merged 2026-10-05 as `c8b411df`, including name normalization. Both Vercel Production environments report success for that exact SHA (coachhouse deployment `6866468429`, success `2026-10-05T18:10:02Z`). Main run `37353213115` passed static/acceptance/RLS/build; visual and aggregate quality still fail only the two unchanged Calendar 390px snapshots. Onboarding is shipped; the separately authorized Calendar CI closeout is tracked below. Authenticated production review and real signup/payment tests remain deferred; do not claim those passed. Dialog/document scrolling shipped separately in PR #266. Source/simulator/private evidence preserved in `coach-house-platform-internal-updates-20261001`. [Release executor](../plans/2026-10-01-onboarding-release-executor.md); [audit](../plans/2026-10-01-organization-onboarding-audit.md); [validation](../plans/2026-10-01-onboarding-validation.md). Customer input/human disposition remains separate from code release. | All #261 hosted checks including quality passed; coachhouse.app Ready on the merged revision. Tracker import reconciled: 40 projects, 255 tasks, nine reference notes; 348 source records accounted for, 11 held. Existing manual records unchanged. Joel: 82 assignments (49 open/33 done), four proposals, 34 collaborator appearances. Monthly-date constraint 20260928180000 applied and validated; cross-scope proposals/collaborations stay read-only. Implementation/import/runtime review fixes closed. Offline-only project-priority validation follow-up is on `fix/tracker-project-priorities-20260928`; original manifest remains byte-identical, no reimport or migration. Remaining: Caleb/Joel task view and save/reopen review. Google sign-in on localhost:3000 was previously confirmed by Caleb; no listener is running on port 3000 at the 2026-10-05 closeout. Franklin unlinked; templates/recurrence inactive; proposal history omitted. Acme rename and Calendar provider/canary work remain separate. [Production handoff](../operations/tracker-import/README.md). |
| Project/organization UI — deployed; reported fixes reviewed | [PR #266](https://github.com/Hamernick/coach-house-lms/pull/266), merged by Caleb; main `ad1c480f`; preserved local lane `fix/task-dialog-document-scroll-20261003` | Original UI deployment `dpl_Dz5S2bwqXGxYwYfgYkLv2jrSHsDN` on `coachhouse.app` was verified Ready on `ad1c480f`; latest main `c8b411df` now has successful Vercel Production status (GitHub deployment `6866468429`). Includes task/document scrolling, optional sponsorship, organization Programs/credits, header/card refinements, notification unread fixes, Notes save feedback, and folders/drag-drop. Standard projects show only their own files. All 62 existing organization owners have ten live coaching credits (separate authorized correction). Hosted static, build, acceptance and RLS pass; all ten new interaction cases pass. Aggregate quality remains failed only for unchanged Calendar 390px light/dark snapshots (run `37172147577`; main run `37172246502` also failed visual). Do not claim clean release validation or update unrelated baselines here. [PR #267](https://github.com/Hamernick/coach-house-lms/pull/267) merged as `ac5deadf`, including the production-only Vercel rule and closeout records. The previously recorded Calendar quality failure remains unresolved. Active coachhouse preview canceled; other integration denies API access. Caleb confirmed on 2026-10-05 that live task opening after list scrolling and long Mission/Vision scrolling with reachable Save/Cancel both work correctly. No duplicate agent browser review needed. [Plan/evidence](../plans/2026-10-03-task-dialog-document-scroll.md). Other preserved worktrees/onboarding remain outside this release. |
| Marketplace people — next active lane | Release: `feat/marketplace-people-release-20260928`; preservation: `chore/marketplace-people-20260924` (`21026428`), `feat/public-profiles-marketplace-people-20260922` (`6b3be0b6`) | Clean release checkout based on current main plus this documentation closeout. Preserved implementation has not yet been ported. Compare its ten-file patch, bring forward only unfinished owned work, then finish list/detail integration and review privacy, handles and empty/error states. |
| Particles/Objectives — high priority | `chore/workspace-particles-objectives-20260924` (`8eabd28e`); `feat/workspace-particles-objective-resume-20260922` (`c855aea6`) | Product concept and UI/UX remain rough. Decide the flow, then review canvas/drawer/mobile and Drive authorization. Passing tests do not establish readiness. |
| Google Calendar — CI closeout active; provider review separate | Release: `feat/google-calendar-release-20260928`; preservation: `chore/google-calendar-20260924` (`a1acccad`), `feat/google-calendar-resume-20260922` (`508b8df0`) | CI follow-up: `fix/calendar-ci-closeout-20261005` in `coach-house-platform-calendar-ci-closeout-20261005`, based on main `c8b411df`. Restores the omitted fixed day-cell sizing from reviewed baseline source `6ce80db6` and honors the supplied `today` value to prevent fixture hydration mismatch. Includes saved closeout notes `2fae413b` (cherry-picked as `d8803514`); no baseline/tolerance changes. Focused Calendar checks pass 33/33; hosted quality and required independent approval remain pending. Existing Tools/roadmap/mobile Calendar integration is already merged via PR #257; registered OAuth callback remains port 3012, but that server was stopped at Caleb's request; the consolidated app/sign-in server is localhost:3000. User authorized production shipping after gates; user review, current-head hosted quality, provider/scheduler audit and authorized live canary remain. Google approval was previously recorded; do not repeat submission from stale setup notes. See the [current checklist](../plans/2026-09-28-google-calendar-release-readiness.md). |

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
