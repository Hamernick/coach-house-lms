# Iterative Production Release Plan - July 2026 Dirty Tree

Purpose: release the current dirty worktree in clear, reviewable production slices instead of one bulk deploy.

## Current State

- Branch: `main`
- Base: `d288660` / `origin/main`
- GitHub repo: `Hamernick/coach-house-lms`
- Vercel link: `.vercel/project.json` -> project `coachhouse`
- Local Vercel CLI: not installed
- GitHub auth: available through `gh`
- CI gate on `main`: `.github/workflows/ci.yml` runs `pnpm check:quality`
- Local changed paths: about 242 total paths, including tracked and untracked files
- Large-file gate: `pnpm check:large-files` passed
- Local preview server: `localhost:3000/find` returns `200`

Do not push directly from this dirty `main` branch. Use small release branches and PRs, then merge one at a time.

## Release Rules

- One production-visible surface per PR.
- Each PR gets its own release notes, risk notes, test evidence, and rollback notes.
- Merge only after CI passes and the live smoke check for the previous slice is clean.
- Do not apply Supabase migrations or promote resource-map records as a side effect of a UI PR.
- Do not commit generated local engine state under `data/resource-map/.engine`.
- Treat `data/resource-map/community-fridges-chicago-love-fridge-2026-07-02.json` as local source material unless explicitly approved for repo inclusion.

## Proposed Release Order

### PR 1 - App Shell Sidebar Persistence And Performance Instrumentation

Why first: low product-risk shell infrastructure, no database migration, no public data dependency.

Scope:
- `src/components/app-shell/**`
- `src/components/global-search/global-search-triggers.tsx`
- `src/components/ui/sidebar/constants.ts`
- `src/components/app-shell/sidebar-state.ts`
- `src/components/app-shell/sidebar-state-server.ts`
- `src/components/app-shell/components/shell-main-content.tsx`
- `src/lib/performance/server-timing.ts`
- route layouts under `src/app/(accelerator)`, `src/app/(admin)`, `src/app/(dashboard)`, `src/app/(internal)`
- focused app-shell tests

Release notes:
- Persists app sidebar open/closed preference across dashboard/admin/accelerator shells.
- Adds dashboard layout timing instrumentation for slow layout resolution.
- Keeps shell layout behavior consistent across authenticated app areas.

Validation:
- `pnpm exec eslint <touched app-shell/layout files>`
- `./node_modules/.bin/vitest tests/acceptance/app-shell-header-layout.test.ts tests/acceptance/app-shell-navigation-performance.test.ts tests/acceptance/app-shell-sidebar-state.test.ts --run`
- `pnpm build`
- `curl -sI http://localhost:3000/find`

Rollback:
- Revert the PR. No schema or environment rollback.

### PR 2 - Workspace Activity, Program Wizard, And Fiscal Sponsorship Readiness

Why second: authenticated workspace improvements can ship independently of public resource-map work.

Scope:
- `src/actions/programs.ts`
- `src/app/(dashboard)/my-organization/**`
- `src/app/(dashboard)/workspace/page.tsx`
- `src/components/programs/**`
- `src/features/member-workspace/**`
- `src/features/fiscal-sponsorship/**`
- `src/lib/organization/primary-objects.ts`
- focused workspace/program/fiscal tests

Release notes:
- Improves workspace activity/program surfaces and primary-object naming.
- Adds fiscal sponsorship readiness signaling for selected activities.
- Tightens program wizard validation and admin program write permissions.

Validation:
- `pnpm exec eslint <touched workspace/program/fiscal files>`
- `./node_modules/.bin/vitest tests/acceptance/program-wizard-activity-flow.test.ts tests/acceptance/program-wizard-header.test.ts tests/acceptance/program-wizard-media.test.ts tests/acceptance/workspace-fiscal-sponsorship-card.test.ts tests/acceptance/workspace-board-card-frame.test.ts tests/acceptance/workspace-organization-overview-programs.test.ts tests/acceptance/member-workspace-project-detail-page.test.ts tests/acceptance/member-workspace-projects-page.test.ts tests/acceptance/organization-primary-objects.test.ts --run`
- `pnpm build`

Rollback:
- Revert the PR. No schema or environment rollback.

### PR 3 - Resource Map Data Engine, Schema Contract, And Tooling Foundation

Why third: prepares the data and schema contract before shipping the larger public `/find` experience.

