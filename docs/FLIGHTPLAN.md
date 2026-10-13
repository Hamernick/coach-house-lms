# FLIGHTPLAN

The project planning and forecasting entry point. Reference word: **FLIGHTPLAN**.

Canonical local file: `/Users/calebhamernick/Development/coach-house-platform-flightplan-20261012/docs/FLIGHTPLAN.md`.
Branch: `chore/flightplan-20261012`. This is the single orchestration checkout.
Do not create independent authoritative copies in implementation worktrees.

## Open the dashboard

```sh
python3 /Users/calebhamernick/Development/coach-house-platform-flightplan-20261012/docs/flightplan/dashboard.py
```

From this checkout:

```sh
python3 docs/flightplan/dashboard.py --once
python3 docs/flightplan/dashboard.py --validate
python3 docs/flightplan/dashboard.py --prompt FP-001
```

Python 3.9+ with curses; no packages, web server, shell configuration, or port required.
The viewer rereads this file every second, never writes, and retains the last valid
view with an error banner if an edit is incomplete. Up/Down selects; Enter opens
details; P displays the copyable prompt; Esc returns; Q exits. Details/prompts scroll.
Use `--prompt ID` to copy a long prompt from ordinary terminal output.

## Authority and collaboration

- This chat is the orchestrator/planner. Worker chats implement individual projects.
- Before receiving the user's long list, only dashboard setup and backup work are
  registered. Historical open-work entries are evidence, not a newly approved backlog.
- The JSON block below drives the TUI. Edit that block for live project state;
  prose contains policy. Keep project IDs permanent and entries in development order.
- Only the orchestrator edits the canonical record. Workers save uniquely named
  `docs/flightplan/receipts/<ID>-<UTC timestamp>.md` in their own branches and return
  the branch, commit, receipt path and remote verification. The orchestrator imports
  evidence; chats do not automatically share progress or receive each other's messages.
- Reconcile the repository open-work index; user-confirmed closures override stale logs.
- Update via a temporary file plus atomic rename to prevent partial TUI reads.
- A one-word reference works once the chat can locate this file. In other worktrees,
  include this absolute path in the initial handoff prompt. After a computer change,
  recover the branch, then update local paths. This does not install a global command.

## Intake and sequencing

1. Preserve the original list and assign an ID to each request.
2. Group by independently deliverable outcome; record scope and exclusions.
3. Resolve hard dependencies and shared code/schema/provider ownership.
4. Order foundations before dependents; parallelize only independent streams.
5. Write acceptance milestones, review requirements and an exact kickoff prompt.
6. Reserve a unique branch/worktree and candidate port. At startup verify port/PID/cwd;
   a reservation is not proof a port is free. Honor required OAuth callback ports.
7. Reconcile receipts after each meaningful checkpoint and before forecasting.

Progress is completed evidence-backed milestones divided by total milestones.
It is not effort spent, elapsed time, certainty, or production readiness. Checkpoints
must have evidence. A project with no defined milestones remains 0%, not complete.
Track local checks, user review, current-head CI, merge, provider setup, deployment
and production verification separately in release notes. Any gate marked N/A needs
an explicit rationale. Unknown/stale evidence stays unknown.

For forecasts record optimistic/likely/pessimistic effort, available capacity,
dependencies, confidence and assumptions. Sum serial dependencies; do not sum
parallel streams as elapsed duration. Reforecast after scope or blockers change.
For decisions record options, tradeoffs, chosen option, owner, date and what would
cause reconsideration. Never convert an unanswered question into approval.

## Worker prompt template

Replace every placeholder with a real value before issuing it:

```text
Read AGENTS.md, its continuation documents, and <absolute FLIGHTPLAN path>.
You own <ID>: <outcome>. Scope: <included work>. Exclusions: <boundaries>.
Dependencies/evidence: <IDs and exact references>.
Branch strategy is authorized: <create isolated branch from fresh origin/main,
validated integration base, or resume the exact assigned worktree>.
Branch: <branch>. Worktree: <absolute path>. Candidate port: <port or none>.
Verify ownership and availability before starting localhost. Preserve other lanes.
Read the project record and ask for missing product details early; continue
independent work. Use existing evidence and never restart completed work.
Acceptance: <concrete milestones>. Required checks: <focused tests and reviews>.
Report exact route links and what the user should try when a preview is ready.
Record commit/PR/CI/provider/deployment/production evidence separately.
Do not merge or deploy unless this project's authorization explicitly permits it.
At each checkpoint save a uniquely named progress receipt in your own branch:
changes, remaining work, blockers, tests, user review, branch/head, worktree,
localhost PID/cwd, remote backup verification, private-state backup gaps,
next action and any proposed forecast change. Return the receipt path and commit.
```

## Checkout lifecycle

Keep active checkouts. Archive inactive work only after committed work and needed
uncommitted/private state have verified off-device recovery copies and a handoff.
A pushed branch protects committed Git objects only. Ignored files, untracked work,
credentials, private data and local-only stashes are not covered by that statement.
Before deleting any checkout, verify restoration, no unique changes, no owner/server,
and explicit cleanup authorization. Never bulk-prune missing registrations first.
See [recovery audit](flightplan/recovery.md).

