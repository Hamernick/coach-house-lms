# Stable MVP release sprint

Status: release integration in progress; not deployed. Scope: all retained work from this internal UI/onboarding conversation. Latest user decisions supersede older design and free-access notes. This plan prioritizes reliable completion and payment over further polish.

## Verified starting point

- Source lane: `feat/rapid-ui-ux-20261007`, localhost:3001. Preserve it and other active checkouts. At inspection:203 tracked changes,62 untracked paths;1 commit ahead/14 behind origin/main. Main was verified at `d159d722`; refresh again before integration. No release PR exists for this lane.
- Supabase link works in `/Users/calebhamernick/Development/coach-house-platform`, project `vswzhuwjtgzrkxknrmxu`; a read-only remote migration list succeeded. The internal source worktree is separately unlinked.
- Remote history has253 migration versions. Our `20261012163000_gate_free_workspace_document_writes.sql` is absent and is the only source-lane migration not recorded remotely. No database changes were performed.
-15 remote migration versions are absent from current origin/main:20260904220000,20260914180000,20261010100000,20261010120000,20261010130000,20261010140000,20261010150000,20261010160000,20261010170000,20261011090000,20261011100000,20261011110000,20261011120000,20261011130000,20261012160000. Reconcile provenance and schema compatibility before using a release migration command; do not reset or rewrite remote history to match an old checkout.
- Existing focused evidence:40 billing tests pass,44 launch/Accelerator tests pass,15 team-access tests pass. Scoped types/lint pass for latest changes. These are not a complete current-main release or end-to-end billing signoff.

## Shipping scope

Carry forward the retained signup/profile/username flow, Google metadata prefill and workspace landing; sidebar/navigation and upgrade overlay; observational responsive guide and completion; organization/activity cards and inline paid launch editor; People table/header/searchable roles/segments/drag-and-drop; drawer layout; Accelerator lesson routing/progress; publication and globe changes; and free/paid access controls.

Keep free workspace/profile/program/People/tool/Drive-link flows working. Native document editing/storage, roadmap editing, team access and Accelerator capabilities use their respective server entitlements. Free users see paid previews; Build your nfp forms stay locked. Existing native documents stay readable; no complimentary credits for new free accounts. Preserve legitimate prior purchases and role limitations.

The abandoned connected planner stays removed. Do not import another chat's canvas-rail features or public-map redesign. Preserve already merged fixes and existing approved UI. Only fix release blockers and concrete regressions; no new designs/features during the sprint.

## Execution order and exit gates

### 1. Preserve and assemble one release candidate

- Create a recoverable snapshot/manifest of tracked and untracked source changes, including assets and migration/test files; exclude credentials, caches and unrelated local files.
- Create an isolated release worktree from refreshed main. Port the full retained conversation scope in reviewable commits, reconciling the ahead commit with already merged PR276 and preserving main's auth, signup, scrolling and map fixes.
- Inventory each changed path as included, already shipped, or unrelated/preserved. Do not bulk-copy the old repository or replay main-only migration deletions.
- Open a draft release PR early. Keep localhost:3001 undisturbed until the candidate is ready for the final review pass.
- Exit: complete scoped diff, no lost work, no accidental unrelated migration/code deletion, one reproducible candidate revision.

### 2. Make paid activation reliable — highest functional priority

Owners: `src/components/paywall/**`, `src/app/api/stripe/checkout/route.ts`, `src/app/(public)/pricing/success/**`, entitlement readers and Stripe webhook persistence.

- Retain the selected organization and exact workspace return URL, including drawer/guide context, across checkout and cancellation.
- Check returned database errors and thrown errors; only claim features are activated after durable subscription state is verified. Existing success-on-sync-failure tests must change.
- For a paid checkout awaiting subscription/webhook persistence, show a clear activation-pending/retry state. Recheck the same owned session; never send the user to pay again just because activation is delayed. Bound retries and provide a recoverable outcome if the provider/database remains unavailable.
- Align active/trialing/past_due/incomplete handling with feature access rules. A success marker alone must never unlock a feature.
- Ensure all workspace/sidebar/server/client consumers resolve the same organization's updated entitlement after return. Reload must retain access. Keep webhook processing idempotent and handle duplicate/delayed events without duplicate benefits.
- Show cancellation/errors visibly after the local pricing overlay unmounts, with a route back to the same workspace and a safe retry.
- Exit: focused regressions prove persistence failure, delayed/missing subscription, wrong session owner, selected-org isolation, canceled/incomplete payment and repeated return behavior; normal paid return unlocks Documents, Accelerator and team access.

### 3. Reconcile and validate the database change