Scope:
- `package.json`
- `pnpm-lock.yaml`
- `data/resource-map/.gitignore`
- `data/resource-map/README.md`
- `docs/resource-map-data-engine-runbook.md`
- `docs/resource-map-deep-research-handoff.md`
- `docs/plans/2026-06-25-resource-map-db-review-report.md`
- `docs/plans/2026-06-26-resource-map-ingestion-curation-system.md`
- `scripts/check-next-cache-size.mjs`
- `scripts/clean-next-cache.mjs`
- `scripts/next-cache-utils.mjs`
- `scripts/resource-map/**`
- `src/lib/supabase/schema/**`
- `supabase/migrations/20260625214500_add_resource_map_catalog.sql`
- `supabase/migrations/20260626214500_resource_map_public_read_contract_patch.sql`
- `supabase/migrations/20260626224000_add_public_map_organization_curation_events.sql`
- `supabase/migrations/20260628131000_resource_map_availability_contract.sql`
- `supabase/migrations/20260628150000_resource_map_taxonomy_categories.sql`
- `supabase/migrations/20260628162000_resource_map_data_engine_contract.sql`
- `supabase/migrations/20260705113000_resource_map_remove_emergency_public_labels.sql`
- `supabase/tests/resource-map-rls.mjs`
- data-engine/resource-map contract tests

Release notes:
- Adds resource-map ingestion, validation, dedupe, freshness, import, matching, and promotion tooling.
- Adds local preview docs and schema/migration contracts for the resource catalog.
- Adds cache maintenance scripts for local Next.js development.
- Adds icon/UI dependencies used by later resource-map UI releases.

Validation:
- `pnpm install --frozen-lockfile`
- `node --check scripts/resource-map/lib/data-engine/parsers.mjs`
- `node --check scripts/resource-map/lib/data-engine/taxonomy-classifier.mjs`
- `./node_modules/.bin/vitest tests/acceptance/resource-map-data-engine.test.ts tests/acceptance/resource-map-import-records.test.ts tests/acceptance/resource-map-public-items-query.test.ts tests/acceptance/public-map-resource-catalog-schema.test.ts --run`
- `node supabase/tests/resource-map-rls.mjs`
- `pnpm check:large-files`

Manual gate:
- Do not run `supabase db push` during PR merge.
- After merge, intentionally apply migrations in the target Supabase project only after reviewing `pnpm resource-map:schema-status -- --strict`.

Rollback:
- Revert code PR if tooling/schema types break build.
- If migrations were already applied, use a separate DB rollback plan; do not assume git revert reverts production schema.

### PR 4 - Public `/find` Resource Map UX, API Transport, And Marker System

Why fourth: largest user-visible slice; depends on PR 3 dependencies and resource-map contracts.

Scope:
- `src/app/(public)/find/**`
- `src/app/api/public/resource-map/items/route.ts`
- `src/actions/public-map-organization-curation.ts`
- `src/components/public/public-map-index/**`
- `src/features/find-map/**`
- `src/features/resource-map-admin/**`
- `src/lib/public-map/**`
- `src/lib/queries/public-map-index.ts`
- `src/lib/queries/resource-map-public-items.ts`
- focused `/find`, public-map, marker, sidebar, and public resource tests

Release notes:
- Moves resource items out of initial `/find` HTML and into a cached public JSON endpoint.
- Adds public resource cards/details, category filters, URL state, saved/guides rails, admin curation hooks, and resource detail cleanup.
- Adds the updated marker/cluster sprite system, cooling-center pill markers, community-fridge taxonomy, and link/description sanitization.
- Hides technical/raw source URLs from public detail links and keeps source provenance at the bottom.

Validation:
- `pnpm exec eslint <touched public-map/find files>`
- `./node_modules/.bin/vitest tests/acceptance/public-find-route.test.ts tests/acceptance/public-map-resource-map-items.test.ts tests/acceptance/resource-map-public-items-query.test.ts tests/acceptance/public-map-sidebar-layout.test.ts tests/acceptance/public-map-marker-fallbacks.test.ts tests/acceptance/public-map-cluster-runtime.test.ts tests/acceptance/public-map-webgl-data.test.ts tests/acceptance/public-map-actions.test.ts tests/acceptance/public-map-filter-url-state.test.ts tests/acceptance/public-map-organization-curation.test.ts tests/acceptance/public-map-resource-links.test.ts tests/acceptance/public-map-search-index.test.ts --run`
- `curl -sI http://localhost:3000/find`
- `curl -s http://localhost:3000/api/public/resource-map/items`
- Browser smoke with system Chrome if local Mapbox/WebGL is stable enough.

