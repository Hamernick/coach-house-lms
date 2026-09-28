# Joel's tracker: integration and migration plan

Status: investigation complete; implementation and import not started.
Delivery update: Caleb requires a production meeting release within three hours and no new tests. Follow [the three-hour production plan](2026-09-28-tracker-three-hour-production.md) for immediate scope, timing and release gates. This audit remains the source inventory and longer-term parity reference.
Date: September 28, 2026.
Worktree: `/Users/calebhamernick/Development/coach-house-platform-internal-projects-tasks-20260928`
Branch: `feat/internal-projects-tasks-20260928` (existing local changes preserved).

## Recommendation

Integrate the tracker's records and useful business concepts into the existing Projects and Tasks features. Keep the existing application navigation and editors. Caleb confirmed: **preserve team ownership and give Joel his own filtered task view**. This is a team migration, not a bulk reassignment to Joel.

Use two delivery milestones: first preserve and import the records with usable ownership, statuses, categories, history and inbox review; then activate reusable templates and scheduled recurrence. Preserve every template and recurrence rule in the first milestone, visibly marked inactive until supported and reviewed. Do not declare the spreadsheet fully replaced while those automations remain inactive.

Difficulty: medium. Data volume is small; the work is preserving meaning and closing application gaps. The initial 5–8-day estimate covered full workflow and automation parity. It is superseded for the immediate release by the linked three-hour plan, which defers automation and uses existing UI/data conventions. Full-parity work remains subsequent scope.

Alternatives considered:

- Copy titles into today's task model: quickest, but loses assignment acceptance, collaborators, missing dates, planning and history. Not recommended.
- Extend the current system and migrate in stages: recommended; preserves data immediately and activates behavior deliberately.
- Rebuild the spreadsheet application: unnecessary duplication of menus, forms, dashboards and scripts.

## Evidence and inventory

Inspected all 28 worksheets, including hidden Team View, populated cells, formulas/cached values, comments, settings, and both handoff files. Read the Apps Script as reference; did not execute it. Queried current application records read-only for identity and duplicate candidates. No workbook, application code, database, permissions or provider configuration changed during this investigation.

Sources:

- `/Users/calebhamernick/Downloads/Coach House Task System GS.xlsx`
- `/Users/calebhamernick/Downloads/Coach_House_Tracker_Caleb_Handoff/README.md`
- `/Users/calebhamernick/Downloads/Coach_House_Tracker_Caleb_Handoff/Code.gs`

| Master sheet | Records | Treatment |
| --- | ---: | --- |
| Projects | 41 | Preserve project identity, ownership, outcomes, notes and dates; review overlaps before creating |
| Tasks | 264 | 213 incomplete, 51 complete; import each source ID once |
| Work Inbox | 9 | Preserve captured text and proposed owner; review before converting to active work |
| Project Templates | 4 | Fiscal sponsorship onboarding, monthly finance, annual compliance, quarterly board preparation |
| Template Tasks | 26 | Preserve order, default people, estimates, offsets and 16 dependency references |
| Recurring Tasks | 4 | Two daily, one weekly, one monthly rule |
| Discussion Queue | 0 | No historical records to migrate |
| Archive | 51 displayed tasks | Exact same IDs as the 51 completed master tasks; do not import again |

There are **348 master records** across the six nonempty data tables, before any mapping to existing app records or holding exceptions. This is a reconciliation total, not a promise to create 348 new database rows. No duplicate task IDs, project IDs or project names were found within their master tables. Two different task IDs share the title “Reconcile Bank Account”; title equality is not enough to merge tasks.

Task statuses: 175 Not Started, 32 In Progress, 6 Waiting, 51 Complete. Assignment state is separate: 99 Accepted, 164 Proposed, 1 blank. Eleven proposed tasks are already complete; preserve their history without reopening them or sending acceptance requests. The other 153 proposed tasks remain incomplete.

