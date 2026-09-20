# Internal tooling release candidate — September 20, 2026

User approval: isolated release branch/PR, controlled live acceptance tests with cleanup, and shared release if ready. Frank's intended email is the email supplied privately by the user; no account exists yet. Invitation authorization was requested separately because it sends email.

## Candidate

- Branch: feat/team-internal-tooling-release-20260920.
- Worktree: /Users/calebhamernick/Development/coach-house-platform-team-release-20260920.
- Parent local integration baseline: b476ada1. Production main d88a0943 is merged into this isolated candidate; the original dirty checkout and its localhost server are preserved.
- The local baseline was 138 commits ahead and three commits behind main. This candidate carries that existing integration dependency; do not describe it as an isolated small patch against production.
- Selected current changes: internal Organizations/Projects/Tasks, Coach Dashboard, staff scope, financial controls, guided setup/shared options, document editing/activity, navigation and necessary shared-component/profile/Drive dependencies. Unrelated Particles, objective planner and public Marketplace/design edits were excluded. Full-root prior test results do not certify this narrower candidate.

## Live blocker found and repaired

The document activity migration replaced the event check constraint and omitted the existing `deleted` type. All live permission assertions passed, but deleting fixture projects/users failed. Corrected the unreleased source migration and added forward repair 20260920214000_restore_deleted_activity_event.sql. The repair only expands allowed event types, preserves rows, and is recorded in live migration history. Its isolated regression passed before application.

First live test run: assertions passed; cleanup failed. Eight exact newly created fixture IDs were tracked and removed. Removal required deleting project/task rows before their organization, then dependent coach users. The existing organization cascade trigger can otherwise try to record activity after its parent organization is gone; direct organization deletion remains an identified limitation, outside the team project/task flow.

Second live run: RLS tests passed including normal cleanup. A fresh auth list confirmed no new test accounts remained. No original fixture account or real organization was deleted.

## Gates and release boundary

The candidate's final canonical Node 22 `PLAYWRIGHT_PORT=3003 pnpm check:quality` passes all stages (2,719 acceptance tests, 156 visual tests, live/isolated RLS, build and performance). No production deployment is approved as ready until the candidate passes this gate, hosted checks, and shared authenticated route/persistence verification. Current local owner workspace on port 3000 is untouched.

Pending: candidate gate, immutable commit/PR, hosted preview, multiple-role live create/assign/update/complete/reload, shared URL verification, and Frank onboarding. Do not reset a teammate's password or impersonate their existing session. Use disposable acceptance identities and clean them up by exact ID.

## Verified release preparation

- All 218 candidate migration versions exist in live migration history (read-only comparison).
- Live guided-project/shared-option canary: 19 assertions passed, including retry idempotency, assignment persistence, completion, fresh second-account reads, outsider denial, shared rename/color/delete, stale-edit rejection and persisted activity. All exact canary fixtures were removed. This does not replace authenticated coach browser verification.
- Standardized local/CI/deployment runtime on Node 22. The old local Node 20.12 runtime lacked the native WebSocket required by the installed Supabase client. No package upgrades. Candidate dependencies are installed independently; original localhost remains untouched.
- Included the existing narrowly scoped management authorization fix from PR #240: management/AI APIs require current developer staff authority, fail closed, and no longer accept a legacy admin profile after coach reassignment. Its matching regression suite is included.
- Production branch protection requires aggregate quality plus one code-owner review. No bypass requested or performed.
- Candidate repository is public; personal onboarding email is intentionally omitted from release documentation.

## Authenticated release rehearsal

On isolated production-mode port 3004, a disposable assigned coach successfully signed in, saw only its assigned organization/project/task, completed a task through the UI and retained completion after reload. The timeline displays the saved September 21–25 task interval. The coach edited the fixture mission document, reloaded and read the saved text; the Activity tab displayed that document event and task transition.

Authenticated file-route canary passed upload, fresh listing, signed download/content, trash, restore and permanent removal; no fixture file or storage object remains. Temporary browser identities remain tracked only until hosted verification completes.

Hosted configuration inspection found Drive and Calendar credentials scoped only to Production. Preserve those provider settings; new OAuth connections are outside preview certification. Standard Vercel protection can be retained while providing a shareable team preview link. Production requires aggregate quality and code-owner review.
