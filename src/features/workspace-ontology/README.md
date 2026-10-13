# WorkspaceOntology Feature

## Ownership

- Domain logic: `src/features/workspace-ontology/lib/**`
- Personal exploration state: bounded URL parameters
- UI components: `src/features/workspace-ontology/components/**`
- Hooks/controllers: `src/features/workspace-ontology/hooks/**`

## Rules

- Keep route files in `src/app/**` as composition-only wrappers over this feature.
- Import other features only through their public entrypoint (`@/features/<name>`).
- Keep `lib/**` pure: no React, no UI imports, no route imports.
- Keep expansion state personal and URL-backed; legacy persisted state is
  read-only compatibility data.
- Keep primary workspace cards anchored; generated detail lanes adapt around
  them and other fixed canvas obstacles.
- Keep shared UI in `src/components/ui/**`; avoid one-off primitives here.
- Keep acceptance coverage in `tests/acceptance/workspace-ontology.test.ts`.
- Add acceptance tests for user-visible behavior before merging.
