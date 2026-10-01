# Onboarding release, then task-dialog and document-scroll work

Prepared October 1, 2026. **Execution instructions for the next worker. No release was performed while writing this plan.**

**Latest user steering:** execute onboarding only. Do not resume dialog/document scrolling; Caleb will switch to another model to plan orchestration. All UI-resumption instructions below are superseded and remain historical background.

This document is the primary continuation. It supersedes conflicting approval, testing and ordering instructions in the earlier organization-onboarding executor handoff. Read the [audit/spec](2026-10-01-organization-onboarding-audit.md) and [validation evidence](2026-10-01-onboarding-validation.md); use the older handoff only for a specific referenced detail. Do not restart completed audit work.

## 1. Authorization and exact finish line

Caleb instructed: “prepare the scoped release. pass required hosted ci/review then deploy so we can get back to task dialog/mission vision scrolling.” This authorizes the next executor to prepare/push the onboarding PR, satisfy required checks/review, merge through the protected workflow and verify production deployment. **Do not ask for shipping approval again.** Actual GitHub approval and branch protection remain mandatory; user product approval does not fabricate a GitHub review.

Order is fixed:

1. Isolate the existing onboarding implementation.
2. Open the scoped PR; obtain passing current-revision CI and required review.
3. Merge and verify production revision/deployment.
4. Record onboarding release evidence and stop; preserve dialog/document-scroll candidates for the next model.

Real signup/payment testing and the old 22-case manual matrix remain deferred by Caleb. Use accepted simulator review and focused checks already recorded. No provider provisioning, broad new testing, customer repairs, billing changes, rename control, inferred names or customer messages. No database migration is needed.

**Historical-data clarification:** 20 organizations currently lack names. The 18 builder recovery candidates comprise 16 unnamed builders plus two named builders missing other basics. These counts are not recovered historical names. Nine of the 22 records missing basics have an old access-only completion event; 11 have an unknown cause; two have member intent. No verified historical names are available to restore. Karen's July bypass is proven; whether she saved a name later is unknown. Existing saved fields must be prefilled; owners provide only missing/corrected information. Do not promise automatic restoration or populate Offshootz from the email/domain. Human account classification is a follow-up, not a prerequisite to deploying the preventive code.

Finish line for onboarding: merged SHA, required CI run and review evidence, production deployment ID/URL and timestamp tied to that SHA, completed bounded read-only verification, and updated lane/runlog. Deferred real persistence/payment behavior must remain explicitly unverified. Do not call the whole internal-projects lane closed: the dialog/scroll work follows it.

## 2. Startup and preservation

Use this source worktree:

```sh
cd /Users/calebhamernick/Development/coach-house-platform-internal-updates-20261001
export PATH="/usr/local/opt/node@22/bin:$PATH"
```

Read AGENTS.md, docs/RUNLOG.md, its current monthly entries and docs/agent/open-work-index.md. Then read docs/agent/workflow-quality.md and this document. Check branch/dirt/worktrees once and report a short checkpoint. The selected strategy is a fresh scoped release worktree; no branch-choice question is needed.

Recorded source: `feat/internal-project-task-updates-20261001`, HEAD `90830359812af48c5f837704942c99bf0ffd0d3b`, no upstream. Runtime files and several new files are uncommitted. The reviewed source snapshot is fixed by [the 21-file manifest](2026-10-01-onboarding-release-files.json). A commit alone does not preserve these changes.

The root checkout is unrelated dirty recovery work. Never reset/stash/clean it, prune stale worktrees, bulk stage the source, copy environment files, or stop another process. Preserve source files, ignored private audit data, review simulator and paused UI candidates. Do not copy root startup docs over this worktree. Existing ports 3000, 3014 and 3015 must be inspected before any server operation; this release does not need another local browser server.

Before remote work verify the remote is `Hamernick/coach-house-lms` and inspect existing PRs for the intended branch. Resume matching work rather than creating a duplicate. Never overwrite an existing release directory/branch with unexamined work.

## 3. Frozen production scope

Scope amendment from automated review: `src/actions/organization.ts` trims provided names after validation before merge/storage. The existing preservation test verifies a padded 120-character name is stored trimmed. This is the sole additional runtime file.

The JSON manifest enumerates all **16 runtime files and five tests**, their current SHA-256 values and source-HEAD baseline values. It includes:

- Shared setup requirements and saved personal-handle defaults.
- Dashboard/onboarding/Workspace integration and read-error handling.
- Server/client organization-name and formation validation.
- Existing focused onboarding/profile-preservation tests plus the new requirements test.

