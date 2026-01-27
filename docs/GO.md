# GO — How to run Codex on this repo

Use this when starting a new chat/session.

## New chat prompt (copy/paste)

Read `AGENTS.md`, then `docs/organize.md`, then the latest entries in `docs/RUNLOG.md`, then `notes.md`, then `docs/briefs/INDEX.md`.

Follow this loop (one task at a time):
1) Pick the first unchecked item in `docs/organize.md` → `## NOW (Next 3)` (or, if empty, the next unchecked item in `## Step-by-Step Launch Checklist (P0 “Go” Path)`).
2) Create/update the brief in `docs/briefs/` using `docs/briefs/BRIEF_TEMPLATE.md`.
3) Implement (small, focused diffs).
4) Validate: `pnpm lint && pnpm test:snapshots && pnpm test:acceptance && pnpm test:rls`.
5) Log a concise entry in `docs/RUNLOG.md` (what changed, what worked, what didn’t, next step).

## Notes
- If a decision is still TBD, check `docs/organize.md` → `## Open Questions / Decisions`. Anything labeled “BLOCKS IMPLEMENTATION” must be resolved before building that feature.
