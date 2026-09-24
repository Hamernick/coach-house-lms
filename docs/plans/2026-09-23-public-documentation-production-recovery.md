# S02 production recovery: executor instructions

## Objective and authority

Ship the existing public Documentation release and approved homepage/header corrections to `https://coachhouse.app`. Finish the four reported draft/export defects and failing release tests first. This is execution of Caleb's existing shipping request; preserve his accepted UI. This handoff supersedes the earlier release plan's outdated statements that no push/deployment occurred and shipping authorization was pending.

Do steps in order. Do not redesign Documentation, rewrite its content, merge another feature lane, or treat a successful Vercel preview as production verification.

## Verified starting state — September 23, 2026, 22:59 EDT

| Item                                              | Observed state                                                                                 |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| GitHub repository                                 | `Hamernick/coach-house-lms`                                                                    |
| PR                                                | [#247](https://github.com/Hamernick/coach-house-lms/pull/247), OPEN; no merge commit           |
| Release head                                      | `b85e3474600203170e252998186d3094a58ca8b9`                                                     |
| Remote main                                       | `0c5dbe39d1e9696579720db8f7466ff810970928`, S01                                                |
| Public HTTP                                       | `/` returns 200; `/documentation` returns 404                                                  |
| Latest recorded Production – coach-house-platform | S02 `b85e3474`, GitHub deployment `6628935592`, success                                        |
| Latest recorded Production – coachhouse           | S01 `0c5dbe39`, GitHub deployment `6625557969`, success                                        |
| Root checkout Vercel link                         | project `coachhouse`, `prj_OCQMCNOR2lwx9RnvPCUgqwsnCn8M`, team `team_ermpJ97QxUwIJpxrIlwwMmBI` |
| Release checkout Vercel link                      | No `.vercel/project.json`                                                                      |
| Hosted checks                                     | Static, acceptance, RLS, build pass. Visual: 9 failed / 82 passed; aggregate quality fails.    |
| Review policy                                     | One approving review and code-owner review required; no approval observed.                     |

**Working diagnosis:** the release is still outside `main`, and S02 was deployed to one of two Vercel projects. A wrong production target is plausible. The domain-to-project mapping has NOT been verified; neither GitHub deployment labels nor the local Vercel link prove it. Do not blame caching or change DNS on this evidence.

## 1. Resume the selected worktree and refresh facts

Selected branch strategy: continue the existing isolated release worktree while #247 remains open. Do not ask again which branch to use.

```sh
cd /Users/calebhamernick/Development/coach-house-platform-public-documentation-release-20260923
export PATH="/Users/calebhamernick/.nvm/versions/node/v22.13.0/bin:$PATH"
cat AGENTS.md
cat docs/RUNLOG.md
tail -80 docs/runlog/2026-09.md
git status --short --branch
git branch -vv
git worktree list
git fetch origin
gh pr view 247 --json state,headRefOid,mergeCommit,mergedAt,reviewDecision,statusCheckRollup,url
gh api repos/Hamernick/coach-house-lms/commits/main --jq '{sha,subject:.commit.message}'
```

Read `docs/agent/workflow-quality.md`, `docs/agent/ui-rubric.md`, and `docs/agent/graphify.md`; use the existing graph for scoped orientation. Read `docs/agent/open-work-index.md` if present. It was absent from this release branch; the root recovery index must not be copied into this release wholesale. Report branch, dirt, PR, and release status briefly before writes. The only expected new dirt from this planning session is this handoff and its monthly runlog entry; inspect any additional changes before editing.

If #247 has merged since this handoff, use a NEW isolated `fix/public-documentation-production-20260924` worktree from freshly fetched `origin/main`, port 3013, and create a follow-up PR for remaining defects. Verify which fixes are already in main before copying anything. Otherwise keep `feat/public-documentation-release-20260923`, port 3012. Never replay `67c7fa8d` again or merge preservation snapshot `3b91b2ad`. Leave root port 3000 and the AppShell/mobile, People, and Particles lanes alone.

## 2. Identify the actual production target before any deployment

1. In authenticated Vercel, inspect BOTH projects: `coach-house-platform` under `caleb-hamernicks-projects`, and `coachhouse` under `calebs-projects-58ab1538`.
2. Open each project's Settings → Domains. Find the exact owner of `coachhouse.app`; record project ID, team, Git repository, production branch, and assigned production deployment/commit. Inspect any domain redirect too.
3. Confirm the owning project builds this repository's root Next.js app from the intended production branch. Compare root/build settings with its last working deployment before changing anything.
4. Record the currently assigned deployment ID as the rollback target. Do not relink the root checkout, transfer the domain, modify DNS, copy secrets between projects, or promote an unrelated preview.
5. If authenticated Vercel access is unavailable, continue code/CI work. Report that production target verification remains blocked; request only the missing Vercel access or domain/project evidence when deployment is ready.

Read-only GitHub cross-check:

```sh
gh api 'repos/Hamernick/coach-house-lms/deployments?per_page=20' --jq '.[] | {id,sha,environment,created_at}'
gh api repos/Hamernick/coach-house-lms/deployments/6628935592/statuses --jq '.[0] | {state,environment_url}'
gh api repos/Hamernick/coach-house-lms/deployments/6625557969/statuses --jq '.[0] | {state,environment_url}'
```

## 3. Preserve the approved header; verify it before modifying it

The following already exist in `b85e3474`. A deployment issue does not require reimplementing them.

- Owner: `src/features/build-collect-navigation/components/build-collect-public-header.tsx`. Desktop NavigationMenu has `relative z-50`; navigation list is `rounded-full border p-1 shadow-none`; inner Collect/Build buttons are `h-8 rounded-full px-3`. Outer pill is approximately 42px with padding/border. **Do not shrink the whole pill to 32px again.**
- Desktop grid keeps Collect/Build centered in the top rail, using explicit navigation column 2/actions column 3. Login/Build CTA/theme controls are 32px and shadow-free. Mobile sidebar trigger retains its existing accessible size.
- Homepage header has a search icon instead of the header text input; clicking it focuses `[data-public-map-search-input]`. Preserve Documentation's own search and the Build landing search.
- Supporting files: `src/components/public/home-canvas-login-button.tsx` and `src/components/public/home-canvas-preview-shell.tsx` (locate their current paths with `rg --files` if moved).

Extend the existing menu hit-test journey in `tests/visual/build-collect-navigation.visual.spec.ts` to cover BOTH Collect and Build over `/` and `/documentation`. Move the pointer from trigger into menu, verify it stays open, use `elementFromPoint` in the menu/content overlap, then click a real link and verify its destination. Check keyboard opening, focus, and Escape. If a case fails, inspect ancestor stacking contexts/overflow and fix the narrow owner; increasing a child z-index cannot escape an ancestor underneath the canvas. Do not alter global Button/Input primitives or integrate the separate AppShell lane.

## 4. Close the four reported review defects

### 4a. Preserve failed reads

File: `src/features/nonprofit-documentation/hooks/use-documentation-draft-persistence.ts` and its callers.

- Replace the write permission implicit in `storageReady` with explicit read success/failure state. Rendering may become ready after a failed read; writing must remain blocked.
- A thrown `getItem`, JSON parse, or sanitizer must retain `storageStatus="unavailable"` and must not call `setItem`, including after later edits/renders. Preserve existing bytes exactly.
- Expose an explicit confirmed-reset/recovery path. Wire existing planner reset actions to that path; a plain `setDraft(default)` cannot unlock a failed read. Cancellation changes nothing. Retrying a read only unlocks writes after successful recovery. Reset failure stays unavailable.
- Keep controls and exports usable. Show a short actionable storage warning using existing planner UI; never report Saved while writes are blocked.
- Regression tests: malformed JSON; throwing read; throwing sanitizer; no write on mount/rerender/edit after failure; canceled reset retains bytes; confirmed successful reset permits saving; valid saved draft restores without a transient default overwrite.

### 4b. Guard unsaved drafts

- Track the serialized draft last successfully read/saved separately from current draft; derive dirty state. Storage being unavailable alone must not cause a warning before a user makes changes.
- Warn on reload/tab close with `beforeunload` while dirty and unsaved. Guard same-tab Documentation/header link navigation and browser Back/Forward when they would abandon the draft. In-planner step navigation that retains the draft should continue normally.
- Reuse the pattern in `src/components/organization/org-profile-card/hooks/use-org-profile-unsaved-guards.ts` where appropriate, but keep the implementation inside Documentation. Inspect its limitations: link interception alone does not cover programmatic navigation or browser history. Avoid globally monkey-patching Next's router/history.
- Use existing dialog primitives for app navigation: Stay/Leave. Stay preserves URL, editor, and draft; Leave performs the pending navigation once. Successfully saving or explicitly discarding removes the guard. Export alone must not falsely mark localStorage saved. Remove listeners on unmount; avoid duplicate history entries/dialogs under Strict Mode.
- Browser regression cases: inject throwing `localStorage.setItem`, edit, cancel a Documentation link, confirm leaving, reload warning, browser Back cancellation, successful save clears warning, same-planner step remains usable. Verify exported content still contains the unsaved edits.

### 4c. Sanitize Brand Identity field by field

File: `src/features/nonprofit-documentation/lib/brand-identity.ts`, `sanitizeBrandDraft`.

- Treat the parsed value as unknown. Reject null/arrays/non-record candidates. Remove both untrusted spreads (`...candidate`, `...saved`).
- Copy each supported scalar only after checking its type. Strings include organizationName, tagline, introduction, purpose, audience, logoGuidance, campaignHeadline, campaignBody, updatedAt. Preserve valid empty strings.
- Validate actionables as the existing fixed string tuple; retain font allowlists. Validate baseSize/typeRatio as finite numbers before applying existing ranges; malformed/nonfinite values use defaults.
- Rebuild colors against canonical IDs/roles. Ignore null/non-record/unknown entries; validate string name/value before `.trim()` or hex normalization; preserve legacy default-name migration. Validate proportion as finite/nonnegative. Never allow NaN into the draft.
- Tests: `{tagline:{}}`, `colors:[null,{id:"brand",name:{},value:[],proportion:"bad"}]`, malformed number fields, extra keys, valid current draft, valid legacy names. Rendering the tool with these stored inputs must not crash.

### 4d. Neutralize CSV formula prefixes consistently

Within `src/features/nonprofit-documentation/lib/`, inspect the `csvCell` helpers in campaign-plan, marketing-plan, framework-workspace, crm-plan, networking-plan, social-media-plan, compliance-rhythm, partnership-brief, hr-plan, fundraising-plan, legal-plan, and finance-plan. Recheck the inventory using `rg -n 'function csvCell|protectedValue' src/features/nonprofit-documentation/lib`.

Use the existing Marketplace convention: `/^[=+\-@\t\r]/` → prefix an apostrophe, then escape quotes and CSV-quote the cell. Preserve each export's delimiter, BOM, newline, and null handling. Do not trim input or rewrite unrelated exporters. Parameterized tests must cover `=`, `+`, `-`, `@`, tab + `=`, CR + `=`, benign strings, quotes, commas, and newlines through the affected public export functions.

Register any new acceptance test file with the existing acceptance manifest command. Avoid broad refactoring.

## 5. Repair the actual hosted browser failures

Authoritative run: [35945558430](https://github.com/Hamernick/coach-house-lms/actions/runs/35945558430); visual job `107462581070`.

```sh
gh run view 35945558430 --job 107462581070 --log-failed
gh run download 35945558430 -n visual-regression-failures-35945558430 -D /tmp/documentation-s02-ci-artifacts
```

| Failure                                                       | Required investigation/action                                                                                                                                                                              |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build mobile screenshot, navigation spec:91                   | Review expected/actual/diff against approved header sizing. Update only if intended.                                                                                                                       |
| Decision canvas spec:79                                       | `Open Message & content` never found after revision. Inspect actual canvas state/accessible names; restore the intended reopen/edit journey or correct a genuinely stale selector.                         |
| Compliance, planners spec:85                                  | `[data-canvas-editor]` absent after reload. Check persisted step and URL restoration; reload must retain usable plan/edit state.                                                                           |
| CRM, documentation spec:141                                   | `Start planning` never found after returning. Inspect persisted editor state; test should resume an existing plan if already open, not require its initial CTA. Preserve assertions proving edits survive. |
| Documentation mobile light + dark                             | Review intentional search/header/scroll layout changes, then update scoped baselines.                                                                                                                      |
| Documentation desktop                                         | Review home/article/other captured states; fix UI defects before accepting images.                                                                                                                         |
| Marketplace/completed plans desktop                           | Missing `documentation-marketplace-desktop-light.png` plus mismatches. Review the actual resource-only Marketplace, then create/update correct baselines.                                                  |
| Marketplace/completed plans mobile, documentation spec:21/602 | Ready helper cannot find `Open Find, Guides, and Saved`. Inspect the current mobile shell and use its real accessible ready target; verify navigation works, not merely that a selector exists.            |

These are nine failing tests, grouped above. They are NOT all screenshot failures. Do not delete/skip journeys, weaken assertions, increase timeouts, or accept broken UI just to pass.

Use Ubuntu 24.04 x64, Node 22, and locked Playwright 1.58.2 for canonical screenshots. Use an available Linux runner/container; if unavailable, stop baseline work and report that exact dependency. Do not update Linux baselines from macOS or disable the environment check.

On that runner, after `pnpm install --frozen-lockfile` and Chromium dependencies are available, use a free owned port:

```sh
PLAYWRIGHT_PORT=3013 pnpm exec playwright test --config=playwright.visual.config.ts tests/visual/build-collect-navigation.visual.spec.ts tests/visual/documentation-decision-canvas.visual.spec.ts tests/visual/documentation-planners.visual.spec.ts tests/visual/documentation.visual.spec.ts
```

After interaction fixes and image review, update only affected specs, for example:

```sh
PLAYWRIGHT_PORT=3013 pnpm test:visual:update tests/visual/build-collect-navigation.visual.spec.ts tests/visual/documentation.visual.spec.ts
```

Review every generated file; discard unintended baseline changes. Keep thresholds unchanged. Re-run those specs without update mode. Record intentional visual changes and reviewed images in the monthly log.

## 6. Complete checks, commit, and merge normally

1. Run focused acceptance tests for the new storage/sanitizer/CSV cases and browser checks above. Use existing acceptance project commands and the manifest; do not invent an isolated test configuration.
2. Run `graphify update .` after code changes; keep generated graph/cache artifacts out of Git. Update this handoff's completed sections and the current monthly log.
3. Run full `PLAYWRIGHT_PORT=3013 pnpm check:quality` on supported Linux for the final candidate, covering static guardrails, snapshots, acceptance, RLS, build, performance, and visual validation. Reuse valid passing results during iteration; don't repeatedly run the full gate before addressing known failures. Report credential-dependent skipped suites explicitly.
4. Review `git diff --check`, full file scope, and staged diff. Stage explicit intended paths, run the repository staged secret check, commit, and push the selected feature branch. No force push, generated build directories, temporary configs, or unrelated lane files.
5. Inspect `gh pr checks 247` and `gh pr view 247 --json headRefOid,reviewDecision,mergeStateStatus,statusCheckRollup` (use the new PR number if step 1 selected a follow-up). Required checks, including aggregate quality, must pass for the latest head.
6. Obtain required human/code-owner review through the normal PR process. Existing shipping authorization does not bypass branch protection. If review is the only remaining blocker, report that fact and the PR link; don't repeatedly rerun checks.
7. When checks and review are satisfied, merge using the repository's normal method. Never use `--admin`, disable checks, or push directly to protected main. Record merge SHA and verify the target commit is in remote main. If using `gh pr merge`, supply `--match-head-commit` with the reviewed head to avoid merging a changed candidate.

## 7. Deploy to the confirmed owner of coachhouse.app

1. Follow the merge-triggered production deployment in the project identified in step 2. Check repository, commit SHA, target=Production, and READY status. A preview URL or the other project's success does not satisfy this step.
2. If automatic deployment didn't trigger, deploy/redeploy the merged main commit in that SAME project using its existing production environment and settings. Verify source SHA before promotion. Do not promote the old `b85e3474` preview after review fixes changed the candidate.
3. Confirm `coachhouse.app` is assigned to the resulting deployment and record deployment ID + source SHA + domain. Retain the previous deployment ID for rollback.
4. Only if the correct SHA is assigned and stale behavior persists, inspect rewrites, middleware, route build output, redirects, and cache headers. Check the deployment URL and custom domain separately. Use a fresh browser session/cache-busting request diagnostically; do not start with DNS changes or blanket cache deletion.

## 8. Live acceptance and final report

Use a fresh anonymous browser with no visual-fixture header. Check desktop 1440px, mobile 390px, and light/dark modes. Verify:

- `/`, `/documentation`, `/documentation/quickstart`, `/documentation/search?q=finance`, `/documentation/marketplace`, `/documentation/tools/brand-identity`, and `/documentation/best-practices/frameworks` render the correct content; no 404/login gate. Sitemap includes public Documentation routes.
- Both Collect and Build menus stay above canvas/content, remain open while entering them, have clickable destinations, and support keyboard/Escape on home and Documentation.
- Centered padded pill, 32px Login/Build/theme, no control shadows, removed homepage header text input, functioning search icon, and no mobile overlap/overflow. Do not require desktop-only controls to appear on mobile.
- Documentation search, article contents/scrolling, planner editing/reload, and exports work. Check console for application errors. Corrupt/full-storage cases remain in isolated local/preview regression tests; don't alter a user's production drafts.

If the new deployment introduces a serious regression, roll the SAME project/domain back to the recorded prior working deployment, verify recovery, and report Documentation remains unshipped. Do not switch DNS/projects as rollback.

Final response: merged PR + merge SHA; production project/deployment ID; live URL; passed smoke checks; any remaining blocker. Say "live" only after the custom domain passes. Do not claim provider/database changes or unrelated lanes shipped.
