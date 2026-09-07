# Local development synchronization — 2026-09-07

Status: complete. All 22 original active checkouts and the integration checkout
share the validated development baseline. Root serves localhost:3010.

## Authorization and recovery

The user approved backing up local work, combining current features into a local
integration branch, validating it, and syncing active checkouts. This operation
has no remote push, deployment, provider change, migration application, or
historical-checkout deletion.

- Integration: `chore/development-sync-20260907` in `/Users/calebhamernick/Development/coach-house-platform-development-sync-20260907`.
- Original Git history and dirty files: `/Users/calebhamernick/Development/coach-house-sync-backup-20260907-150326`.
- `history.bundle` verified; file archives and SHA-256 manifest recorded.
- Original inventory: 29 present checkouts, five missing registrations, five dirty checkouts.
- Active scope: 22 original checkouts, plus the new integration checkout.

## Integration decisions

- Started from current `origin/main` (`67501039`), then fast-forwarded to the
  catch-up snapshot. This preserves prior Workspace, profile, resource crawler,
  Documents, and Find reliability work.
- Merged the Documentation snapshot with all 65 changed/new files, including
  original artwork, current glass eyebrow, integrated planners, inline canvas
  editors, and reviewed visual baselines. Used its latest feature-owned files.
- Reconciled shared shell/search props with the catch-up shell lifecycle fixes.
- The older Documents UI snapshot is already represented by later catch-up
  implementation. Preserved newer download/error propagation, upload rollback,
  centralized limits, selection behavior, grid/list support, and consent fixtures.
  Its 17 root-level review screenshots remain in their original worktree and backup.
- Reconciled Find weather history while preserving newer camera lifecycle,
  failure/empty states, card spacing, and matching tests. The resulting weather
  merge introduced no source changes because the catch-up tree already includes it.
- Preserved both source monthly runlogs when histories overlap.
- Local checkpoint refs use `chore/sync-snapshot-*-20260907`; original working
  directories and indexes remain untouched until the final verified sync.

## Validation and final sync

1. Run static checks, full acceptance, isolated PostgreSQL/RLS suites, build,
   complete visual regression, and performance checks in the integration checkout.
   Keep provider variables empty for hosted-fixture runners; do not write shared
   production fixtures as a local verification step.
2. Confirm latest Documentation, Documents, profile settings, and Find behavior;
   resolve integration defects and refresh only justified visual baselines.
3. Record a final local commit and verify a post-integration history bundle.
4. Recheck every original changed-file hash and branch before syncing. Stop for
   any newly concurrent edits; preserve all existing untracked review artifacts.
5. Align the active branch checkouts to the tested local baseline, retain their
   original tips/checkpoints in backup refs, and run localhost:3010 from the
   canonical root checkout. Keep main, remote refs, and historical checkouts intact.

## Checkouts

| Checkout | Branch before sync | Treatment |
| --- | --- | --- |
| `coach-house-platform` | `feat/resource-map-owned-crawler-20260902` | Sync to tested baseline |
| `coach-house-find-active-count-20260820` | `fix/find-stable-active-count-20260820` | Missing registration retained |
| `coach-house-find-org-profile-recovery.6qo0ah` | `recovery/find-organization-profile-20260820` | Missing registration retained |
| `coach-house-graphify-setup.Gcq6H9` | `chore/graphify-setup-20260820` | Missing registration retained |
| `coach-house-nfp-recovered.V0smxK` | `detached` | Missing registration retained |
| `coach-house-workspace-access.qTQYsm` | `feat/workspace-access-drawer-20260818` | Missing registration retained |
| `coach-house-platform-batch2-release` | `agent/batch2-organization-workspace-foundation-20260806` | Historical release snapshot |
| `coach-house-platform-batch3-release` | `feat/batch3-fiscal-project-operations-20260806` | Historical release snapshot |
| `coach-house-platform-build-collect-navigation-20260902` | `feat/build-collect-navigation-20260902` | Sync to tested baseline |
| `coach-house-platform-dev` | `feat/public-profile-activation-20260902` | Sync to tested baseline |
| `coach-house-platform-documentation-20260831` | `feat/documentation-marketplace-design-20260904` | Sync to tested baseline |
| `coach-house-platform-find-drawer-initial-collapsed-20260829` | `fix/find-drawer-initial-collapsed-20260829` | Sync to tested baseline |
| `coach-house-platform-find-map-camera-polish-20260828` | `feat/find-map-camera-polish-20260828` | Sync to tested baseline |
| `coach-house-platform-find-ui-polish-20260828` | `feat/find-ui-polish-20260828` | Sync to tested baseline |
| `coach-house-platform-find-weather-cooling-20260828` | `feat/find-weather-cooling-20260828` | Sync to tested baseline |
| `coach-house-platform-google-auth-rollout-20260829` | `fix/onboarding-step-submit-race-20260829` | Sync to tested baseline |
| `coach-house-platform-google-drive-documents-20260831` | `feat/google-drive-documents` | Sync to tested baseline |
| `coach-house-platform-google-drive-switch-20260903` | `fix/google-drive-connection-switch` | Sync to tested baseline |
| `coach-house-platform-google-drive-ui-20260904` | `feat/google-drive-ui-iteration-20260904` | Sync to tested baseline |
| `coach-house-platform-homepage-redesign-20260828` | `feat/homepage-redesign-20260828` | Earlier homepage direction superseded by root Find and Build/Collect navigation |
| `coach-house-platform-launch-clean` | `launch/canvas-map-implementation` | Older unfinished recovery checkout |
| `coach-house-platform-local-catchup-20260904` | `chore/local-catchup-20260904` | Sync to tested baseline |
| `coach-house-platform-login-hotfix` | `hotfix/login-hcaptcha` | Historical login hotfix |
| `coach-house-platform-migration-history-reconcile-20260902` | `fix/migration-history-reconcile-20260902` | Sync to tested baseline |
| `coach-house-platform-pricing-return-hotfix` | `hotfix/onboarding-pricing-return` | Historical pricing hotfix |
| `coach-house-platform-public-impact-profiles-20260831` | `feat/public-impact-profiles-20260831` | Sync to tested baseline |
| `coach-house-platform-resource-map-enrichment-20260831` | `feat/resource-map-enrichment-20260831` | Sync to tested baseline |
| `coach-house-platform-resource-map-preview-isolation-20260828` | `fix/resource-map-preview-isolation-20260828` | Sync to tested baseline |
| `coach-house-platform-subscription-sync-hotfix` | `hotfix/subscription-sync` | Historical billing hotfix |
| `coach-house-platform-tools-20260828` | `feat/workspace-tools-center-20260828` | Sync to tested baseline |
| `coach-house-platform-tools-hotfix-20260828` | `fix/hide-unready-tools-20260828` | Sync to tested baseline |
| `coach-house-platform-unified-profile-settings-20260903` | `feat/unified-profile-settings-20260903` | Sync to tested baseline |
| `coach-house-platform-workspace-access-management-20260831` | `feat/workspace-access-management-20260831` | Sync to tested baseline |
| `coach-house-platform-workspace-ui-polish-20260828` | `feat/workspace-ui-polish-20260828` | Sync to tested baseline |