Joel owns 19 projects and 88 tasks: 52 incomplete and 36 complete. He has four currently proposed tasks and appears as a collaborator on 36 tasks; these sets overlap and must not be added together. The 66 rows naming him as Proposed Owner include accepted/history rows, not 66 pending requests.

## Findings that change the migration approach

1. **Thirty tasks occupy rows 1002–1031**, after a gap following row 236. Some view formulas stop at row 500, 1001 or 1005. Extract every populated master row by its ID, never a fixed range or a displayed task view.
2. Cached Dashboard values show 46 incomplete tasks and 151 proposals, versus 213 and 164 in the master records. Several exported formulas contain `#REF!` results. These may combine source/view defects and Excel export limitations; neither dashboard totals nor recalculating the export establishes the authoritative inventory.
3. Task dates are often absent: 164 missing starts, 180 missing deadlines, and 154 missing both. Existing optional **project** dates do not solve required **task** dates. Never invent today as their schedule.
4. Twenty-three tasks have no project. Another references “PR Campaign,” which has no project master record. Preserve these associations as unresolved rather than creating organizations from project names.
5. Nine inbox captures have no Intake ID. Assign deterministic import identifiers from the frozen source snapshot/sheet/row and retain content hashes. Later exports with moved rows require reconciliation, not blind insertion.
6. “Unassigned Test,” “test an email,” “Example Development Project,” and a project whose notes say “this is a test” are review candidates. Personal-looking tasks also exist. Hold these out of active shared views pending classification; do not delete them. A real task such as “Test every link, form, payment path, and inquiry route” is not a fixture merely because it contains “test.” Hold dependent tasks when holding a project.
7. TASK-206 has accepted owner Paula but historical proposed owner Joel: accepted owner wins, history remains. TASK-NEW has owner Paula but blank assignment state: preserve and flag rather than fabricating acceptance.
8. Source Reference contains date-like numeric values for TASK-023/024. Fourteen task notes contain `[CONFIRM ...]` placeholders. Preserve exact values and flag uncertainty; do not infer missing dates or references.
9. The Modify Task form shows TASK-190 as Not Started while the master marks it Complete. Treat editor values as a stale/draft snapshot, preserve the discrepancy, and let the master govern the import unless reviewed otherwise. Navigation/form tabs are not additional task records.
10. The September 8 handoff warns its script references a missing `Home` tab and lacks `processRecurringTasks`. The supplied script matches workbook Apps Script Code!A3 after trimming, but the live bound script, triggers, timezone and Google revision were not fetched. The export cannot prove that recurrence currently works or contains every subsequent live edit.

## Fit with the current application

The application already supplies project/task forms, project notes and links, priorities, task assignment, assignment notifications, project filters, optional project dates/organization display, save feedback and monthly project recurrence. These are the current local worktree's capabilities, not a claim that all are deployed.

| Tracker concept | Current support | Required treatment |
| --- | --- | --- |
| Project/task names, notes, priorities and dates | Mostly supported | Map without truncation; retain notes and definition of done separately in project overview |
| Seven work areas | Project tags/type label; one task tag and workstream label | One shared controlled Work area field/filter for both; preserve original codes |
| Task owner + four collaborators | Assignee table allows multiple people, but current UI/loader picks one; no roles | Typed owner/collaborator relationships and explicit visibility filters |
| Project owner + collaborators | Member labels plus owner/contributor UUIDs in guided_setup for guided projects | Reuse validated guided ownership where appropriate; preserve the explicit owner for imported projects and labels for display compatibility |
| Proposed/accepted/declined assignments | Direct assignment only | Separate assignment proposal state/history and review controls |
| Waiting tasks and blocker details | Task statuses only todo/in-progress/done | Add Waiting plus waiting type/person/text; do not overload priority or tags |
| On Hold project | Not a native project status | Add On Hold consistently to validation, database, lists, board and filters |
| No task date/project | Both dates and project required | Nullable task dates; controlled general-work bucket for projectless business tasks, with visible “Needs project” classification |
| Estimates and Planned Week | No corresponding task fields | Numeric estimated minutes and a date-only planning week, separate from deadline |
| Completed history/archive | Done exists; no dedicated imported completion timestamp/archive model | Preserve completed_at and source completion date; searchable Completed/Archived view and reversible archive state |
| Reusable templates/dependencies | Starter/guided setup is not reusable team templates; upstream Save as template is unwired | Persist template definitions and ordered task dependencies; activate in milestone two |
| Daily/weekly/calendar-month recurrence | Monthly project-on-completion only | Separate scheduled task/template recurrence, idempotent occurrences and explicit timezone |
| Source/assignment history | App audit events reflect app operations | Import provenance and original source fields; do not fabricate past app activity |
| Calendar task scheduling | Calendar integrates roadmap/internal events, not this spreadsheet's task scheduling | Defer task-calendar bridge; all five task schedule/calendar columns are empty |

