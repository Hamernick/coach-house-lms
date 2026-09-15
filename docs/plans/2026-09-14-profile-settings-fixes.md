# Profile settings completion

Local-only branch `fix/profile-settings-completion-20260914`, based on Documents
review `702b2a8d` to preserve the reviewed unified editor. No upstream or push.

- Synchronize saved public identity fields through an owner-scoped database
  trigger. Keep private contact/About separate from explicitly edited public bio.
- Save personal and communications drafts together; include public details in
  the same Save action and guard navigation with outstanding drafts.
- Use a visibility-only RPC and explicit loading errors/retry.
- Wire email preferences to existing delivery topics, consent records, and the
  Resend suppression check. Keep campaign scheduling and bulk-send activation
  outside this change.
- Remove the Person badge at its semantic owner, PublicProfilePage. It has no
  portal; Badge owns shared styling and stays unchanged.
- Validate with meaningful save, authorization, publication, email suppression,
  and UI tests. Migrations are local files until separately applied; no shared
  database or provider mutations as part of this work.


## Implementation checkpoint

Implemented locally on `fix/profile-settings-completion-20260914`:
- Account name, role, and avatar synchronization; separate public bio, location,
  and website editing; visibility-only updates preserve other publication flags.
- Shared desktop/mobile drafts, save across settings sections, failed-save
  retention, guarded public-profile navigation, and public-identity load retry.
- Canonical email preferences, consent events, metadata compatibility, and
  optional-email delivery checks that respect unsubscribes and suppressions.
- Removed the Person badge from the public person page.

Validation: all 16 static quality stages pass, including lint, structural
contracts, and snapshots. Acceptance: 2,517 passed, one skipped. All eight
isolated PostgreSQL suites pass; connected-database tests skip without credentials.
Four offline browser behavior tests pass. Both person-profile visual captures
pass; desktop/mobile baselines intentionally remove the redundant Person badge.

The user reported overheating. Stopped the remaining full TypeScript check,
Graphify refresh, and this task's temporary port-3021 preview. Do not restart
heavy checks without discussing the resource cost. Full TypeScript/Graphify and
the complete release quality gate are not verified. The earlier type-check run
reported existing test-fixture errors; no full type-check success is claimed.

The migration is an unapplied local file. No shared database, provider, account,
or email changes were made. No commits, pushes, merges, or releases. Root's
existing preview remains on its original checkout. Review the patch and apply
its migration in an explicitly approved environment before a connected canary.


## 2026-09-14 18:47 EDT - Apply approved Profile database migrations

- User explicitly authorized applying the migration and resolving the older
  migration warning. Linked target: Hamernick's Project,
  `vswzhuwjtgzrkxknrmxu` (the original checkout's configured database).
- Preflight found `/documentation` unclaimed and not reserved. Restored the
  already-applied Calendar migration `20260908160000` from root into the Profile
  worktree; no migration history repairs, timestamp changes, or Calendar rerun.
- Dry run listed exactly `20260904220000_reserve_documentation_public_handle.sql`
  and `20260914180000_complete_profile_settings.sql`. Applied those two with
  `supabase db push --linked --include-all --yes`.
- Read-only remote verification confirms both history rows, documentation
  reservation, enabled identity trigger, owner-scoped RPC grants (anonymous
  execution denied; trigger function also denied to authenticated clients),
  optional newsletter topic, and all 159 expected email preference rows copied
  from existing explicit choices. No email sent or account canary performed.
- Copied the exact new Profile migration into root as well, preserving existing
  files. Post-apply dry runs from both checkouts report remote database up to
  date. The migrations are still local/uncommitted files, requiring later Git
  backup with the feature; no Git commit/push, application deployment, or release.
- No builds, test suites, Graphify refreshes, or preview servers started. Prior
  remaining technical checks remain paused after overheating. Next: review
  save/reload and public-profile behavior using the updated application code.


## 2026-09-14 19:06 EDT - Stop expensive local Profile preview; prepare hosted review

- Reused the named Bandto Chrome review tab and started one low-priority
  Profile-worktree preview on port 3021, using ignored symlinks to existing
  root environment files. No credentials were printed.
- Workspace's first compilation consumed about 411 percent CPU and 3.7 GB
  RSS; browser navigation/control timed out. Stopped this task's preview
  processes and verified they exited. No profile fields or preferences edited.
- Restored the working original review page at localhost:3000/caleb. Its
  application code is still the original checkout, not the Profile fix branch.
- No test suites/builds/Graphify jobs restarted. Diff whitespace check passes.
  Remote Documents review base remains 702b2a8d; the Profile branch has no
  remote counterpart. Prepared docs/plans/2026-09-14-profile-preview-review.md
  with exact draft PR scope, prior evidence, and remaining checks.
- Need authorization for committing/pushing this currently local branch and
  creating a non-production hosted preview. No Git or deployment mutations
  performed; the earlier no-release boundary remains in force.
