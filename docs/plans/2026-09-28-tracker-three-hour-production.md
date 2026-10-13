# Tracker migration: three-hour production delivery

Status: execution plan, not implemented or imported.
Planning checkpoint: September 28, 2026, approximately 11:55 AM EDT.
Meeting target: approximately **2:55 PM EDT today**, three hours from Caleb's request. Time spent planning counts toward this window; implementation does not restart the clock.

This plan supersedes the 5–8-day delivery sequence in [the source audit](2026-09-28-joel-tracker-migration.md) for the meeting release. That estimate covered full workflow/automation parity. The source inventory and preservation findings remain valid.

## Meeting outcome

Joel opens **coachhouse.app**, signs into his existing account, sees his imported projects/tasks in the real Projects and Tasks pages, filters by work area, opens original notes, distinguishes owned work from proposals/collaboration, finds completed history, and edits/saves real work. Other coaches retain their ownership. The records persist after refresh and sign-in; this is not a sample preview or spreadsheet replica.

All **348 master source records** are accounted for. Templates, recurrence definitions and ambiguous/personal/test records may be preserved inactive rather than presented as active work. The final report gives exact counts by disposition. “Preserved” never means “automatically functioning.”

**No new automated tests, test files, fixtures, testing framework or browser suite.** Preserve tests already written earlier in this workstream. Run relevant existing checks and the repository's existing required CI. Use import reconciliation queries and focused human review for this migration's new behavior. This reduces regression coverage for new behavior; keep the implementation small and explicitly review the critical paths. Do not weaken assertions, delete existing coverage or bypass branch protection to meet the clock.

## Scope contract

| Capability | Required for the meeting | Deferred |
| --- | --- | --- |
| Projects and tasks | Real native records, correct parent relationships, notes/outcomes, priorities and dates | Broad tracker redesign |
| Team ownership | Existing accepted owners preserved; project ownership visible; unresolved identities labeled | New account provisioning or access changes without a resolved mapping |
| Collaborators | Names retained and visible; Joel can find work he collaborates on | New collaborator permission system, broad multi-owner editor |
| Proposed assignments | Separate visible Proposed to me list/filter; never silently accepted | Full accept/decline/reassignment negotiation workflow |
| Seven work areas | Consistent labels in Projects/Tasks using current tags/workstreams | Separate category-management product or wholesale tag redesign |
| Missing dates | Nullable task start/due dates end-to-end; no invented deadlines | Scheduling optimizer |
| Waiting / On Hold | Accurate displayed states, filtering and persistence | Dependency-driven automatic state transitions |
| Completion/history | Existing Done/Completed views plus original completion information | Independent archive lifecycle, retention tooling |
| Estimates / Planned Week / source context | Visible imported detail and lossless source metadata | New workload dashboards and planning engine |
| Inbox | Nine captures visible for review without becoming accepted assignments | AI triage, voice capture or mobile web-app recreation |
| Templates | All four definitions and 26 steps readable in the existing app's project notes/reference area | Save-as-template builder and automatic instantiation |
| Recurrence | Four exact rule definitions visible and explicitly inactive | New daily/weekly scheduler, missed-run handling, annual/board scheduling |
| Calendar | Existing calendar integration stays intact | Task-calendar bridge; source has no scheduled-event records |

Existing monthly-on-completion project recurrence remains available, but is not used as a substitute for these daily/weekly/calendar-based rules. Do not enable it on imports based on names such as “Finances.”

## Current release facts

