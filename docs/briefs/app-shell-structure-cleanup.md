# App Shell Structure Cleanup (My Organization + Accelerator + Modules)
Status: Draft
Owner:
Priority: P0
Target release:

---

## Purpose
- Remove the deprecated `/dashboard` route and related legacy UI.
- Reduce duplicate/overlapping implementations in the app shell and sidebar.
- Enforce DRY + separation of concerns for My Organization, Accelerator, and module pages.
- Establish a cleaner file tree so new shell layout work is straightforward.

## Current State
- `/dashboard` route still exists and multiple components/actions reference `(dashboard)` paths.
- There are duplicate sidebar implementations (`src/components/ui/sidebar.tsx` vs `src/components/ui/sidebar/`).
- Some components are large and mix UI, data, and page-level orchestration.
- Module pages reuse code via exports but depend on `(dashboard)` paths.

## Scope
In scope:
- Hard remove `/dashboard` page and any dedicated dashboard-only components/routes.
- Consolidate sidebar/app-shell components into a single canonical module.
- Update imports to use the canonical sidebar layout.
- Normalize shell layout tokens and spacing so nav aligns to the header top.
- DRY module page surfaces to use shared components.

Out of scope:
- Visual redesign of app shell.
- New dashboard replacement.
- Feature changes to My Organization, Accelerator, or module content.

## UX Flow
- Entry points: `/my-organization`, `/accelerator`, module pages.
- Primary user path: navigate from left nav into organization and accelerator content.
- Secondary paths: admin and resources sections.
- Empty / loading / error states: unchanged in this cleanup.

## UI Requirements
- Screens or components affected: app shell, sidebar, nav items, accelerator/module pages.
- Design patterns to follow: existing shadcn dashboard shell, current tokens, no new UI language.
- Copy updates: remove "Dashboard" references where deprecated.

## Data & Architecture
- Tables / fields touched: none expected.
- RLS / permissions: unchanged.
- Server actions / routes: adjust imports and remove dashboard-only routes if unused.
- Caching / ISR / no-store: unchanged.

## Integrations
- Stripe / Supabase / external APIs: unchanged.
- Webhooks or background jobs: unchanged.

## Security & Privacy
- Sensitive data handling: unchanged.
- Sanitization / validation: unchanged.
- Logging and audit notes: ensure no removed routes are referenced in logs.

## Performance
- Reduce bundle size and hydration by removing unused dashboard components.
- Consolidate sidebar module to prevent duplicate code paths.

## Accessibility
- Maintain existing focus, keyboard, and ARIA behavior.

## Analytics & Tracking
- Remove or update any tracking that targets `/dashboard`.

## Edge Cases
- Links/bookmarks to `/dashboard` should be removed; no redirect needed per decision.

## Migration / Backfill
- None.

## Acceptance Criteria
- `/dashboard` route is removed and no longer referenced.
- App shell uses a single sidebar implementation.
- My Organization, Accelerator, and module pages continue to render with no visual regressions.
- No unresolved imports from `(dashboard)` paths after cleanup.

## Test Plan
- Unit tests: none added.
- Integration tests: existing snapshots as applicable.
- RLS tests: not required.
- Manual QA path: navigate `/my-organization`, `/accelerator`, module page; verify sidebar alignment.

## Rollout Plan
- Feature flags: none.
- Deploy steps: standard.
- Rollback plan: revert to previous commit.

## Dependencies
- None.

## Open Questions
- Which module route should be considered canonical long-term?
- Should `(dashboard)` group be renamed after cleanup?

## Moonshot
- Full shell refactor into smaller layout primitives with stricter boundaries.
