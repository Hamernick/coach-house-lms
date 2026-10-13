# Build and Collect Navigation

Owns the public Collect/Build navigation, the `/build` landing surface, and the
minimal home page at `/`. Explore leads to `/resources`, which contains the map,
directory, profiles, guides, and collection/search dock. Home retains the shared
header, an empty main canvas, and small Privacy Policy, Terms, and About controls.
Legacy `/map` and `/find` links redirect to `/resources` with query parameters.

## Ownership

- Domain logic: `src/features/build-collect-navigation/lib/**`
- Server boundary: `src/features/build-collect-navigation/server/**`
- UI components: `src/features/build-collect-navigation/components/**`

## Rules

- Keep route files in `src/app/**` as composition-only wrappers over this feature.
- Import other features only through their public entrypoint (`@/features/<name>`).
- Keep `lib/**` pure: no React, no UI imports, no route imports.
- Keep shared UI in `src/components/ui/**`; avoid one-off primitives here.
- Keep acceptance coverage in `tests/acceptance/build-collect-navigation.test.ts`.
- Add acceptance tests for user-visible behavior before merging.