- Active source branch: `feat/internal-projects-tasks-20260928`, worktree `/Users/calebhamernick/Development/coach-house-platform-internal-projects-tasks-20260928`.
- 114 pre-existing modified/untracked paths at the planning checkpoint, including the earlier internal-tooling fixes and audit. Preserve them. No PR currently exists for this branch.
- Read-only GitHub check: main is `d7d1eec3b4cc2c0fa0178252e690038f95d4710a`, matching this lane's base. Recheck before constructing the release candidate.
- Current branch protection requires **quality** and **one approving code-owner review**, with stale approvals dismissed after new pushes. Arrange the reviewer at the start, not at deployment time. No administrator bypass.
- CI is `.github/workflows/ci.yml`: static, acceptance, RLS, build and visual jobs feed aggregate quality. Two recent successful runs took about 8 and 12 minutes; reserve at least 25–35 minutes for queueing and a correction. These durations do not guarantee the next run.
- The active worktree has no `.vercel/project.json`; verify the actual Git-linked production project/team, deployment permissions and main-to-production behavior early. Do not create/relink a hosting project to work around missing access.
- Current internal-tooling migrations were already applied earlier. Compare local/remote migration history and apply only the new additive migration after a reviewed dry run; do not blindly replay the directory.
- Some existing local UI changes lack final authenticated review/visual references. That is a release risk to surface immediately, not a reason to disable visual CI. Existing production/main CI passed, but this dirty patch has not passed hosted CI.

## Clock and exit criteria

Use the original deadline even if execution starts late. The relative windows below include planning and assume no major hosted failure. Report slippage immediately and cut deferred work first.

| Elapsed | Target clock | Work | Exit criterion |
| --- | --- | --- | --- |
| 0–15 min | 11:55–12:10 | Freeze scope, source manifest, accounts, reviewer/hosting preflight | Frozen input, explicit mappings/holds, confirmed release path |
| 15–65 min | 12:10–1:00 | Minimal native model/UI and import support | Core import can render/edit without fake dates or assignment changes |
| 65–90 min | 1:00–1:25 | Transactional import rehearsal, existing focused checks, user review | Reconciled dry run; reviewable release patch; first complete PR revision |
| 90–120 min | 1:25–1:55 | Hosted CI/review while independently preparing final manifest and rollback | Current revision quality green and code-owner approval |
| 120–140 min | 1:55–2:15 | Additive migration and production app deployment | Correct commit is Ready on coachhouse.app and compatible schema verified |
| 140–160 min | 2:15–2:35 | Approved production import, reconciliation | Atomic import committed; every source record accounted for |
| 160–175 min | 2:35–2:50 | Joel/account review and meeting walkthrough | Real production save/reopen and ownership/history checks pass |
| 175–180 min | 2:50–2:55 | Buffer and handoff | Exact live URLs, counts, limits and recovery details ready |

One implementation agent remains responsible for this lane; no delegation is assumed. Independent tool calls and hosted CI can overlap. Do not schedule source edits, schema deployment and live import concurrently.

## Package A: source manifest and decisions

1. Reuse the completed audit. Do not spend the window rediscovering the 28-sheet inventory or reviewing Apps Script navigation again.
2. Make a private, timestamped copy of the workbook and two handoff files outside Git. Verify their hashes against the source audit. Retain immutable raw extraction with cell coordinates, types, formulas/cached values and original text.
3. Extract all populated master rows, not fixed spreadsheet ranges. Count 41 projects, 264 tasks, nine captures, four templates, 26 template steps and four recurrence definitions. Include the 30 tasks below row 1001. Archive contributes zero additional tasks.
4. Build a deterministic manifest with stable source namespace/entity IDs, destination IDs, mapped organization/user IDs and one disposition per source record. Missing inbox IDs receive stable keys tied to this frozen export and original row, plus content hashes.
5. Snapshot current destination records and compare against the export again just before execution. Enumerate all pages; a 1,000-row REST limit is not proof of completeness.
6. Produce a concise review list for personal/test records, uncertain project associations and existing project collisions. Do not ask open-ended questions where a concrete proposed mapping is possible.

Defaults that allow progress:

