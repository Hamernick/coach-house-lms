# Internal projects/tasks coach feedback

Release worktree: `/Users/calebhamernick/Development/coach-house-platform-internal-tracker-release-20260928`
Release branch: `feat/internal-tracker-release-20260928`, fresh base `d7d1eec3`.
Preserved source: `feat/internal-projects-tasks-20260928` in its original worktree; localhost 3013 remains there. No source worktree or credentials were discarded.

## Final release status — September 28, 1:53 PM EDT

PR #261 is merged as `5f02a334`; all required hosted checks passed on the matching head tree. Its production deployment is Ready on coachhouse.app. Migration 20260928180000 is applied and its monthly-date constraint validated in the live catalog. Cross-scope proposal/collaborator visibility is deployed without mutation permission expansion. No imported data changed. This supersedes older pending review-fix checkpoints below.

Implementation, import and release work stop here. Remaining human review: Joel's task view and edit/save/reopen before the meeting. Caleb confirmed Google sign-in works on localhost:3000; 3012/3013 servers are stopped, original worktrees preserved. [Final operator evidence](../operations/tracker-import/README.md).

## Current production status — September 28, 1:25 PM EDT

PRs [#258](https://github.com/Hamernick/coach-house-lms/pull/258) and [#259](https://github.com/Hamernick/coach-house-lms/pull/259) were merged by Caleb. All required hosted checks passed on #259 head `6d86dfdc`, whose tree matches production merge `335b96dc`. Vercel deployment `dpl_9iDsMUMgCVZBTSRci6Rqf6kKmovU` is Ready and serves coachhouse.app. All three tracker migrations are applied.

The production batch completed at 1:21 PM EDT: **40 projects, 255 tasks, nine reference notes**, with all 348 source records reconciled. Existing manual records are unchanged. Joel has 82 imported assignments (49 open/33 done), four proposals and 34 collaborator appearances. Eight On Fire! priorities map to Urgent; raw labels remain preserved. A prior attempt rolled back atomically; no partial import remained. Zero import assignment notifications; one activity summary.

[Production walkthrough, hashes, controls and rollback](../operations/tracker-import/README.md). No new tracker tests were added. Implementation/import work is stopped. Remaining human review: Joel's signed-in view and edit/save/reopen. Deferred: Franklin account link, 11 held source records, active template/recurrence engines, proposal history. Earlier dated notes below are historical checkpoints, not current deployment status. Acme rename and separate Calendar provider/canary work remain outside this import.

## Tracker integration planning

Immediate delivery: Caleb now requires a production meeting release within three hours and no new tests. Follow the [three-hour production plan](2026-09-28-tracker-three-hour-production.md), targeting approximately 2:55 PM EDT September 28. Native business records and usable ownership/history come first; templates and recurrence are preserved visibly inactive. The implementation, release and production import are complete; see the authoritative production status above.

See [Joel tracker migration plan](2026-09-28-joel-tracker-migration.md). Caleb requested investigation/planning and confirmed preserving team ownership with Joel's own task view. Audited all 28 workbook sheets and the handoff script: 41 projects, 264 tasks, nine inbox records, four project templates/26 steps and four recurring rules. Thirty task records lie beyond row 1001; Archive duplicates the 51 completed master tasks. The plan covers missing assignment/proposal/collaborator, task-date, waiting, history, template and scheduled-recurrence support, identity/duplicate review, lossless provenance, reconciliation and rollback. Live identity/project comparison was read-only. Implementation now extends the existing task system. The source audit remains the baseline; later decisions and rehearsal evidence are recorded below.

## Implemented locally

- Project edit dialogs expose the existing authorized atomic delete action. Confirmation names the project and explains that its tasks, notes and file links are deleted; the organization and external files remain. Canonical organization records remain protected. Coach assignment scope is tested, including view-only unassigned access denial.
- Quick and guided creation offer monthly recurrence; quick editing can stop it. Assumed behavior, pending the user's answer: completing an occurrence creates next month's project with fresh tasks and copied assignees, overview and task workstreams. Completed history remains. Notes, activity and file links are not copied. Cancellation/deletion does not generate another project. Reopening/completing again cannot duplicate a successor, including after its deletion. Project and task dates retain their original monthly anchors through short months; copied tasks are bounded by the new project range and later task edits establish new anchors. Date changes reset the monthly anchor.
- The calendar opens on the saved month, labels use the viewer's locale with a named month, and date-only values retain their day across timezones. Invalid dates cannot silently roll into another month.
- Follow `docs/design.md`: existing monochrome surfaces, shared shadcn controls, a clearly named destructive action, concise feedback and existing layout.

## Review

Local sample preview: `http://localhost:3013/visual-regression/project-feedback`.
It uses real editor components with sample data and mocked mutations, not the live database. Localhost 3013 now also has private, ignored backend configuration so ordinary app authentication works; authenticated app actions target shared data, and the recurrence migration has now been applied with user authorization. Review the date picker, recurrence selector, and delete/cancel flow. The route uses the existing visual-regression access guard. No screenshot references changed; user appearance review is pending.

## Validation

- 75 focused acceptance tests pass across project actions, deletion, input, dates/ownership, guided creation and schedule transitions.
- `pnpm test:rls` exits successfully: all local PostgreSQL harnesses pass, including new recurrence checks for leap years, month-end anchors, completion via edit wrappers, stopping, rescheduling, deletion, rollback and cross-tenant denial. At that validation checkpoint, the credential-dependent live RLS suite explicitly skipped because this worktree had no environment credentials.
- Changed-file ESLint, structure, routes, boundaries, raw-button guard and diff hygiene pass.
- Focused browser check passes selected October 18 date/month, save/reopen with monthly recurrence, cancellation and deletion confirmation. A focused 390px check also confirms Delete Project and Save Changes remain within the viewport when recurrence help is visible. No live mutation occurred.
- Full `tsc --noEmit` remains blocked by 122 errors in 34 unchanged test files; no application-source or changed-file errors. A malformed generated development route declaration was preserved outside the worktree and regenerated before the final diagnostic.
- A task-specific January 30 → February 28 → March 30 regression failed before the final anchor fix and passed afterward; the complete recurrence SQL suite was rerun.
- Graphify built locally and refreshed with AST-only extraction.

## Migration and release

`supabase/migrations/20260928090000_recurring_projects.sql` was applied to the shared backend with user authorization on September 28, together with the two pending document-attribution and coach-visibility migrations. Follow-up dry run reports up to date; REST confirms recurrence columns and the two targeted coach flags. No app deployment, Git push, PR or merge has occurred. Migration changes reuse current project RLS and service-only RPC boundaries; generation is transactional and requires no scheduler or provider cost. Rollback steps are at the migration's end; generated historical projects remain.

Before release: appearance was approved; confirm recurrence behavior through authenticated persistence review, then pass current-head hosted quality and required review. Verify creation, completion/next occurrence and delete through the authenticated app after the migration. The sample preview is not end-to-end persistence proof.

## Organization cleanup inventory — read-only

63 live organization names inspected. Candidates:

| Organization | Evidence | Proposed next step |
| --- | --- | --- |
| Acme (`f0713a9c-88bc-4762-9cd1-79092ed6a17c`) | Private org/roadmap; one canonical org record, private `Program 1`, three coach assignments; zero tasks, memberships, document files, external documents, project assets/notes/overview documents or subscriptions in checked tables. | Asked whether to rename it `Coach House Demo`, retain its private program and assignments, and use it as the shared demo. No change without the answer. Confirm all intended coaches are assigned before calling it shared by everyone. |
| testing123 (`fe0fd7c3-c0fd-4c20-9e80-b14d68da5d0c`) | Private org/roadmap; one canonical org record, one active subscription; no programs/tasks/memberships/coaches/documents/assets/notes in checked tables. | Resolve account purpose and subscription before destructive cleanup; name alone does not prove it disposable. |

No organizations, projects, subscriptions or provider records were changed. No account identities or secrets printed. Preserve all other worktrees and the existing Calendar server on 3012.

## September 28 follow-up: authorized test cleanup

- Organizations now includes only canonical organization cards. Projects excludes those cards and keeps its existing starter/system filters.
- Removed the exact Test Member account, its organization/canonical card/stub subscription and related records; removed five standard test projects and four total test tasks. Private backups and applied cleanup SQL: `/Users/calebhamernick/.codex/backups/internal-project-cleanup-20260928/`. Six real projects remain; no real organization, paid subscription or Stripe record was deleted. Acme rename remains undecided.
- Default destructive remote RLS execution is now blocked unless an isolated target is explicitly selected with `SUPABASE_RLS_TEST_PROJECT_REF`; ordinary local app credentials do not authorize test seeding.
- 19 focused acceptance tests pass, changed-file lint and runner syntax pass. Cleanup is live; Organizations separation and RLS guard remain local pending the existing release gates.

## Task filter and spacing follow-up

Tasks now uses To do / In progress / Done filters, No priority, real task tags and corrected counts. Selected labels round-trip into the filter state; project filters retain project statuses. Flat task rows have a 4px inset from separators. 13 focused tests, changed-file lint and structure checks pass. Review on localhost:3013/tasks; browser access was declined, so visual/interactive verification is pending with Caleb.

## Optional project fields follow-up

Start/due dates are optional in quick creation, guided creation and schedule editing. Coach House Solutions Group is the default organization, with No organization available. Project tenant ownership stays protected in org_id; organization_unassigned controls the displayed assignment, preserving dependent task/document permissions. Moving existing projects between owning organizations remains unsupported and now reports that limitation explicitly.

Migration 20260928150000_optional_project_dates_and_assignment was applied and its live schema verified. 104 scoped acceptance tests, local PostgreSQL/RLS integration, changed-file lint and structure checks pass. Application UI is local on 3013; authenticated save/reopen review and hosted release gates remain. No new remote test records were created.

## Task assignment follow-up

Explicit task assignments now appear in staff /tasks even outside a coach's organization list, with task-status access only in that case. Broader task mutations enforce organization scope. New/reassigned tasks notify the assignee and the assigning platform staff member, as confirmed by Caleb; unchanged task saves do not resend notices. Visible pages refresh task/bell data every 30 seconds and on return to the tab.

Migration 20260928160000_task_assignment_notifications is applied and the enabled trigger was verified read-only. 33 scoped acceptance tests, local PostgreSQL/RLS, lint and structure pass. No live test tasks/notifications were created; manual assignment and bell review remain on 3013. No application deployment.

## Dashboard behavior audit

Checked the coach dashboard, recent activity, project/organization directories, task assignment and Calendar service paths. Fixed personal-task links opening inaccessible parent projects; canonical organization activity using project URLs; organization-level/deleted-project activity losing the displayed coach scope; dashboard View all links excluding permitted unassigned organizations; no-organization project labels; and organization query failures appearing as successful empty counts. Dashboard refresh now uses the shared visible/focus/30-second refresh hook.

Added a Manage control to the full Google Calendar card so connected users can reopen settings, manual sync and disconnect. This small Calendar component change belongs to this internal-tools worktree and must be reconciled with the separate Calendar release lane before shipping either overlapping change.

113 focused acceptance tests pass across dashboard rendering/loaders, directories/filters, assignments/actions, activity and Calendar service behavior. Changed-file lint, structure and diff hygiene pass. Typecheck has zero source or changed-test errors; 122 existing errors remain in 34 unrelated test files. Read-only live activity integrity query found no dangling project references; the new PostgREST project-kind join returns 200 with real events. No live records were written.

Local 3013 has none of the six required Calendar configuration values, so live OAuth/sync cannot work there yet. The separate Calendar release lane owns registered localhost:3012 configuration and outstanding provider/scheduler/canary gates. Automated Calendar tests are not live-sync proof. Browser access was previously declined; authenticated UI/save-reopen/bell review remains with Caleb. No deployment or migration in this audit. Visual change: the Calendar card gains an existing shadcn Manage button; no browser capture/baseline update attempted under the prior browser restriction.

## Immediate save feedback and visible updates

Project quick/guided creation, project details, inline/quick task editors, status changes, reordering and schedule edits now show a saving toast immediately and replace it with server-confirmed success or an error. Thrown/network errors resolve through the same feedback path; failed form saves keep the editor and input. Task submission is disabled while pending, and quick editors cannot be closed during submission.

Successful creates/edits update local project cards, project details/workstreams/timeline/progress, personal task rows and schedules without waiting for another route fetch. New projects prepend to the directory. Personal task projection removes tasks reassigned away from the viewer. Existing optimistic status/order changes roll back on failure, including thrown failures. A save event refreshes mounted activity/notification/dashboard subscribers immediately; in-flight activity reads queue a follow-up rather than losing the save event. Server actions also invalidate Projects and the admin dashboard where applicable.

Fixed task editing dropping the existing due date and background prop refreshes resetting an open task draft. Project detail refreshes no longer overwrite an active edit draft. No change to database authorization or provider configuration.

Validation: 108 distinct scoped tests pass (107 initial suite plus the added overlapping-activity-request regression; affected subset rerun passed 55). Includes delayed success versus premature success, returned/thrown failures, local project/task upserts, reassignment/removal, immutable group updates, preserved due dates, and synchronized project progress/timeline. Changed-file lint, structure and import boundaries pass. Typecheck remains at the documented 122 unrelated test errors with no source or new-test errors. Acceptance manifest refreshed for the new test and two earlier imports now classified as integration. Graphify AST refresh run. UI stays local on 3013; no live test writes, migration or deployment. Browser interaction/visual baselines remain unverified under the earlier access denial.

## Projects filter correction

/projects now passes its directory type through the filter UI, predicate and facet counts. Project statuses stay distinct: Backlog, Planned, Active, Completed and Cancelled. Priority, tags and members match actual project data. Removed the organization coach dropdown and Fiscal Sponsorship category from project filters; stale coach/visibility/fiscal URL selections no longer restrict that directory. Old Onboarding/Archived chips expand into their corresponding project statuses. Organizations retains its existing coach, fiscal and lifecycle semantics.

Removed the now-unused organization coach assignment fetch from the Projects route and the dashboard's inherited organization coach query on its Projects link. Authorization still comes from the existing scoped project loader. 58 focused tests and changed-file lint pass, including rendered project filter choices, exact status/facet matching, URL compatibility, combined member/tag/priority filtering, directory and coach dashboard regressions. No deployment, migration, live mutation or browser automation.

## Tracker implementation checkpoint — September 28, 12:43 EDT

- Candidate native import: 39 source projects + one Unsorted work project, 255 tasks, nine reference notes; every one of 348 source records has a disposition (294 native, 43 reference, 11 held).
- Caleb explicitly chose separate imported projects even when Joel has already created similar manual projects. No linking, merging or overwriting existing projects. Imported projects carry Tracker import.
- Estimates/planned weeks are plain text in task overviews. Proposal history is omitted from visible UI/overviews; original payloads remain private. Current pending proposals and collaborator relationships stay distinct from accepted assignments.
- Native task dates are optional; Waiting and project On hold round-trip. Existing controls support clearing dates and unassigning. No recurrence/template engine or proposal-history product was added.
- Offline workbook builder, explicit service-only transaction, guarded rollback and read-back reconciliation are documented in [operator runbook](../operations/tracker-import/README.md). Private immutable workbook/script/README copies and manifest are outside Git.
- Full local rehearsal: exact retry creates no duplicates; zero native task/assignment/reference mismatches; zero assignment notifications; one activity summary; authenticated roles cannot read held records or execute import; guarded rollback rejects edited content and removes only unchanged batch-created work.
- Existing focused checks: 75 initially passed, one existing expected column list needed the intentional On hold value; that existing assertion was updated, and the subsequent five-file set passes all 76 checks. No new tests added for tracker work; earlier internal-tools tests are retained.
- Existing local PostgreSQL/RLS suite passes; destructive remote tests correctly skipped against shared backend. Structure passes. Source type diagnostics are being finalized; prior unrelated test-only diagnostics remain.
- GitHub main still d7d1eec3. Git-linked production deployments exist. Direct Vercel API credentials return 403; deployment verification remains required. User will approve/merge when current-head quality is green.
- Strict checkpoints remain 13:00 freeze, 13:25 PR, 13:55 approval/merge, 14:15 production compatibility, 14:35 reconciliation, 14:50 stop changes. No production import or tracker migration has run.

### Release candidate checkpoint — 12:47 EDT

Scope frozen early. Ported the coherent internal-tools/tracker patch to a clean current-main worktree; the two unrelated restored migration-history copies remain only in the source worktree. No secrets, workbook or private payloads copied into Git. Changed-file lint, structure, route/boundary/raw-button checks and existing local RLS pass. PostgREST JSON relationship-filter syntax verified by a read-only request. Graphify AST updated in the source worktree. Hosted quality/review and deployed/imported state remain pending.

## Automated review corrections — September 28, 1:40 PM EDT

Confirmed both review findings against merged code. Monthly recurrence now requires both valid dates through quick creation, guided setup, project updates (including omitted recurrence) and schedule edits. Additive migration `20260928180000_require_monthly_project_dates.sql` protects every database write. Ordinary projects remain undated when desired. Existing optional-date SQL coverage previously explicitly permitted undated recurrence; corrected that existing expectation to ordinary non-recurring work, while preserving dated recurrence checks. No new tests added.

Cross-organization pending proposals/collaborations now survive the initial personal-task filter. The existing final personal-scope check still rejects completed/stale proposals or proposals assigned to someone else; unrelated work remains excluded. Existing `canUpdate` and server mutation authorization remain unchanged, so metadata visibility does not grant edit or parent-project access.

Validation: 85 existing application checks pass, lint/structure pass, existing local PostgreSQL recurrence/RLS harness and full import/rollback rehearsal pass. Local SQL probes reject each missing monthly date on creation and edits. Production read-only preflight found zero monthly projects; no production data changes or migration applied for this correction. Await hosted quality and Caleb merge before applying/deploying.

PR #260 aggregate quality passed after Caleb's merge. Consolidated local server runs merged code plus this review branch on localhost:3000. Caleb confirmed Google sign-in succeeds there. The separate local-runtime branch preserves its setup log; original 3012/3013 worktrees remain intact.