Required behavior is the seven-point implementation contract in the audit. Preserve paid entitlement enforcement, free-access behavior, staff/invited/member exemptions, profile merge/revision semantics, existing handles and all saved documents.

Additional allowed generated change: `tests/acceptance/projects.json`, regenerated against current main. It must register `onboarding-requirements.test.ts` exactly once; it must not introduce `onboarding-review.test.ts` unless that feature already shipped independently on main.

Allowed documentation: this plan, its JSON manifest, the redacted audit, validation document, `docs/operations/onboarding/incomplete-builder-audit.sql`, narrow edits to the active-lane entry and an appended current-month runlog entry. If current main still points at September, create/carry forward the missing October log entries and change only the current link in `docs/RUNLOG.md`. Reconcile existing newer log content; never replace it wholesale or reopen coaching credits.

Explicitly exclude these source-only groups from the onboarding PR:

```text
src/features/onboarding-review/**
src/app/(public)/dev/**
tests/acceptance/onboarding-review.test.ts
src/features/platform-admin-dashboard/upstream/components/QuickCreateModalLayout.tsx
src/features/platform-admin-dashboard/upstream/components/projects/AddFileModal.tsx
src/features/platform-admin-dashboard/upstream/components/projects/CreateNoteModal.tsx
src/features/platform-admin-dashboard/upstream/components/tasks/TaskQuickCreateModal.tsx
src/features/member-workspace/components/projects/organization-core-document-editor.tsx
src/features/member-workspace/components/projects/editor-interaction-preview.tsx
src/features/member-workspace/client.ts
src/app/(public)/visual-regression/project-feedback/page.tsx
tests/visual/editor-interactions.visual.spec.ts
test-results/**
.env*
graphify-out/**
```

No dependencies, migrations, policies, webhook/billing code, provider configuration, workflow changes or screenshot baselines belong in this release. A required correction must remain within onboarding ownership; document its reason and rerun only the affected local checks.

## 4. Isolate the candidate

Run from the source directory after the checkpoint:

```sh
git fetch origin main
git rev-parse origin/main
git status --short --branch
git worktree list
git ls-remote --heads origin fix/organization-onboarding-recovery-20261001
gh pr list --repo Hamernick/coach-house-lms --state all --head fix/organization-onboarding-recovery-20261001 --json number,url,state,headRefName
```

Record the freshly fetched base SHA. At planning time the release branch did not exist locally. If the branch/directory/PR is absent, create it:

```sh
git worktree add -b fix/organization-onboarding-recovery-20261001 /Users/calebhamernick/Development/coach-house-platform-organization-onboarding-release-20261001 origin/main
```

If matching release work already exists, verify its branch/base/diff and resume its completed steps. Do not create it again or apply the patch twice.

For a fresh release, run this from the source directory. It validates the frozen source, creates a private temporary patch, includes the three untracked implementation/test files and applies only allowed changes. It never copies credentials or replaces current-main files wholesale.

```sh
python3 - <<'PY'
import hashlib, json, os, subprocess, tempfile
from pathlib import Path
m = json.loads(Path('docs/plans/2026-10-01-onboarding-release-files.json').read_text())
source, release = Path(m['source_worktree']), Path(m['release_worktree'])
def git(cwd, *args):
    return subprocess.check_output(['git', '-C', str(cwd), *args])
assert git(source, 'rev-parse', 'HEAD').decode().strip() == m['source_head'], 'Source HEAD changed: reconcile before transfer'
assert git(release, 'branch', '--show-current').decode().strip() == m['release_branch']
assert not git(release, 'status', '--porcelain').strip(), 'Release has existing work: inspect/resume, never overwrite'
tracked, additions = [], []
for row in m['files']:
    p = source / row['path']
    assert hashlib.sha256(p.read_bytes()).hexdigest() == row['source_sha256'], f'Source changed: {p}'
    (tracked if row['tracked_at_source_head'] else additions).append(row['path'])
patch = git(source, 'diff', '--binary', m['source_head'], '--', *tracked)
for name in additions:
    result = subprocess.run(['git', 'diff', '--no-index', '--binary', '--', '/dev/null', name], cwd=source, capture_output=True)
    assert result.returncode == 1, f'Unexpected added-file diff result: {name}'
    patch += result.stdout
out = Path(tempfile.mkdtemp(prefix='coach-house-onboarding-release-'))
os.chmod(out, 0o700)
artifact = out / 'onboarding.patch'
artifact.write_bytes(patch)
os.chmod(artifact, 0o600)
print('Scoped patch:', artifact)
subprocess.run(['git', '-C', str(release), 'apply', '--3way', '--index', str(artifact)], check=True)
print('Applied allowed runtime/tests; inspect staged diff before continuing.')
PY
```

