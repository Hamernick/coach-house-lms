# Platform Access Feature

## Ownership

- Domain logic: `src/features/platform-access/lib/**`
- Server actions/queries: `src/features/platform-access/server/**`
- UI components: `src/features/platform-access/components/**`
- Hooks/controllers: `src/features/platform-access/hooks/**`

## Rules

- Keep route files in `src/app/**` as composition-only wrappers over this feature.
- Import other features only through their public entrypoint (`@/features/<name>`).
- Keep `lib/**` pure: no React, no UI imports, no route imports.
- Keep `server/**` free of UI/component imports.
- Keep shared UI in `src/components/ui/**`; avoid one-off primitives here.
- Keep acceptance coverage in `tests/acceptance/platform-access.test.ts`.
- Add acceptance tests for user-visible behavior before merging.

## Access Levels

- `developer`: every internal surface and broad administrative RLS access.
- `coach`: Workspace, Find, and Organizations only.
- no access level: existing customer or organization-member behavior.

Navigation reflects these capabilities, but server authorization and RLS remain
the security boundary.