- Internal business work belongs to Coach House Solutions Group, `c5405481-cea7-418a-b0c3-531ec942c047`. Project names never become Organizations entries.
- Joel → existing `joel@coachhousesolutions.org`; Paula → `paula@coachhousesolutions.org`; Karissa → tracker-mapped `fs@coachhousesolutions.org`.
- Caleb → proposed existing developer account `caleb@bandto.com`, rather than creating another account for the spreadsheet email. Include this explicitly in the manifest for Caleb to confirm.
- Franklin → preserve the name and unresolved source identity. If his real account is not resolved by the first checkpoint, keep his work visible to authorized staff with “Account not linked”; do not give it to Joel, fabricate a user, or lose it. His personal task delivery remains a reported limitation until linked.
- Exact Revenue Pipeline overlap → compare content, owner and organization; link only if the review confirms the same project. “Finance” versus “Finances” and the existing platform tracker versus “Project Management Tool” are candidates, not automatic merges. Unresolved collisions remain held and accounted for rather than creating confusing duplicate active projects.
- Twenty-three tasks without projects → a real Coach House **General work** project for business items, preserving the original blank association. PR Campaign's unmatched association remains an explicit review item. No project title or task content authorizes cross-tenant moves.
- Personal/test candidates → restricted held records, excluded from shared active lists. Hold dependent records with their held project. Do not keyword-delete legitimate QA work.
- Do not wait for timezone/board dates to start the data import implementation. Preserve raw timestamp values and date-only completion information; leave unknown UTC timestamps unresolved and all new schedules inactive.

These defaults preserve uncertainty without blocking unrelated records. Final activation must identify the held records; no silent omission.

## Package B: minimal schema and data contracts

Work inside existing `member-workspace` owners. Add a small import feature only if needed for boundaries; if scaffolded, do not add generated test files. No new top-level tracker application or custom framework.

### Native fields and compatibility

- Make task `start_date` and `end_date` independently nullable, matching the existing optional project dates. Maintain ordering validation when both exist. Update action signatures/RPCs, TypeScript schema, serializers, date controls, sorting, timeline projection, save-state helpers and guided-task creation. A visual blank cannot round-trip into today's date.
- Add native task `waiting` and project `on-hold` where the actual canonical model supports them consistently: database checks, transition validation, shared status types, filter choices/counts, list/board grouping and task completion toggles. Search all consumers; no unchecked cast hiding unsupported states. Waiting remains incomplete; On Hold remains a project state, not Cancelled.
- Reuse project tags/type labels and task workstream/category representation for the seven work areas. Preserve original labels and use one normalization map in both directories. Task/project filters must operate on the same normalized values.
- Reuse existing project member labels and guided ownership support where valid. `guided_setup.ownerId/contributorIds` and its loader already support UUID membership for guided projects; do not build a new project membership subsystem merely to import existing owner information. Do not construct an invalid partial guided-setup payload or have quick edits erase it. Store an imported owner distinction separately if the existing contract cannot represent it safely.

### Limited imported metadata

Add a validated, versioned `tracker_metadata` JSON object on projects/tasks for the fields not needed as new core columns today. Separate immutable source facts from live application state:

- Source namespace/ID and import-batch reference.
- Original owner/collaborator/proposed-owner labels and resolved UUIDs where known.
- Legacy assignment status, proposer, proposal/acceptance dates and notes.
- Original estimated minutes, planned week, waiting details, completion date/raw timestamp, source fields and last-activity value.
- Unresolved identity/association markers and original blank values.

Current assignee rows and native task status remain authoritative after a user edits the imported task. Do not keep showing a source proposal as pending once it has been directly assigned in the app; do not overwrite the historical source snapshot when resolving it. Normal editor saves preserve import metadata rather than replacing it with an empty object. Validate metadata on the server; its contents must never grant access by themselves.

### Import ledger

Use an RLS-protected batch/record ledger (or equivalently scoped existing infrastructure if present). Minimal fields: batch ID/status, source namespace/hash, entity type/stable source ID, source row, payload/hash, destination table/ID, disposition/reason, mapping version and pre-import version/before-image for touched existing records. Enforce uniqueness of source identity independently of file hash so a new export cannot duplicate an old import.

Raw/held records are service-only by default. Any source-detail read passes the existing authenticated server authorization and returns only approved record details. Private/personal holds are not exposed merely because someone is a platform coach. RLS must be enabled from table creation, not added after import.

Migrations must be additive and backward compatible until the new app deploys. Do not insert new statuses or NULL task dates into production while the old app is still serving. Keep the previous app rollback target compatible with imported data or roll the batch back before reverting application code.

## Package C: smallest usable product integration