On a hash mismatch, stop transfer and inspect only the changed source files. Do not refresh hashes blindly. If the source legitimately changed, document the diff and update the manifest after review. On a three-way conflict, preserve the patch and resolve only the owned onboarding changes against current main; retain newer main behavior. If a resolution needs unrelated feature decisions, report the exact conflict and leave merge blocked. A partially applied patch is not permission to reset the release tree.

In the release directory, install its own locked dependencies (`pnpm install --frozen-lockfile --offline`, with ordinary frozen install only if the cache lacks packages). Never share a node_modules symlink. Run `pnpm test:acceptance:manifest:update`; review the manifest diff. Copy only the allowed new documents, reconcile lane/log updates, and inspect `git diff --cached` plus unstaged/untracked inventories. Confirm no imports into the excluded simulator/scroll files were introduced.

If no current-main overlap occurred, the runtime/test bytes must match the manifest after application. If overlap required adaptation, list those paths/reasons in release evidence; old results for those files are no longer sufficient.

## 5. Bounded local verification and commit

Accepted evidence: Caleb reported the 14-scenario review “seeming fine.” Previous focused batch passed 55/55; a subsequent affected-action rerun passed 14/14. Changed-file lint, structure and boundaries passed. This is not production or real-provider proof.

Do not rerun the entire local quality suite. For an identical port with unchanged dependencies/configuration, reuse these results and let required hosted CI validate the release revision. Regenerate/check manifest, review diff whitespace and run mandatory pre-push/secret checks. If adaptation changes relevant runtime/tests, run only affected files from:

```sh
pnpm exec vitest run --config vitest.projects.config.ts tests/acceptance/onboarding-requirements.test.ts tests/acceptance/onboarding-defaults.test.ts tests/acceptance/onboarding-actions.test.ts tests/acceptance/onboarding.test.ts tests/acceptance/organization-profile-persistence-validation.test.ts tests/acceptance/people-profile-write-concurrency.test.ts
```

Remove unaffected paths from that command. Run changed-file ESLint for adapted code. No broad Playwright journey, signup/payment account, additional test framework or visual-baseline change. Onboarding server actions must retain the existing cold-import isolation and free/paid authorization assertions.

Before committing, enumerate staged paths and ensure each appears in the JSON allowlist or the documentation/generated-file allowance. Stage explicit filenames, never `git add .`. Update the release log with candidate scope, evidence reused, deferred provider tests and current authorization.

```sh
git diff --check
git diff --cached --check
gitleaks git --pre-commit --staged --redact --no-banner
git commit -m "[STEP S04] Require saved organization setup for legacy builders"
```

Confirm the installed gitleaks supports these flags with `gitleaks git --help`; use its equivalent redacted staged-diff mode if needed. Never suppress a finding or print secrets. After commit scan the full outgoing range with `gitleaks git --redact --no-banner --log-opts="origin/main..HEAD"`. Run the repository's configured pre-push hook normally when pushing; do not bypass it or run the same pre-push suite twice without a reason.

If any code was adapted, refresh the local Graphify AST according to the runbook. Graph outputs remain ignored. Do not create an API/model-backed rebuild or install shared hooks as part of release preparation.

## 6. PR and required hosted gates

Push only `fix/organization-onboarding-recovery-20261001` with upstream. Create one PR to main titled `[STEP S04] Require saved organization setup for legacy builders`. Use `.github/PULL_REQUEST_TEMPLATE.md`, preserving truthful checkbox status; the local full-quality checkbox stays unchecked with an explanation that required hosted CI is used. Write the body to a temporary file and use `--body-file`.

Suggested summary:

> Legacy access-only onboarding could mark a builder complete before organization basics were saved. Dashboard and Workspace now require persisted name, public URL and formation status and reopen existing setup with saved fields and the current personal handle. Paid users retain their plan; profile merge/revision checks preserve saved documents. Workspace rejects explicitly blank names. No migration or customer data repair.
>
> Local interaction review accepted; focused gate/default/action/preservation checks passed. Real signup/payment and database reload checks are deferred by user direction. No visual redesign. Simulator, private account inventory and task/document-scroll changes are excluded.

