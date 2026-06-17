# UserJourneyAtlas Feature

## Ownership
- Domain logic: `src/features/user-journey-atlas/lib/**`
- Canonical graph source: `src/features/user-journey-atlas/lib/user-journey-atlas.mmd`
- Server actions/queries: `src/features/user-journey-atlas/server/**`
- UI components: `src/features/user-journey-atlas/components/**`
- Hooks/controllers: `src/features/user-journey-atlas/hooks/**`

## Rules
- Keep route files in `src/app/**` as composition-only wrappers over this feature.
- Import other features only through their public entrypoint (`@/features/<name>`).
- Keep `lib/**` pure: no React, no UI imports, no route imports.
- Keep `server/**` free of UI/component imports.
- Keep shared UI in `src/components/ui/**`; avoid one-off primitives here.
- Keep Mermaid node `file:` metadata pointed at real repository-relative files.
- Keep acceptance coverage in `tests/acceptance/user-journey-atlas.test.ts`.
- Add acceptance tests for user-visible behavior before merging.
