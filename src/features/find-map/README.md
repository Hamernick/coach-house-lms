# FindMap Feature

## Ownership
- Shared server state and route composition: `src/features/find-map/server/**`
- Feature-level exports and public contracts: `src/features/find-map/index.ts`, `src/features/find-map/types.ts`
- Future feature-specific UI composition: `src/features/find-map/components/**`
- Future feature-specific pure helpers: `src/features/find-map/lib/**`

## Rules
- Keep `/find` route files in `src/app/**` composition-only.
- Keep auth-aware map behavior shared between guest and signed-in flows.
- Keep `lib/**` pure: no React, no UI imports, no route imports.
- Keep `server/**` free of UI/component imports.
- Reuse shared shadcn/ui primitives and existing public-map components instead of duplicating shells.
- Keep acceptance coverage in `tests/acceptance/find-map.test.ts`.