## Live record

<!-- flightplan:data -->
```json
{
  "version": 1,
  "updated_at": "2026-10-13T00:58:54+00:00",
  "next": "Preserve local code on GitHub; receive the task list.",
  "forecast": "No delivery dates until scope, dependencies and estimates are recorded.",
  "projects": [
    {
      "id": "FP-001",
      "title": "Project dashboard and chat handoffs",
      "outcome": "One Markdown authority, terminal dashboard, and reproducible workstream kickoff prompts.",
      "status": "active",
      "depends_on": [],
      "branch": "chore/flightplan-20261012",
      "worktree": "/Users/calebhamernick/Development/coach-house-platform-flightplan-20261012",
      "localhost": "None: terminal-only",
      "backup": "Local; remote verification pending",
      "release": "Internal planning tool; no application deployment",
      "next": "Validate TUI, preserve remotely, then ingest the user task list.",
      "estimate": "Not estimated",
      "confidence": "High for dashboard; task scope pending",
      "updated_at": "2026-10-13T00:58:54+00:00",
      "milestones": [
        {
          "title": "Agree dashboard design and isolated branch",
          "done": true,
          "evidence": "User approved this design and new isolated chore worktree on 2026-10-12."
        },
        {
          "title": "Implement Markdown source and terminal viewer",
          "done": true,
          "evidence": "docs/FLIGHTPLAN.md and docs/flightplan/dashboard.py."
        },
        {
          "title": "Validate rendering, prompts, error handling and keyboard interaction",
          "done": true,
          "evidence": "CLI rendering and prompt output; duplicate IDs, dependency cycles, missing evidence and malformed data rejected; PTY selection/details/prompt/quit passed."
        },
        {
          "title": "Verify remote recovery copy",
          "done": false,
          "evidence": ""
        }
      ],
      "prompt": "Read AGENTS.md, its canonical continuation documents, and /Users/calebhamernick/Development/coach-house-platform-flightplan-20261012/docs/FLIGHTPLAN.md. Work only on the selected project. Preserve unrelated dirty files, checkouts and servers. Verify saved evidence before resuming; never restart completed work. Continue FP-001 in its existing assigned branch/worktree; do not create a duplicate lane. Run python3 docs/flightplan/dashboard.py --once. Reconcile project receipts and ask for the raw task list if it has not arrived. Preserve original requests, group into independently deliverable workstreams, order by dependency, identify shared-file conflicts and produce a specific kickoff prompt for each project. Record forecasts as ranges with assumptions, not invented dates."
    },
    {
      "id": "SAFE-001",
      "title": "Recoverable worktree backups",
      "outcome": "Recent local code and plans are preserved on verified GitHub recovery branches without disturbing active worktrees.",
      "status": "active",
      "depends_on": [],
      "branch": "Audit only; source branches unchanged",
      "worktree": "All registered Coach House worktrees",
      "localhost": "Existing 3000 and 3008 servers preserved",
      "backup": "Local code audit complete; GitHub recovery snapshots in progress. Private files already cloud-backed per user.",
      "release": "Backup is not release approval",
      "next": "Secret-scan and push recovery snapshots; verify remote hashes and restore.",
      "estimate": "Pending scan and snapshot verification",
      "confidence": "Inventory verified at snapshot time; later edits need recheck",
      "updated_at": "2026-10-13T00:53:28+00:00",
      "milestones": [
        {
          "title": "Inventory local changes and remote reachability",
          "done": true,
          "evidence": "105 registrations before FLIGHTPLAN: 93 present, 12 missing, 9 dirty. Snapshot inventory recorded."
        },
        {
          "title": "Capture recent local code and plans without changing source worktrees",
          "done": false,
          "evidence": ""
        },
        {
          "title": "Scan outgoing content and preserve on GitHub recovery branches",
          "done": false,
          "evidence": ""
        },
        {
          "title": "Verify remote hashes and an independent restore",
          "done": false,
          "evidence": ""
        },
        {
          "title": "Record recovery references and retention decisions",
          "done": false,
          "evidence": ""
        }
      ],
      "prompt": "Read AGENTS.md, its canonical continuation documents, and /Users/calebhamernick/Development/coach-house-platform-flightplan-20261012/docs/FLIGHTPLAN.md. Work only on the selected project. Preserve unrelated dirty files, checkouts and servers. Verify saved evidence before resuming; never restart completed work. Continue SAFE-001 using docs/flightplan/recovery.md. The user clarified private files already have cloud backups; scope is local code/plans not pushed to GitHub. Recheck live worktree changes and remote reachability. Preserve changes on clearly labeled recovery branches after secret scanning; never push mixed history wholesale. Leave active source indexes, branches and servers unchanged. Record exact remote hashes and restore verification. Retain checkouts until cleanup is explicitly authorized; do not merge, deploy, reset, clean or prune."
    }
  ]
}
```