1. **Projects:** actual imported projects use existing cards/list/detail pages. Show owner/contributors, work-area tag, status and overview. Preserve the original Notes and Definition of Done as distinct overview sections. Imported templates are not active projects.
2. **Tasks:** default remains genuinely owned work. Add narrowly scoped Owned / Proposed to me / Collaborating filters using current filter primitives, with correct combinations and counts. Completed proposals are history, not actionable requests. Source proposal review may be read-only for this release; do not claim accept/decline was rebuilt.
3. **Imported details:** one compact section in the existing task editor/detail surface displays original collaborators, estimate, planned week, waiting context, completion and source information. Use the existing note/description area where adequate; do not redesign the editor.
4. **Completed history:** use the existing Done filter and project Completed view. Preserve original completed dates, show them in imported details, and keep records searchable/reopenable. No separate archive table, duplicate archive rows or new retention subsystem today.
5. **Inbox/reference:** put the nine captures, four complete templates and four recurrence definitions in clearly labeled existing project notes/reference surfaces under Coach House's appropriate project/organization workspace. Retain all 26 template steps, offsets and 16 dependency references in structured ledger data and readable content. Label them “Needs review” or “Automation not enabled”; no duplicate active tasks. Avoid placing personal held captures in a team-readable reference note.
6. **Feedback:** reuse `withSaveFeedback` and existing confirmed local state. Open/edit/save/reopen must preserve metadata and dates. No new toast or state-management architecture.

Access details that cannot be skipped:

- Do not insert collaborators into the existing assignee table indiscriminately: the current loader picks a first assignee and cannot distinguish roles. Keep accepted owner rows authoritative; use metadata-backed collaborator visibility in authorized internal scope.
- Proposed task loading must include the proposed recipient's records intentionally, without accepting the assignment or expanding unrelated organization access. Scope before pagination and enforce the same rule in detail actions.
- Exclude imported unassigned/proposed tasks from the current created_by fallback that would otherwise put the entire batch in the importer's My Tasks. Preserve ordinary creator-owned behavior for nonimported tasks.
- Joel is already assigned to Coach House. No new organization access is needed for his internal imported work. Franklin's unresolved account must not widen permissions for anyone else.

## Package D: importer, idempotency and rehearsal

Create a deterministic offline parser/manifest builder and one narrowly scoped, service-only database apply operation. Keep workbook/raw payloads outside Git. Do not make an upload/import admin product for this one migration.

Apply behavior:

1. Verify source hashes, manifest checksum, actor, target tenant and expected destination versions.
2. Acquire a batch/advisory lock; fail closed on a concurrent import or source-key conflict.
3. Stage all raw/source dispositions in the private ledger. Every source record remains recoverable even if held.
4. Within one database transaction, create/link approved projects, overviews and tasks; assign accepted owners; add safe metadata/reference records; recompute affected task counts and progress. Store deterministic destination IDs from the manifest.
5. Do not set source-person text as the authenticated actor or fabricate historical app events. Keep import time separate from source timestamps. Numeric Source Reference values remain original text, not silently converted dates.
6. Record the batch outcome and reconciliation manifest in the same transaction. Abort on missing references, missing required mappings, unexpected record versions or mismatched approved counts.
7. A repeat with the same source/disposition is a no-op. A different source payload for an existing source ID returns a conflict for review; it does not overwrite subsequent user changes.

Notification/activity behavior:

- Existing assignment triggers would create fresh notifications for imported accepted owners. Add an explicit service-only import path with suppression scoped to that transaction/batch. Validate that the batch is authorized; an authenticated client cannot suppress notifications through arbitrary metadata.
- Do not disable global triggers, alter unrelated notifications or fake `created_source=system` to hide imports from notifications (the app may hide those records).
- Suppress per-record “new work” activity where applicable and retain one accurate import audit entry/count, without pretending source history happened today. Normal future task assignments still notify the assignee and assigning admin.
- No email, Calendar writes, AI/model calls, paid external services, account creation or scheduler changes are needed for this release. Scope is the approved Coach House batch; existing-provider database/deployment usage only, with no newly provisioned paid resource.

Rehearsal is a real dry run, not a new test suite: load current schema in an isolated database, apply the candidate migration, execute the manifest, read back counts and representative fields, repeat it to confirm zero duplicates, force an invalid mapping to verify transactional abort, and exercise the batch rollback. Do not generate fixture records in the shared backend. These checks observe actual importer behavior and leave no new automated tests in the repository.

