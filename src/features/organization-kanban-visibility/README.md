# Organization Kanban Visibility

Stores each platform staff member's personal hidden-organization list for the
`/organizations` Kanban. Hiding an organization never changes platform access,
coach assignment, or organization authorization. Hidden organizations remain
recoverable through the URL-backed Hidden view.

## Ownership

- Domain logic: `src/features/organization-kanban-visibility/lib/**`
- Server actions/queries: `src/features/organization-kanban-visibility/server/**`
- UI components: `src/features/organization-kanban-visibility/components/**`
- Hooks/controllers: `src/features/organization-kanban-visibility/hooks/**`

## Rules

- Only developer and coach platform staff can persist preferences.
- Staff can read and change only their own preferences.
- Developer access remains all-organizations regardless of this presentation
  preference.
- Hidden rows represent presentation state only; organization and project RLS
  remain authoritative.
- Keep route files in `src/app/**` as composition-only wrappers over this feature.
- Import other features only through their public entrypoint (`@/features/<name>`).
- Keep `lib/**` pure: no React, no UI imports, no route imports.
- Keep `server/**` free of UI/component imports.
- Keep shared UI in `src/components/ui/**`; avoid one-off primitives here.
- Keep acceptance coverage in `tests/acceptance/organization-kanban-visibility.test.ts`.
- Add acceptance tests for user-visible behavior before merging.
