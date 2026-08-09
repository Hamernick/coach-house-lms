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
- Keep Focus as the default: one active root, one canonical group path, three
  prioritized actions, and compact `more` and completed rollups.
- Keep Map free of Focus summaries and dimming without repeating content owned
  by primary cards.
- Mark granular nodes already represented on a primary card as
  `source-card-only`; exclude them and their descendants from every ontology
  projection.
- Preserve source hierarchy. Accelerator lessons belong to phases and recent
  operational activity is capped at three newest records.
- Keep primary workspace cards anchored; generated detail lanes adapt around
  them and other fixed canvas obstacles.
- Keep one horizontal coordinate per semantic depth within each root.
- Keep shared UI in `src/components/ui/**`; avoid one-off primitives here.
- Keep focused acceptance coverage in
  `tests/acceptance/workspace-ontology-guided-focus.test.ts` and integration
  coverage in `tests/acceptance/workspace-ontology.test.ts`.
- Add acceptance tests for user-visible behavior before merging.