Create as draft while inspecting the final diff, then mark ready for required review. Inspect `.github/CODEOWNERS` and actual branch protection. The recorded owner is `@calebhamernick`; the active GitHub account was `Hamernick`. Do not assume an authenticated author can approve their own PR. Never impersonate a reviewer, self-approve, dismiss required reviews, use an admin bypass or change protection. If a GitHub review request is needed, use the normal PR review-request mechanism within this authorized review workflow; no separate email/Slack/customer messages.

Record the PR number as `ONBOARDING_PR`, then use bounded status reads:

```sh
gh pr view "$ONBOARDING_PR" --repo Hamernick/coach-house-lms --json url,headRefOid,baseRefName,isDraft,reviewDecision,mergeStateStatus,statusCheckRollup,reviews
gh pr checks "$ONBOARDING_PR" --repo Hamernick/coach-house-lms
```

Check at meaningful intervals, about 60 seconds while running; do not repeatedly rerun CI. Required aggregate `quality` currently depends on static, acceptance, RLS, build and visual jobs. Validate-step-id and all other actual protected-branch requirements must pass too. Inspect current workflow and check conclusions; skipped/canceled/missing is not passed. Capture the current head SHA and CI run URL. Each new push invalidates previous-head quality evidence and may invalidate approval.

If CI fails, read the failed job log once and classify:

- Onboarding-owned failure: make the smallest correction, run its relevant local check, update evidence, push and obtain new current-head CI/review.
- Unrelated failure: record job/run/error; leave merge blocked. Prior PR #264 had unrelated Calendar mobile snapshots fail; do not alter Calendar code/baselines here or assume that old failure is still present.
- Infrastructure/transient failure with evidence: one bounded rerun is acceptable; repeated failure remains blocked.
- Review required: give Caleb the exact PR link and say GitHub requires code-owner approval. This is a review gate, not another request for permission to deploy. Continue any independent preparation; do not claim review passed.

## 7. Merge and production deployment

Proceed automatically once the exact current PR head has required successful checks, valid required approval, no unresolved changes-requested state and satisfied branch protection. Inspect the complete diff one last time. Capture the existing production deployment SHA/ID using an authenticated read-only deployment surface for rollback context.

Use normal protected squash merge, matching the inspected SHA:

```sh
gh pr merge "$ONBOARDING_PR" --repo Hamernick/coach-house-lms --squash --match-head-commit "$ONBOARDING_HEAD_SHA"
gh pr view "$ONBOARDING_PR" --repo Hamernick/coach-house-lms --json state,mergedAt,mergeCommit,url
```

Set `ONBOARDING_HEAD_SHA` from the just-verified `headRefOid`; never paste the source-worktree HEAD. Do not use `--admin`, disable checks, force-push main, delete branches/worktrees or promote a local dirty build. If the head changed before merge, repeat the gate check for the new revision.

Production normally follows the main-branch integration. Wait for that deployment instead of creating a parallel manual deploy. Verify the deployment for the returned **merge SHA**, environment **Production**, status **Ready/success**, and alias **coachhouse.app**. A preview deployment, green GitHub CI or successful merge alone is insufficient.

Available read-only discovery path:

```sh
gh api "repos/Hamernick/coach-house-lms/deployments?sha=$ONBOARDING_MERGE_SHA&per_page=100" --jq '.[] | {id,sha,environment,created_at,statuses_url}'
gh api "repos/Hamernick/coach-house-lms/deployments/$ONBOARDING_DEPLOYMENT_ID/statuses" --jq '.[] | {state,environment,environment_url,target_url,created_at}'
```

Select IDs only from observed results. If GitHub deployment records cannot establish Production/alias/revision, use the available authenticated Vercel connector/dashboard read surface for the existing Coach House project. Do not provision/relink a project, print credentials or claim deployment from a generic HTTP 200. If the integration does not run, identify the exact existing project/main SHA and use its normal authorized production deployment path; ambiguous project identity is a blocker.

Minimal verification after Ready:

1. Record canonical site availability and production deployment revision. Use a bounded request; no screenshot tour.
2. Run the existing read-only incomplete-builder SQL once through the already authorized verified project. Compare to the pre-release 18 builder backlog; unchanged backlog is expected until owners enter details. Do not expect deployment to create names. New/unexpected records require inspection, not a blanket repair.
3. Refresh Karen's saved-profile/document-reference/roadmap fingerprints and subscription identifiers/status read-only using the existing private audit helper. Retain before/after evidence privately. Code deployment makes no customer data writes; investigate differences with timestamps before attributing them to the release because normal customer edits can occur concurrently. Do not invoke entitlement force-sync as a supposed read-only check.
4. Record that authenticated recovery save/reload and live checkout remain deferred. Do not sign into Karen's account, alter cookies to impersonate her, fill her form, create a live test subscription or require another broad manual test to finish this release.

