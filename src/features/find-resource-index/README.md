# Find Resource Index Feature

## Ownership

- Domain logic: `src/features/find-resource-index/lib/**`
- Server queries: `src/features/find-resource-index/server/**`
- API route composition: `src/app/api/public/resource-map/index/**`

## Rules

- Keep route files in `src/app/**` as composition-only wrappers over this feature.
- Import other features only through their public entrypoint (`@/features/<name>`).
- Keep `lib/**` pure: no React, no UI imports, no route imports.
- Keep `server/**` free of UI/component imports.
- Keep the index transport compact and public-safe. Detail-only fields belong to
  the separate resource detail contract.
- Keep the existing full-item endpoint unchanged until detail-on-demand is
  available.
- Keep acceptance coverage in `tests/acceptance/find-resource-index.test.ts`.