- Identify the15 remote-only migrations and recover their source/provenance without changing unrelated workstreams. Compare relevant live schema/policies/triggers with the candidate to detect overlap with `20261012163000`.
- Link the isolated release worktree to the verified project when needed; linkage is checkout-local. Obtain a migration dry-run that names only approved unapplied changes. No broad push from the old root or UI worktree, no migration repair/reset just to silence mismatch.
- Run the candidate migration and existing RLS fixtures in isolated PostgreSQL. Verify free reads, profile edits and Drive links; blocked native writes; paid writes; cross-org isolation; downgrade and revocation. Test compatibility with the currently deployed app as well as the candidate.
- Prepare explicit forward/rollback SQL and record expected policy names. Retain data and security restrictions during application rollback; do not casually drop paid-access protections.
- Exit: approved migration set and exact ordering documented; no unaccounted schema conflicts. Apply only in the coordinated release window after the candidate gates pass.

### 4. One focused full-flow acceptance pass

Use a fresh free organization and an existing paid organization. Preserve the user's earlier valid reviews; repeat only affected paths.

| Journey | Required result |
| --- | --- |
| Email signup/confirmation and Google entry | Correct compact onboarding, required unique handle, saved profile, correct workspace landing; no internal map detour |
| First workspace load and guide | Sidebar open, drawer closed/Organization default, no fiscal card; guide targets visible, pricing overlay unblocked, finish clears guide URL and recenters |
| Free account | Paid controls stay visible but inaccessible by pointer/keyboard/direct action; native documents readable; profile/People/Drive/tool flows usable; zero free coaching credits |
| Upgrade from workspace | Stripe test-mode payment -> verified activation -> same workspace/context; paid forms, documents, lessons and team actions work; reload retains access |
| Payment recovery | Cancel, failed/incomplete checkout, delayed webhook and database error recover without misleading success or duplicate payment |
| Existing paid account | No reset of organization/layout/progress; lessons open the selected lesson; saved edits, uploads and team roles remain correct |
| People/drawer/publication | Same table on small screens, reachable toolbar, pinned cells and drag/drop; drawer handle reachable; paid publication explicit and saved state truthful |

Run the critical UI pass on desktop and one narrow mobile viewport, with light/dark and keyboard/reduced-motion checks focused on changed controls. User remains the appearance reviewer; direct automated browser access previously encountered a restriction and must be available through an authorized surface before claiming browser evidence. Stripe test mode must be explicitly verified before submitting payment; no real charge as an incidental test.

Exit: all critical journeys pass; no unresolved blank pages, update loops, data loss, unauthorized writes, paid-but-locked states, or inaccessible primary controls. Log nonblocking cosmetic follow-ups separately without reopening approved design.

### 5. Required CI, coordinated release, production smoke

- Run targeted development checks as fixes land. Use the required hosted static, acceptance/snapshot, RLS, build and visual lanes on the final PR revision; aggregate `quality` and branch-protection requirements must pass. Resolve known stale tests/type fixtures; do not waive unrelated required failures. Update only reviewed affected visual baselines.
- Confirm production Stripe prices/mode/webhook configuration and database target without exposing secrets. Record the rollback deployment and migration strategy.
- Choose migration-before-app only if current-app compatibility passes; otherwise stage a compatible rollout. Apply the reviewed migration, verify its remote history and enforcement, then merge/deploy through the normal release process. Do not let automatic deployment outrun the required database step.
- Verify the production deployment serves the merged revision. Smoke-check login/workspace, free restrictions, existing paid access and checkout return configuration; verify provider events/entitlements for an authorized canary. Keep real charges outside incidental smoke testing.
- Exit: merged revision, successful deployment, applied migration receipt, passing critical production checks and rollback reference recorded. Only then call the MVP shipped.

## Immediate next action

Snapshot and assemble the current-main release candidate, then fix activation persistence/recovery first. Work through this sequence without additional design rounds or broad repeated testing. No production migration, payment, merge or deployment was performed while making this plan.

## Release candidate checkpoint

- Release lane: `feat/stable-mvp-release-20261012` at `/Users/calebhamernick/Development/coach-house-platform-mvp-release-20261012`, based on current main `d159d722`. Source localhost:3001 remains untouched.
- Recoverable snapshot: `~/.local/share/coach-house/worktree-backups/mvp-release-20261012T181202Z/` contains tracked binary patches, changed/untracked files and hashes for320 paths.
- Three-way integration resolved10 conflicted files. Retained main onboarding scroll-chain and auth/Find fixes; kept latest workspace-on-Free, inline onboarding, activity targeting and publication-withdrawal behavior. Main-only migrations remain present. All retained source additions were copied without collisions.
- No previously agreed features are excluded by scope freeze. Only the abandoned connected planner and other-chat public-map redesign/canvas-rail work are outside this release.
