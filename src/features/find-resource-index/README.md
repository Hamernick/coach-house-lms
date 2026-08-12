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
- Bump the response version whenever paging semantics change.
- Keep pages deterministically ordered by public item ID. Use the returned
  cursor instead of numeric offsets so cached refreshes do not skip records.
- Share one five-minute server snapshot across page URLs so traversal does not
  repeat the complete public resource query for every page.
- Reuse the existing public full-item sanitizer for detail lookup. Never return
  the cached raw item directly from an API route.
- Cache each sanitized detail response separately; the complete raw dataset is
  larger than Next.js's per-entry data-cache limit.
- Resolve production details by exact ID from the existing anonymous sanitized
  view. Never query raw import or curation tables for this route.
- Keep the existing full-item endpoint unchanged until detail-on-demand is
  available.
- Keep acceptance coverage in `tests/acceptance/find-resource-index.test.ts`.