Manual gate:
- Confirm `RESOURCE_MAP_PUBLIC_DB_ENABLED` production value before merge.
- If false or unset, production will ship the UI shell but not public Supabase resources.
- If true, production must have the PR 3 migrations applied first.

Rollback:
- Revert the PR.
- If API endpoint causes production issues, set `RESOURCE_MAP_PUBLIC_DB_ENABLED=false` while reverting.

### PR 5 - Organization Profile And Public Detail Polish

Why fifth: related visible polish, but separate from the public resource-map core.

Scope:
- `src/components/organization/**`
- `src/components/people/**`
- organization detail/list helper tests

Release notes:
- Polishes organization profile tabs, public sections, people/supporter rendering, and profile-card layout details.

Validation:
- `pnpm exec eslint <touched organization/people files>`
- `./node_modules/.bin/vitest tests/acceptance/public-map-organization-detail-helpers.test.ts tests/acceptance/public-map-organization-detail-sections.test.ts tests/acceptance/public-map-organization-list-react-grab.test.ts --run`
- Manual smoke on `/find/<publicSlug>` for a known organization.

Rollback:
- Revert the PR. No schema rollback.

### PR 6 - Docs And Agent Contract Cleanup

Why last: docs-only cleanup should not block runtime releases unless the team wants the new design contract first.

Scope:
- `docs/design.md`
- `docs/agent/codex-execution-playbook.md`
- `docs/agent/ui-rubric.md`
- `docs/RUNLOG.md`

Release notes:
- Documents the product-specific design source of truth and updates agent workflow expectations.
- Preserves release runlog context.

Validation:
- Markdown/source review.
- `pnpm check:structure` if docs affect guardrails.

Rollback:
- Revert the PR. No runtime rollback.

## First Release Branch Command

Use PR 1 as the first production slice:

```bash
git switch -c release/app-shell-sidebar-state-2026-07-06
git add \
  src/components/app-shell \
  src/components/global-search/global-search-triggers.tsx \
  src/components/ui/sidebar/constants.ts \
  src/app/'(accelerator)'/layout.tsx \
  src/app/'(admin)'/layout.tsx \
  src/app/'(dashboard)'/layout.tsx \
  src/app/'(internal)'/layout.tsx \
  src/lib/performance \
  tests/acceptance/app-shell-header-layout.test.ts \
  tests/acceptance/app-shell-navigation-performance.test.ts \
  tests/acceptance/app-shell-sidebar-state.test.ts
git diff --cached --stat
```

Commit message:

```text
[STEP S75] Ship app shell sidebar persistence
```

PR title:

```text
[STEP S75] Ship app shell sidebar persistence
```

PR summary:

```markdown
## Summary
Ships app shell sidebar persistence and dashboard layout timing instrumentation as the first slice from the larger dirty worktree.

## Release Notes
- User-facing changes: sidebar open/closed state persists across authenticated shells.
- Operational changes: dashboard layout resolution now emits server timing metadata.
- Known risks or follow-ups: none expected outside app shell layout behavior.

## Checks
- [ ] pnpm exec eslint <touched app-shell/layout files>
- [ ] ./node_modules/.bin/vitest tests/acceptance/app-shell-header-layout.test.ts tests/acceptance/app-shell-navigation-performance.test.ts tests/acceptance/app-shell-sidebar-state.test.ts --run
- [ ] pnpm build
- [ ] docs/RUNLOG.md updated

## Manual QA
- [ ] Dashboard loads with sidebar open/closed preference preserved.
- [ ] Admin/internal/accelerator shells still render.
- [ ] `/find` returns 200.

## Rollback
Revert this PR. No DB or environment rollback.
```

## Production Sequence

1. Create PR 1 from the path-scoped branch.
2. Wait for CI green.
3. Merge PR 1.
4. Confirm Vercel production deploy from the merge.
5. Smoke live routes.
6. Append live deploy note to `docs/RUNLOG.md` in the next PR.
7. Repeat for the next slice.

## Open Questions Before PR 3/4

- Confirm whether Vercel production has `RESOURCE_MAP_PUBLIC_DB_ENABLED=true`.
- Confirm whether Supabase migrations should be applied before or after PR 4 merge.
- Decide whether the local Love Fridge source JSON should be committed or kept local-only.
- Decide whether visual baselines should be updated before `/find` UI merge.