For a confirmed release regression, stop further rollout work, preserve evidence and prepare a revert of only this onboarding change through protected workflow. Do not reset main, restore the database, revert subsequent unrelated releases or roll back customer content. If immediate production rollback needs action beyond this deployment instruction, present the exact deployment/revert and consequence for Caleb's decision; do not invent emergency authority.

## 8. Close onboarding release; UI work paused by latest instruction

Append release evidence to the active monthly runlog and audit/validation status: PR URL, merge SHA, successful current-head CI run, actual review evidence, deployment ID/URL/Ready time, read-only verification results and deferred checks. Update the existing internal-projects lane entry in place. State onboarding shipped, customer recovery backlog pending owner input/human classification. Do not list it as an unfinished code release or close the remaining UI work.

Do not execute the remaining UI instructions in this section. After production verification stop; Caleb will switch models to plan orchestration of the two original reports. Historical instructions follow: Start a separate `fix/internal-task-dialog-document-scroll-20261001` worktree from freshly fetched main. Preserve the original source candidates and review their diffs before porting; never carry onboarding/test-simulator changes into the UI PR.

Exact UI ownership: the nine UI paths excluded in section 3 (four quick-create layout/task/note/file files, core-document editor, optional interaction preview/export/route and its focused visual spec). The preview-only files are optional local evidence and must not become publicly exposed routes. No rename control or unrelated collaboration/organization redesign.

Acceptance criteria:

| Report | Required result | Smallest useful check |
| --- | --- | --- |
| Task opens below the blurred list | Open a task after scrolling the underlying list; dialog is immediately inside the viewport, content/actions reachable | One actual-app reproduction; verify open/close/focus and save/reopen |
| Shared dialog affects note/file | Existing note/file primary actions remain reachable; nested fields/popovers still usable | One opening/primary-action check per shared surface |
| Mission/Vision text jumps while scrolling | Long existing text scrolls smoothly by wheel/trackpad and keyboard; controls remain reachable; save preserves content | One long-document reproduction and save/reopen, using an authorized test document or existing protected fixture |

Present the affected app routes to Caleb for focused review. Prior onboarding review does not approve these previously paused UI changes. Once those specific visual/interaction changes are reviewed, follow required CI/review and protected release workflow for the separate UI PR. Do not interrupt onboarding shipping to build these fixes early. No broad viewport/browser matrix or realtime collaboration feature.

## 9. Required executor ledger and stop rules

Keep a concise evidence table in this document or its release log; fill it as work happens, never prospectively:

| Step | Starting state | Completion evidence |
| --- | --- | --- |
| Scoped source snapshot | READY: manifest written | 21 source hashes verified; preservation inventory |
| Release worktree/port | NOT STARTED | Fresh base SHA; final allowed diff |
| Local evidence/scans | Prior focused checks PASS | Reuse justification or affected rerun; scan/pre-push results |
| PR/current-head CI | NOT STARTED | PR URL, head SHA, required checks and run URL |
| Required review | NOT STARTED | Valid code-owner review and protection satisfied |
| Merge/production | NOT STARTED | Merge SHA, Production deployment and canonical alias |
| Bounded verification | NOT STARTED | Availability and read-only evidence; deferred checks stated |
| UI continuation | PAUSED by latest user instruction | New isolated UI branch, reported-bug evidence and user review |

Stop only the dependent action for a source hash conflict, unknown production target, unresolved required CI/review, an unrelated failing gate or a change requiring customer data/billing mutation. Record exact evidence and continue independent authorized preparation. Do not ask the same deployment permission again. Do not call uncertain historical information “restored,” pending checks “passed,” or a merged PR “live.”

## 10. Copy-ready worker prompt

> Execute `/Users/calebhamernick/Development/coach-house-platform-internal-updates-20261001/docs/plans/2026-10-01-onboarding-release-executor.md` in order. Read the repository startup contract, then verify its 21-file source manifest. Use a fresh scoped onboarding release worktree. Reuse completed audit and accepted local review; no extensive local testing or real signup/payment tests. Caleb has authorized deployment after required current-head hosted CI and actual GitHub review/protection pass; do not ask for shipping approval again. Preserve documents/subscriptions, source worktrees and private evidence. No customer name restoration is proven or authorized. Finish onboarding PR/merge/production evidence, update the lane/log, then stop. Dialog/document scrolling is paused by latest instruction for another model to plan orchestration. Follow the plan's explicit stop rules; never bypass CI/review or silently expand scope.