Suggested work-area names: Administration (Admin), Development (Dev), Programs (Prg), Business Development (Biz Dev), Communications (Coms), HR, Governance. Keep one primary area distinct from project, organization and optional freeform tags. Do not turn every imported note attribute into a new tag. No separate source tag column exists. Expand task tags only if the resulting workflow needs multiple labels; provenance belongs in metadata, not a user-facing tag pile.

Task mapping: Not Started → todo; In Progress → in-progress; Waiting → waiting; Complete → done. Priority: On Fire! → urgent; High/Medium/Low → existing equivalents; blank → no-priority. Project Active → active; Complete → completed; On Hold → on-hold. Blank dates stay blank. Preserve recorded completion even if the former proposed assignee never accepted.

Use a real Coach House “General work” project as the initial home for projectless **business** tasks; retain their original blank project in provenance and allow later moves. This avoids making every project relationship nullable throughout the application. Unprocessed Work Inbox items stay review items, not automatically accepted tasks. Personal/ambiguous items stay restricted in the migration review store; a “Personal” tag or No organization flag does not confer privacy.

## Identity, organization and existing-record mapping

Read-only check on September 28:

| Tracker person | Current application mapping | Action |
| --- | --- | --- |
| Joel | joel@coachhousesolutions.org; platform coach | Exact email match; UUID 64cf262e-e526-4601-8a2a-f50d1c11c8c2 |
| Paula | paula@coachhousesolutions.org; platform coach | Exact match |
| Karissa | fs@coachhousesolutions.org; platform coach, profile name blank | Tracker explicitly maps Karissa to this account; retain this mapping in review manifest |
| Caleb | Tracker says caleb@coachhousesolutions.org; existing developer account is caleb@bandto.com | Proposed mapping to existing Caleb account; confirm before activation, no duplicate account |
| Franklin | No exact tracker-email profile or Franklin platform-staff record found | Confirm his application account or arrange access before activating his assignments |

Coach House Solutions Group exists at `c5405481-cea7-418a-b0c3-531ec942c047`. Joel, Paula and the fs account are assigned coaches there. Internal work should use Coach House ownership by default. Do not move tasks to client organizations just because names such as AMJC/BLR appear in text: that changes visibility, and current cross-organization project moves are unsupported. Review any explicit client mappings separately. Never widen client membership/coach access as an import side effect.

Of 31 current standard projects, “Revenue Pipeline” is an exact normalized-name candidate for source P-020. Coach House also has “Finance” (possible Finances overlap) and “Project and Task Tracker - Platform updates” (possible Project Management Tool overlap). These require record comparison, not automatic merges. The read-only scan of 14 current user-created tasks found no exact normalized-title matches. This does not exclude semantic duplicates; repeat a fully paginated comparison immediately before import.

## Delivery sequence

### 1. Freeze source and build a reviewable dry run

