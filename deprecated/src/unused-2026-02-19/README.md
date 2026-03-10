# Archived Unused Modules (2026-02-19)

These files were moved from `src/**` after a static usage audit.

## Selection Criteria

- Zero inbound references from `src/**` import graph.
- Not part of Next.js route entry files.
- Not referenced by current production runtime path.

## Notes

- Files are preserved verbatim for recovery/reference.
- Archive path mirrors original repository paths under this folder.
- A full validation pass was run after archiving:
  - `pnpm lint`
  - `pnpm check:structure`
  - `pnpm test:snapshots`
  - `pnpm test:acceptance`
  - `pnpm test:rls`
  - `pnpm build`
