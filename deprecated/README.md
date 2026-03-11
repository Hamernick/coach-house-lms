# Deprecated Archive

This folder stores legacy or disconnected artifacts that are intentionally kept for reference but removed from active paths.

## Archive Rules

- Do not import from `deprecated/**` in runtime code.
- Do not edit archived files unless restoring/migrating them.
- If restoring a file, move it back to its active location in the same PR.
- Archive root-level legacy code/docs/assets under `deprecated/**` instead of leaving dead ends in active route or feature trees.
- Temporary route-local staging folders like `src/**/deprecated/**` should be treated as short-lived holding areas only; move true archives into this root.
- Active guardrail: `pnpm check:deprecated-imports` fails if any non-deprecated code imports a `deprecated` path segment.

## Active Archive Workflow

1. Verify the code is no longer imported by active routes/features.
2. Move it into a dated bucket under `deprecated/src/**`, `deprecated/docs/**`, `deprecated/tests/**`, or `deprecated/artifacts/**`.
3. Add or update a README in that bucket with:
   - why it was archived,
   - what replaced it,
   - whether it is safe to delete later.
4. Record the move in `docs/RUNLOG.md`.

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
