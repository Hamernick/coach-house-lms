# Organization coach assignments

Internal tooling for assigning one coach-level platform staff member to an
organization. Developers manage assignments; coaches can read them. This
feature does not yet restrict organization visibility to assigned coaches.

## Ownership

- Domain logic: `src/features/organization-coach-assignments/lib/**`
- Server actions/queries: `src/features/organization-coach-assignments/server/**`
- UI components: `src/features/organization-coach-assignments/components/**`
- Hooks/controllers: `src/features/organization-coach-assignments/hooks/**`

## Rules

- Keep route files in `src/app/**` as composition-only wrappers over this feature.
- Import other features only through their public entrypoint (`@/features/<name>`).
- Keep `lib/**` pure: no React, no UI imports, no route imports.
- Keep `server/**` free of UI/component imports.
- Keep shared UI in `src/components/ui/**`; avoid one-off primitives here.
- Keep acceptance coverage in `tests/acceptance/organization-coach-assignments.test.ts`.
- Add acceptance tests for user-visible behavior before merging.