- Preserve byte-for-byte workbook, README and script in a private backup outside Git, with hashes and a capture time. At cutover, obtain a fresh export or confirmation that this is the final source and reconcile changes since this snapshot.
- Extract all master cells, original values, dates, formulas/caches, comments and sheet/row locations. Preserve all other sheets in the source archive; derive records only from masters. Never execute Apps Script or formulas to discover records.
- Create a mapping manifest for identities, projects, organizations, work areas and source IDs. Give every source record a disposition: create, link to existing, preserve inactive, or hold for review with a reason. Unmapped is an error/visible exception, never a silently skipped row.
- Produce proposed account mappings, duplicate comparisons, personal/test candidates, draft discrepancies and unresolved references. Review these concrete results before any live import.

### 2. Add the minimum application support

- Extend `member-workspace` schemas/types, validation, server transitions, loaders and current shadcn editors for nullable task dates, Waiting/On Hold, work area, estimates, planned week, completion/archive history and typed membership.
- Support proposed assignments independently from task status. Existing direct admin assignments keep their current behavior; proposal acceptance is an explicit workflow, not a new mandatory step for all tasks.
- Keep My Tasks as owned work; add clear filters/sections for Proposed to me, Collaborating, Waiting and Completed/Archived. Include a team view for authorized staff, with consistent counts. Exclude historical completed proposals from actionable requests.
- Add a compact intake/import review surface using existing UI patterns. Do not rebuild the spreadsheet's Home tabs or navigation.
- Preserve immediate saving/success/error feedback and current route refresh behavior for all new edits.
- Verify all five coaches' intended scope. Owner, collaborator, proposed recipient and importer are different roles; the importer must not acquire all unassigned work through the existing created_by fallback.

### 3. Implement and rehearse the import

- Scaffold `pnpm scaffold:feature task-tracker-import` when implementation starts. Keep parsing, mapping and reconciliation under that feature; route files composition-only. Keep source files and raw extracts outside Git and public storage.
- Add an import-batch ledger with source namespace, snapshot hash, entity type, stable source ID, original row/cell location, original payload/hash, destination ID, mapping version and disposition. Source identity must remain stable across snapshot revisions; snapshot hash alone must not create duplicates on re-import.
- Add a service-only transactional importer with tenant/actor checks, per-batch scope and an immutable result report. Store application import time honestly; preserve original source dates separately. Do not set source-person labels equal to actual authenticated app actors.
- Dates: parse the workbook's date system correctly; keep date-only fields as dates. Confirm spreadsheet timezone before interpreting fractional serial timestamps as UTC. Preserve raw serials and uncertainty rather than assuming a timezone. Do not manufacture missing timestamps.
- Preserve notes verbatim as text; sanitize any generated HTML and validate extracted links. Imported cells must never execute as code or raw HTML.
- Rehearse against an isolated database with the current migrations and a protected source copy. Test retries, failure halfway through, changed-source conflicts and mapping to existing projects. Never seed the shared production backend with rehearsal fixtures.
- Scope notification suppression to the authorized import transaction/batch. Do not disable global triggers or impersonate source proposers. Historical assignment rows must not send hundreds of fresh assignment notifications; ordinary assignments after import retain notifications to the assignee and assigning admin. Offer a reviewed import summary instead of per-row noise.
- Import templates and recurrence definitions as inactive records with their original rules. No generation or external calendar writes during import.

### 4. Activate templates and recurrence

- Templates instantiate projects/tasks with sequence, owner/collaborator mappings, offsets and dependency links. The four definitions are reusable templates, not four additional active projects. Missing offsets remain missing.
- Preserve the 16 dependency references in the template graph and materialize them on instantiation. Validate references/cycles; show blockers. Keep literal instructions that imply more dependencies than the structured source rather than inventing edges.
- Implement the four actual recurring-task rules first: daily AMJC outreach, daily AMJC inbox triage, Monday agenda review, and the first-full-week monthly relationship check. Clarify “morning” and the monthly generation date before scheduling. Use the agreed local timezone and date rules, stored alongside UTC execution timestamps.
- Monthly financial close, annual compliance and quarterly board preparation also carry scheduling instructions in template notes. Preserve and support them, but annual due dates and board meeting dates are not present. Do not infer filing deadlines or activate those schedules until configured.
- Use a unique rule/occurrence key, locking and bounded retries. Define missed-run behavior explicitly: no automatic flood of overdue historical occurrences. Keep rules paused until cutover start, next occurrence and catch-up policy are reviewed.
- Check for manually created daily occurrences already in Tasks (including September 23 AMJC tasks without Recurring Task IDs) before generating. Keep scheduled recurrence separate from existing completion-triggered monthly project recurrence to avoid double generation.

