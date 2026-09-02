# Public Profiles Feature

This slice owns the global public-handle namespace and the public-only person
profile projection. Profiles remain private until their owner both claims a
handle and explicitly publishes.

## Ownership

- Domain logic: `src/features/public-profiles/lib/**`
- Server actions/queries: `src/features/public-profiles/server/**`
- UI components: `src/features/public-profiles/components/**`

## Rules

- Keep route files in `src/app/**` as composition-only wrappers over this feature.
- Import other features only through their public entrypoint (`@/features/<name>`).
- Keep `lib/**` pure: no React, no UI imports, no route imports.
- Keep `server/**` free of UI/component imports.
- Keep shared UI in `src/components/ui/**`; avoid one-off primitives here.
- Keep acceptance coverage in `tests/acceptance/public-profiles.test.ts`.
- Add acceptance tests for user-visible behavior before merging.

## Current boundary

- Owns handle validation, person handle claims, publication settings, and the
  shared public `/<handle>` route read model and centered profile composition.
- Synchronizes existing organization `public_slug` writes into the global namespace.
- Renders added staff and board records on public organization profiles while
  excluding private contact and social fields.
- Renders published organization programs as Activity using the workspace
  Activity card language.
- Publishes user-selected organization affiliations only after verifying an
  active membership, and removes them when that membership is revoked.
- Owns an allowlisted public activity projection and 365-day profile heatmap;
  current activity is limited to factual affiliation-publication and tracked
  resource-sharing events.
- Creates reusable tracked links only for verified public Find resources and
  safe provider destinations. `/go/<code>` records bounded, deduplicated daily
  opens without IP retention; only aggregate counts reach public profiles.
- Publishes bounded, named collections only from a person's existing private
  Find saves. Collection visibility is explicit; private map preferences are
  never read by public profile routes.
- Does not yet own link management, badges, or broader program participation
  and donation activity events.
