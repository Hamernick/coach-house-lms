# Deprecated Archive

This folder stores legacy or disconnected artifacts that are intentionally kept for reference but removed from active paths.

## Archive Rules

- Do not import from `deprecated/**` in runtime code.
- Do not edit archived files unless restoring/migrating them.
- If restoring a file, move it back to its active location in the same PR.

## Archived In This Pass (2026-02-06)

- `deprecated/src/app/dashboard-01-demo/**`
  - Legacy shell demo route, not referenced by active navigation or imports.
- `deprecated/components/shadcn-studio/tabs/tabs-29.tsx`
  - Standalone demo component, not imported by runtime code.
- `deprecated/docs/trashcan/dashboard-sidebar-nav-item.md`
  - Existing trashcan note moved under a unified archive root.
- `deprecated/docs/runlog-legacy-2025-02.md`
  - Legacy run log superseded by `docs/RUNLOG.md`.
- `deprecated/artifacts/coach-house-lms@0.1.0`
  - Empty root artifact (0 bytes).