### 5. Cut over and reconcile

- Ship required schema and application support through focused tests, current-revision hosted quality and required review before activating imported behavior.
- Review the final manifest, cost/provider scope and rollback with Caleb before the live data action. Import only approved mappings/dispositions; no user-account creation, access grants or provider changes are implicit.
- Verify through Joel's account and representative teammate access: correct assignments/collaborators/proposals, project links, category filters, undated tasks, waiting items, archive/search and save/reopen. Authenticated browser automation remains subject to the earlier browser-access restriction; user review can supply interactive evidence.
- Reconcile counts and fields against the frozen source. Only then retire spreadsheet data entry/old recurrence triggers through an explicit cutover action. Retain the original workbook/scripts read-only for recovery and reference.

## Preservation contract and acceptance

Every one of the 348 source master records must have a durable destination or visible preserved/held disposition. “Held” is accounted for, not considered active or fully migrated. Final signoff names every remaining held record and why; no claim that all work is usable while essential items remain unresolved.

- Projects: 41 source IDs accounted for, including two complete and one On Hold; links to existing projects separately counted. Generated General work is not part of this source count.
- Tasks: 264 IDs accounted for; 51 completions preserved exactly once; 213 incomplete accounted for before approved fixture/personal holds. All 30 tail rows included. Archive adds zero duplicate records.
- Assignments: 99 accepted, 164 proposed and one blank preserved as source states; 11 completed proposals stay completed; no automatic reassignment. Preserve 250 populated collaborator slots with identity mapping and source position, deduplicating relationships without discarding source evidence.
- Inbox: all nine captures preserved with deterministic synthetic import keys. Templates: four definitions, 26 steps and 16 explicit dependency references. Recurrence: four definitions preserved with active/paused state clearly reported.
- Field-level comparison covers notes, dates, people, source fields, completion, waiting details and rule text. Hashes/counts alone do not establish usable mappings.
- Dry run followed by repeat import creates no duplicates and changes no records edited by users since import without an explicit conflict decision.
- A failed batch leaves no partial operational import. Rollback removes only untouched records created by that batch, including its owned relationships/events; linked existing records use captured before-images and version checks. User-edited imports require a conflict report, not destructive rollback.
- RLS tests cover internal staff, unrelated client members, proposed recipients, collaborators, source archive access and personal/held rows. Imports must not change permissions on existing organizations/projects. Verify task counts, progress, dashboard activity and notification behavior.
- UI testing covers immediate feedback, save/reopen, blank dates, combined filters, proposal acceptance/decline, archive/restore, template instantiation and recurrence boundaries (DST, month-end, first full week, retry/idempotency).

## Field mapping details

