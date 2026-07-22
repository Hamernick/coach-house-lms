# Organization coach assignments

Internal tooling for assigning any number of coach-level platform staff members
to an organization. Developers manage assignments; coaches can read them.
Assigned-only access can restrict coaches to organizations in their assignment
set, while developers always retain access to every organization.

The Organizations assignment operations bar reports covered organizations and
total coach assignments separately. It supports an atomic assign-every-coach
operation and filters all related organization projects by coach or unassigned
state. Its `coach` query parameter remains compatible with the existing project
filters and view options.

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
