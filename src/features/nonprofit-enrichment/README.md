# Nonprofit enrichment

Private, resumable nonprofit research using a local SQLite ledger. Research requires no API keys. A separate manifest-based publisher can write audited directory projections to an explicitly bound Supabase target; see the [publication contract](../../../docs/agent/nonprofit-directory-publication.md).

**Start/resume:** [continuation runbook](../../../docs/agent/nonprofit-enrichment-runbook.md). It contains the active worktree/state paths, copy-ready handoff prompt, commands, safety boundaries, current evidence counts and next milestone.

Requires Node 22.13+; Python 3 stdlib parses local IRS XML. Uses existing acquisition modules and taxonomy; adds no package dependencies.

- `server/cli.mjs`: operator/agent command interface.
- `store.mjs`, `queue.mjs`: WAL ledger, transactions, fenced leases, retry and atomic completion.
- `import.mjs`, `filings.mjs`, `parse-filings.py`, `evidence-import.mjs`: bounded source adapters/checkpoints.
- `crawl.mjs`: confirmed request budgets, shared page cache, source evidence.
- `classification.mjs`: existing taxonomy candidates and abstention.
- `continuation.mjs`: branch-independent state location, live handoff and durable checkpoint.
- `directory-projection.mjs`, `publication-plan.mjs`, `publisher.mjs`: allowlisted projection, target preflight and receipt-based resumable publication.
- `artifacts.mjs`: immutable private exports and handoff snapshots.
- `tests/`: runtime integration, concurrency, retry, replay and source-boundary tests.

Evidence and private artifacts live outside worktrees at `~/.local/share/coach-house/nonprofit-enrichment`. `RESUME.md` is the permanent entry point; `checkpoint --write` refreshes it and `CURRENT.json`. Git does not back up that state. Public feature exports expose policy/types only; `components/` and `server/actions.ts` intentionally provide no application UI or mutation endpoints.


Missing-field rollout: `server/prepare-filing-updates.mjs` selects only imported-filing EINs and reuses dated field evidence rules. `server/filing-update-plan.mjs` fills only null canonical website/phone/description values, preserving identities and existing contacts; plans use the existing atomic publisher. The permanent `FILING-PUBLICATION.json` locates the resumable production operator. Do not start category writes while that operator owns the writer slot.
