# Development consolidation release-base repair

## Candidate

Worktree: `coach-house-platform-pr229-base-repair-20260909`.
Branch: `fix/development-consolidation-base-20260909`.

The pending merge combines draft PR #229 head
`f6d55c42f3b8c6545c80bb94b78c8fed23242cbd` with verified remote `main`
`67501039f5a79db95db87f6ad4842b640a537195`. It is staged and uncommitted.
Neither the remote PR branch nor the running application has changed.

This repairs the existing release base without adding the newer local
Documents/Calendar implementation. That separate integration remains staged in
`chore/documents-calendar-integration-20260909`, with its prior full quality pass.
The active Calendar worktree and localhost:3000 are preserved.

## Conflict decisions

Eight paths conflicted. Seven now exactly match `main`:

- Drive domain helpers and connection service retain same-account refresh-token
  reuse checks, preventing reuse after selecting another Google identity.
- The Workspace Tools Drive connection retains the deployed switch, disconnect
  confirmation and focus restoration.
- Drive acceptance and RLS checks retain the Tools OAuth return-path migration
  and account-switch regression coverage.
- Workspace Tools acceptance retains the switch/focus expectations.

The monthly runlog retains both complete appended histories. All automatically
merged public-profile activation changes from `main` remain in the candidate.
There are no remaining unmerged index entries or conflict markers in these paths.

## Stacked PR #231

PR #231 remains at `0e03bb7d1ca0d81d91b68e5041d16525a4961730`, based on the old
PR #229 head. Its 12 non-runlog paths apply cleanly to the repaired candidate.
Its appended runlog history has a resolved review-only version and patch.

The combined stack preview matches the previously reconciled local merge
`a6100ce2` in its application, tests and configuration. Only the combined runlog
and this new review plan differ. This is source-equivalence and patch-application
evidence; no remote PR update or live crawler run occurred.

## Validation and evidence

Full `pnpm check:quality` passed all 21 stages in 340.90 seconds: 2,365 acceptance
tests (one expected skip), 45 browser checks, seven temporary PostgreSQL suites,
snapshots, lint/static guards, production build and performance budgets. The
existing Playwright configuration used two workers, no retries, and an explicit
local base URL on port 3024. The QA server stopped after validation.

The checkout had no environment files or provider credentials. Shared Supabase
fixture writers were skipped. No provider, organization or source-file canary
records were written. No visual baselines needed updating; the merged Drive
switch baselines matched the deployed implementation.

The repair worktree's code graph was rebuilt without API calls: 18,361 nodes,
51,918 edges and 977 communities. It contains no generated-source nodes from
`test-results`, `.next` or `node_modules`; the canonical graph remains intact.
The final staged diff has no whitespace errors or unmerged entries.

Canonical-root evidence: `test-results/pr229-base-repair-20260909/`, including
immutable head/base IDs, the resolved merge patch, stacked-PR preview, preserved
root handoff patch and validation output.

The stack preview and patch are review artifacts only. The complete stacked tree
was not run through a second quality gate in this session.

## Remaining external steps

The saved Vercel CLI login still returns HTTP 403, and this session discovers no
attached browser. Existing Drive credentials need an authorized secure source;
do not generate replacements for the encryption keys or repeatedly reconnect
Google accounts to work around missing server configuration.

Completing the Git merge commit and pushing it would update draft PR #229.
Before any push, review the final candidate and the branch's deployment behavior;
Vercel preview rules have not been verified with current provider access.
Preserve draft status. Merging to `main`, applying shared migrations, deployment,
Google configuration changes and live-document writes remain separate actions.
