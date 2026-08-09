# RUNLOG Sharding Design

## Decision

Keep `docs/RUNLOG.md` as the stable canonical index and store new session entries
in monthly files under `docs/runlog/`. Freeze the original monolith as a read-only
legacy archive.

## Continuation flow

Agents read `AGENTS.md`, follow the current-log link in `docs/RUNLOG.md`, read the
latest dated entries, and inspect the worktree. They append only to the current
monthly file. At the first session of a new month, the agent creates the new file
and changes the index pointer in the same patch.

## Boundaries

- The stable index preserves existing documentation links.
- Monthly logs are append-only and capped by the large-file guardrail.
- Archived logs are immutable and excluded only through an exact path rule.
- Historical references to updating `docs/RUNLOG.md` resolve through the index to
  the current monthly log.

## Migration and validation

Move the existing file byte-for-byte to
`docs/runlog/archive/legacy-through-2026-07-14.md`. Verify its SHA-256 checksum,
update active agent workflow documents, run the large-file check, check links and
references, and confirm `git diff --check` passes.