## Validation refinements

- Initial full gate passed all static checks, 2,434 acceptance tests, eight
  isolated database suites, and build. Six visual checks exposed environment or
  capture assumptions; provider-connected RLS fixtures remained skipped.
- Canvas screenshot tests now scroll the canvas into view and move the pointer
  away before capture. The mobile-dark canvas baseline alone was refreshed to
  capture its default node state instead of an incidental hover. Artwork and
  product styling were unchanged; all four canvas/editor comparisons passed.
- Deferred Find-detail tests now retain the identity of the existing rendered
  map or supported failure surface, covering a local checkout without a Mapbox
  token. Both viewport journeys passed while preserving the cold-import checks.
- Restored Tools in the Workspace drawer's screen-reader description, matching
  its current local tab and the original Tools feature branch.
- Earlier dedicated public-profile UI, duplicate camera helpers, and the older
  hide-Tools release variant are superseded by the current unified settings,
  extracted camera lifecycle, and implemented Drive/Finance Tools. Their source
  histories are retained without reverting those newer implementations.
- Final gate command: `NEXT_PUBLIC_ENABLE_REACT_GRAB=0 SUPABASE_SERVICE_ROLE_KEY=
  pnpm check:quality`. The review server will retain React Grab.

## Final validation

- All 21 stages passed in 506.34 seconds on `27e9bfc2`.
- Acceptance: 441 files passed, one skipped; 2,434 tests passed, one skipped.
- Eight isolated database suites passed; provider-connected fixtures were skipped.
- Visual regression: all 98 checks passed. Build/type checking passed.
- Performance: Find 1,823.6 KB / 1,975 KB; Community 605.9 KB / 900 KB;
  Admin 994.3 KB / 1,000 KB. No budget changes.
- Canonical review checkout after synchronization: root repository, local branch
  `chore/local-development-20260907`, port 3010.

## Completed synchronization

- Fast-forwarded all 22 active checkouts to `dcf59c18`, preserving original tips
  and dirty-file checkpoints. The completion record is a subsequent docs-only
  commit shared with the integration checkout; source remains the tested tree.
- Seven historical checkouts retain their original branches, heads, status, and
  changed-file hashes. Five missing registrations remain registered, with their
  committed history protected. All 17 Documents review screenshots are retained.
- Root now uses `chore/local-development-20260907` with no upstream. This is the
  canonical review checkout; future branch edits still require normal Git sync.
- Cleared 1.45 GB of root `.next` output and restarted port 3010 with React Grab.
  Verified listener working directory, HTTP 200 on home and Documentation, and a
  warm Documentation response in 0.346 seconds. Chromium confirmed the latest
  glass eyebrow, Social media header, five canvas nodes, no article tabs,
  no horizontal overflow, and no page errors.
- Refreshed the root Graphify code graph with `graphify update .`.
- Original and validated history bundles, dirty-file archives, checksums, quality
  reports, browser evidence, and final synchronization inventory are retained in
  the private backup directory. `history-after-sync.bundle` records final history.
- Local `main` remains `bb1a3e0b`; remote `main` remains `67501039`. No push,
  deployment, provider mutation, migration application, or hosted fixture write.
