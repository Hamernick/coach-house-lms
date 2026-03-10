# Workspace Objectives Feature

## Ownership
- Domain logic: `src/features/workspace-objectives/lib/**`
- Server actions/queries: `src/features/workspace-objectives/server/**`
- UI components: `src/features/workspace-objectives/components/**`

## Rules
- Keep route files in `src/app/**` as composition-only wrappers over this feature.
- Import other features only through their public entrypoint (`@/features/<name>`).
- Keep `lib/**` pure: no React, no UI imports, no route imports.
- Keep `server/**` free of UI/component imports.
- Keep shared UI in `src/components/ui/**`; avoid one-off primitives here.
- Keep acceptance coverage in `tests/acceptance/workspace-objectives.test.ts`.
- Add acceptance tests for user-visible behavior before merging.

## Scope
- Source objective data from normalized workspace objective tables.
- Fallback read path from legacy `organization_workspace_boards.state.tracker` during migration window.
- Provide server actions for objective load/create/status updates.