| Source fields | Destination |
| --- | --- |
| Task ID / Project ID | Stable external IDs in import ledger; application UUIDs remain primary keys |
| Task Work Area, Project, Task Name | Work area, mapped project ID, title; unresolved original association retained |
| Owner, Collaborator 1–4 | Role-bearing user relationships; original labels/slot order retained |
| Priority, Estimated Minutes, Estimated Start Date, Planned Week, Deadline, Status | Typed priority, estimate, nullable dates, planning week, task status |
| Waiting Type, Waiting For | Waiting classification and person/reference/text; external labels are not auto-created accounts |
| Notes / Link | Full task description plus validated links where useful; original text retained |
| Scheduled Start/End, Schedule Status, Calendar Event ID/Link | All empty in this snapshot; preserve source schema, defer operational scheduling integration |
| Completed Date, Recurring Task ID | Completion history and rule relationship; retain raw timestamps |
| Assignment Status, Proposed Owner/By/Date, Accepted Date, Acceptance Notes | Proposal/assignment history with resolved identities where proven |
| Source Type/Person/Date/Reference, Intake ID, Template Task ID | Provenance/import ledger and links; blank fields remain blank |
| Focus Score, Last Activity | Focus Score is derived/broken: retain source value, do not rebuild scoring; preserve Last Activity as legacy activity timestamp |
| Project Owner, Collaborator 1–2 | Explicit project owner/collaborator relationships, with additional prose collaborator context preserved in notes |
| Project Status, Priority, Start/Target Dates | Typed fields with nullable dates; On Hold supported explicitly |
| Project Notes, Outcome / Definition of Done | Distinct sections in existing project overview; full source text retained |
| Project Type, Template ID, source/intake fields | Preserved type and source metadata; no recurrence inferred from a project name |
| Template definitions/steps | Reusable templates with source IDs, order, defaults, duration, offsets, dependencies and instructions |
| Recurrence fields | Rule definition, natural-language source, owner/collaborators, estimate, frequency, date rules, last/next generation and activation review |
| Intake and discussion fields | Review record and original payload; preserve schema even for zero-row Discussion Queue |

## What can be left behind

Retain these in the source archive but do not recreate them: personalized spreadsheet Home pages, navigation buttons, Apps Script menus/onEdit handlers, Add/Modify/Assign form tabs, duplicate My Work/My Projects/This Week/Archive views, spreadsheet validation mechanics, formula helper columns, focus-score formulas and mobile web-app deployment. Existing app pages replace their presentation. The two workbook comments are editor/code instructions, not historical task conversations.

Leave calendar task scheduling, speech parsing and a new standalone discussion subsystem out of the initial migration: no scheduled task/calendar data or discussion records exist in this export. Existing mobile task entry remains available; automation can be assessed separately after core migration.

## Decisions needed before live activation

1. Franklin's destination account/access; confirm Caleb's mapping to his existing developer account.
2. The concrete exception manifest: retain/hold sample and personal items; link or keep overlapping projects; resolve the missing PR Campaign association and nine unprocessed captures. No bulk deletion or fuzzy auto-merge.
3. Final-source freshness and timezone; recurrence start/time/catch-up rules. Board dates and annual filing dates can remain unconfigured with those schedules visibly paused.

No further decision is required to begin the local implementation and dry-run work once Caleb requests it. This document itself authorizes no live import, new access grants, notifications, provider changes or release.

## Code owners to extend

- `src/features/member-workspace/types.ts`, `server/task-actions.ts`, `server/task-action-helpers.ts`, `server/task-transition-support.ts`, `server/task-assignees.ts`, `server/task-loaders.ts`, `server/personal-task-scope.ts`.
- `src/features/member-workspace/server/project-loaders.ts`, `server/project-create-input.ts`, `server/project-detail-view-model.ts`, project/task filter and editor components, saved-state helpers.
- `src/lib/supabase/schema/tables/organization_tasks.ts`, `organization_task_assignees.ts`, `organization_projects.ts`, new typed metadata/relationship tables and migrations.
- Existing project/task transitions, recurrence and assignment-notification migrations are the behavioral baseline; add migrations rather than rewriting applied history.
- Focused acceptance suites for loaders, filters, actions, saved-state/feedback and notifications; isolated PostgreSQL/RLS harness for migrations, imports and recurrence. Full hosted release gates still apply. The existing unrelated TypeScript-test baseline is not evidence this future feature passes.

## Source checksums

- Workbook SHA-256: `96b72bf4f3252e8569d06067df5a18cbea58dbb63af85294f07441295982dba1`
- Code.gs SHA-256: `cf0aa4ef1a30dbac53179e6b03287d88e0586958fe60395d85516debecefe9b8`
- README.md SHA-256: `62cd75627dbbf0be711795a9db7822f6a8bc440e0f0755041bcd632cf823786a`

These identify the inspected local snapshot. They do not identify the current live Google Sheet revision. Read-only database results must be refreshed at cutover.
