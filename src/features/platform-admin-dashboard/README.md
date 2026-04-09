# Platform Admin Dashboard Feature

## Ownership
- Domain logic: `src/features/platform-admin-dashboard/lib/**`
- Server actions/queries: `src/features/platform-admin-dashboard/server/**`
- UI components: `src/features/platform-admin-dashboard/components/**`
- Hooks/controllers: `src/features/platform-admin-dashboard/hooks/**`

## Rules
- Keep route files in `src/app/**` as composition-only wrappers over this feature.
- Import other features only through their public entrypoint (`@/features/<name>`).
- Keep `lib/**` pure: no React, no UI imports, no route imports.
- Keep `server/**` free of UI/component imports.
- Keep shared UI in `src/components/ui/**`; avoid one-off primitives here.
- Keep acceptance coverage in `tests/acceptance/platform-admin-dashboard.test.ts`.
- Add acceptance tests for user-visible behavior before merging.

## Imported Upstream Snapshot

- Source repo: `https://github.com/Jason-uxui/project-dashboard`
- Pinned commit: `12f1ff4cdad06bc99fd1f18e1febea1719addf35`
- Imported artifacts live under:
  - `upstream/components/**`
  - `upstream/lib/**`
  - `upstream/hooks/**`
  - `upstream/styles/**`
  - `public/platform-lab/**`
  - `UPSTREAM_LICENSE.txt`
- Quarantine rule: keep upstream files as close to source as practical and place Coach House-specific behavior in route wrappers, path helpers, or feature-level adapters.
- Imported route tree currently mirrors the donor shell under `/internal/platform-lab`, `/tasks`, `/clients`, `/clients/[id]`, `/inbox`, `/performance`, and `/projects/[id]`.
