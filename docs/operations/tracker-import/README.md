# September 28 Coach House tracker import

This is an operator-only import of the reviewed workbook snapshot. It creates separate projects even when names overlap: Caleb confirmed Joel should decide which duplicates to keep. It never alters existing manual projects. No new scheduled jobs or provider charges.

## Approved visible behavior

- Preserve all five coaches' ownership; Franklin remains explicitly named but unlinked because no matching platform account exists.
- Source projects and tasks become ordinary native records. An additional **Unsorted work** project holds business tasks without a source project.
- Work areas become native workstreams/tags. Imported projects carry **Tracker import**.
- Original estimates and planned weeks appear as text in task overviews. Proposal history stays out of visible overviews and controls. Current pending proposals remain distinguishable from accepted assignments.
- Four templates/26 steps, four inactive recurring rules and nine inbox captures become nine reference notes under the imported **Project Management Tool** project. Automation is inactive.
- Two test/example projects and nine related/test/personal tasks remain in the service-only ledger. Do not activate or delete them without resolving their disposition.

## Immutable source and manifest

Private source copies and manifests: `~/.codex/backups/tracker-import-20260928/`, directory 0700, files 0600. Never commit this directory, payloads or credentials.

Workbook SHA256: `96b72bf4f3252e8569d06067df5a18cbea58dbb63af85294f07441295982dba1`.

Applied manifest: `manifest-v3.json`, SHA256 `a967906ce42250db7f718db5219158235d861d3966740cc66f27047c29fdc99d`.

Batch `b9d95f31-a465-5164-bc43-7a78159207c8` completed at **2026-09-28 17:21:35 UTC (1:21 PM EDT)**. Full native/source reconciliation passed. Four existing projects, six existing tasks and six existing assignments match their pre-import snapshots. Zero import assignment notifications; one summary activity event. Private evidence: `production-before-import.json` and `production-reconciled-v3.json` in the backup directory.

Eight source priorities labeled **On Fire!** map to native **Urgent**; original labels remain in overview text and raw provenance. An earlier v2 attempt failed the native priority constraint and rolled back completely. The corrected rehearsal includes that production constraint, identical-retry verification, access checks and guarded rollback. Unknown priority labels now fail offline before any database call.

Generate another candidate only after reviewing any source or mapping change:

```sh
python3 docs/operations/tracker-import/build_manifest.py INPUT.xlsx PRIVATE_OUTPUT.json
```

The builder reads all populated master rows, including tasks after row 1001; checks IDs, totals, known people and date order; HTML-escapes source text; preserves raw source payloads. Excel dates become calendar dates. Fractional historical timestamp values stay in raw provenance because the original timezone is unconfirmed. Archive duplicates are not imported twice.

## Production order and stopping points

1. Pass current-head required GitHub quality and obtain the user's code-owner approval/merge. Do not bypass protection.
2. Apply the three tracker migrations (`170000`, `171000`, `172000`) through the established linked-backend migration workflow. Prior project/task migrations are already applied. Check the dry run: no unrelated migrations.
3. Verify the merged deployment is Ready for the actual production app and supports the additive columns, blank task dates, Waiting and On hold.
4. Confirm this exact manifest hash/disposition and identity mapping; record notification/activity counts before import. Import only into Coach House's internal organization.
5. Invoke the explicit `apply` operation below. It uses one transaction, a batch lock, service-only RPC privileges, stable IDs and a private ledger. Identical retries return the recorded result; changed manifests fail. Normal notifications/activity resume after the transaction; the import adds one summary activity event.
6. Reconcile every record, verify Joel's authenticated views and save/reopen behavior, then provide actual production links. A local rehearsal is not production proof.

```sh
node docs/operations/tracker-import/run_import.mjs PRIVATE_MANIFEST EXPECTED_SHA256 PRIVATE_ENV_FILE apply
node docs/operations/tracker-import/run_import.mjs PRIVATE_MANIFEST EXPECTED_SHA256 PRIVATE_ENV_FILE reconcile
```

The default operation is read-only reconciliation. The operator never prints secrets or source payloads. Reconciliation covers original payload/disposition, native fields, metadata, ownership, counts and reference text. Investigate privately if it fails; do not rerun with a modified manifest or skip the discrepancy.

## Reconciled production counts

| Source | Native | Reference | Held | Total |
| --- | ---: | ---: | ---: | ---: |
| Projects | 39 | 0 | 2 | 41 |
| Tasks | 255 | 0 | 9 | 264 |
| Templates + steps | 0 | 30 | 0 | 30 |
| Recurring rules | 0 | 4 | 0 | 4 |
| Inbox captures | 0 | 9 | 0 | 9 |
| Total | 294 | 43 | 11 | 348 |

Plus one synthetic Unsorted work project: **40 projects, 255 tasks, nine reference notes** created. Native tasks: 171 To do, 31 In progress, six Waiting, 47 Done; 160 lack a start date and 180 lack a deadline. Joel: 18 source-owned projects, 82 assigned tasks (49 open/33 done), four pending proposals and 34 collaborator appearances. Views overlap.

## Guarded rollback

```sh
node docs/operations/tracker-import/run_import.mjs PRIVATE_MANIFEST EXPECTED_SHA256 PRIVATE_ENV_FILE rollback
```

Rollback refuses changed project/task/note versions, changed assignees, or newly added child tasks, notes, assets, links or overview documents. It removes only batch-created native projects and their unchanged descendants, keeps original payloads and the ledger, and records the rollback. Existing manual projects are untouched. A conflict requires manual recovery; never force deletion or drop nullable/status columns over remaining imported records.

Do not disable the original tracker or activate its recurrence scripts as part of this import.

## Production walkthrough and remaining review

Production `coachhouse.app` is Ready on merged SHA `335b96dca79b33a3aa3b3b8b23e283e6987a0214`. PR #259 head `6d86dfdc` passed all hosted checks including aggregate quality; its tree equals the merged deployment tree. Caleb merged PRs #258/#259 directly; the agent did not merge or bypass protection.

1. Joel signs in as `joel@coachhousesolutions.org` and opens [Tasks](https://coachhouse.app/tasks). Select Assigned to me; imported work contributes 49 open and 33 done tasks. Existing manual tasks may add to totals.
2. Switch to Proposed to me (four) and Collaborating (34 appearances; overlapping lists). These do not change accepted ownership.
3. Open [Projects](https://coachhouse.app/projects), filter the Tracker import tag and Joel as member. Existing manual duplicates remain separate.
4. Open a task overview for original notes, estimates and planned week text. Edit a real field, save, reopen and refresh to verify persistence and feedback.
5. Open [Project Management Tool](https://coachhouse.app/projects/d032082c-4879-56bd-9e69-64cf018cb71b), then Notes, for template/recurrence/inbox references. They are references, not active generators.

Read-back reconciliation and automated release checks passed. Joel-authenticated UI and edit/save/reopen review remain with Caleb/Joel; no browser permission was assumed. Franklin remains unlinked; 11 held personal/test source records remain private. No further feature work is required for this bounded release.