## Package E: release construction and verification

Preserve the working source branch. Create an isolated release checkout from refreshed `origin/main`; bring forward only the coherent internal-tooling prerequisite patch and tracker changes. Include the earlier regression tests already authored, but no new tests. Exclude raw files, local credentials, temporary audit scripts and unrelated Calendar changes. Do not bulk-copy the dirty checkout or push the root preservation branch.

Essential earlier prerequisites include project/task directory separation, task assignment visibility, optional project fields, real project filters, Google avatar support where used, and save feedback/local updates. Review dependencies so excluding an adjacent change does not break these. Record the exact imported-file list and diff against main.

Local verification budget:

- Existing focused project/task input/action/loader/filter/save-feedback suites, selected once for the final local patch.
- Changed-file lint, structure/boundary/manifest checks, migration syntax and production build where needed to identify a concrete failure.
- Scoped database integrity/authorization queries: Joel's visibility, unrelated client's denial, restricted source holds, proposal distinction and notification suppression. Service-role reads alone do not establish RLS.
- Human review of the relevant pages and new status/date/detail states. Browser automation was declined earlier; do not route around that denial. Caleb or Joel can perform the listed checks. If they explicitly authorize browser access later, use only the targeted journey.
- Existing visual baselines may require maintenance after reviewed intentional visual changes; do not add new visual cases or mass-accept failures. Complete required hosted visual checks.

Open the PR at the 90-minute checkpoint with the complete revision. CI and code review run while preparing final import/rollback materials. Avoid incidental pushes during CI: every new revision invalidates previous required evidence and may dismiss review approval. Fix only actual release failures; do not weaken gates or chase unrelated features.

Release order:

1. Obtain current-revision `quality` and required code-owner approval.
2. Verify only the intended additive migration is pending; apply and inspect it. No operational import yet.
3. Merge through normal protection, confirm the deployment commit and production team/project, wait for Ready, inspect logs/routes.
4. Confirm the real app supports blank dates/new statuses/imported metadata before the live batch.
5. Present the exact approved create/link/hold counts, source hash, no-notification/no-provider scope and rollback. Honor existing action authorization; if a remaining action requires confirmation, ask only after this concrete manifest is ready.
6. Execute the production transaction, reconcile, then perform the production walkthrough. A deployment URL or merged PR alone is not completion.

## Package F: reconciliation and meeting walkthrough

Source control totals before any reviewed exceptions:

- 41 projects, including two Complete and one On Hold.
- 264 tasks: 175 Not Started, 32 In Progress, six Waiting, 51 Complete.
- 99 Accepted, 164 Proposed and one blank assignment state; 11 proposals already Complete.
- Joel: 19 source-owned projects; 88 owned tasks, 52 incomplete/36 complete; four pending proposals; 36 collaborator appearances (overlapping sets).
- Nine inbox captures, four project templates, 26 template steps/16 explicit dependency references, four recurring rules.
- 30 master tasks below row 1001 included; no additional Archive import.

Report separately: created native records, linked existing records, readable inactive references, restricted holds and unresolved mappings. These dispositions must sum to the source totals. Do not quote the raw 52 Joel-open count as the final visible count if reviewed personal/test holds or duplicates change it; show the reconciliation.

Read-back checks:

- Source ID → correct native ID/project/organization, exact notes, people, priority and dates for every approved row; any transform recorded explicitly.
- Missing dates remain missing; completed history stays complete; all Waiting/On Hold records remain distinguishable.
- User edits survive refresh and do not erase metadata or source provenance. Project cards/counts/task progress agree with the imported tasks.
- No inappropriate notification burst, no fake new organizations, no customer exposure, no unintended updates to pre-existing projects.

Meeting sequence (5–7 minutes):

1. Open `https://coachhouse.app/projects` and show Joel-owned projects/work-area filters.
2. Open a real imported project; show its original outcome/notes and tasks.
3. Open `https://coachhouse.app/tasks` as Joel; show owned work, four source pending proposals where still eligible, collaborators and Waiting.
4. Show a task with no due date and one with original supporting details.
5. Make one small approved edit to a real task, see success feedback, refresh and reopen. Record the edit or restore it if it was only for demonstration.
6. Filter Done and open historical work.
7. Show templates/recurrence reference material labeled inactive, then the concise reconciliation and remaining holds.

Prepare exact project/detail links after real IDs exist; do not invent IDs or substitute a local preview in the final meeting handoff.

## Stop conditions and rollback

- By minute 15: if hosting or the required reviewer is unavailable, tell Caleb immediately; continue local work but do not promise production.
- By minute 65: if native blank dates/status/ownership are not reliable, stop optional polish and reference formatting. Do not replace missing dates with today or flatten proposed assignments merely to show rows.
- By minute 90: freeze meeting scope; no new recurrence engine, template builder, private-task product or general category manager. Push the coherent candidate, not an incomplete UI patch.
- By minute 120: if required checks/review are not satisfied, report production at risk and work the concrete failure. No bypass; a preview is explicitly a preview.
- If all approved business records cannot be activated safely, keep the incomplete batch held. A specifically reviewed partial batch may be activated only with exact excluded counts and a truthful meeting description; do not silently shrink the agreed scope.
- Any source mismatch, destination conflict, identity ambiguity affecting an assignment, unauthorized visibility or reconciliation failure aborts the affected transaction. Never continue by skipping errors.
- Roll back only batch-created records with matching import versions. Do not delete existing linked projects. Restore approved changes to existing records from before-images only if unchanged since import. Preserve modified records and report conflicts for manual recovery.
- If a production schema/application issue occurs after import, pause access to the affected imported surface and choose a schema-compatible fix or guarded batch rollback before reverting to an app that cannot handle new statuses/NULL dates. A feature flag alone does not make incompatible database records safe.
- Keep the original workbook and old workflow available through the meeting. Disabling old triggers/data entry is a separate explicit cutover action after the live import is verified; no accidental double-running of recurrence because new schedules remain off.

## Definition of done for this deadline

The production commit and Ready deployment are recorded; Joel can use the imported native work in his actual account; accepted ownership is preserved across the team; all approved data reconciles; all source records have a durable documented disposition; edit/save/reopen succeeds; completed history is accessible; no notification/access regression is observed; deferred automations and unresolved accounts/holds are named precisely.

The deadline does **not** require claiming template creation, assignment negotiation, personal-task privacy, dependency automation, new calendar scheduling or daily recurrence is finished. Those remain subsequent work. If any required production gate blocks delivery, say so before the meeting rather than presenting a local or partially imported system as complete.

## Enforced release checkpoints (12:26 EDT update)

User requires strict stopping points; do not extend scope or run open-ended checks.

| Deadline (EDT) | Required exit | If missed |
| --- | --- | --- |
| 13:00 | Core implementation freeze: nullable dates, statuses, ownership and metadata, importer | Report exact blocker; stop optional UI and formatting |
| 13:25 | Rehearsed manifest, focused checks, reviewable PR | Report delay immediately; no unrelated work |
| 13:55 | Current-head required quality green and user approval/merge | Explain production risk; no protection bypass |
| 14:15 | Compatible production deployment and migrations verified | Hold import until compatibility established |
| 14:35 | Import transaction and every source disposition reconciled | Abort/hold inconsistent batch; report exact counts |
| 14:50 | Stop changes; deliver demo links, evidence and limitations | No last-minute scope additions |

Only repeat a check for changed code, a failure, or an unresolved material concern. No new tests; retain and run appropriate existing checks. User performs GitHub approval/merge.

## Approved scope adjustments and local evidence — 12:43 EDT

Caleb chose to preserve manual projects and create separate imported duplicates, labeled Tracker import. Do not link Finance/Finances or Revenue Pipeline. Proposal history is omitted from visible UI; estimates and planned weeks are plain text in task overviews. Current pending assignments are not silently accepted. Original source payloads remain in the private ledger.

The native/references/hold mapping, immutable manifest hash, exact counts, executable importer and guarded rollback are now documented in [the operator runbook](../operations/tracker-import/README.md). Local PostgreSQL rehearsal succeeds for full import, identical retry, native read-back, notification suppression, private-ledger permissions and guarded rollback. No production tracker migration/import has run.
