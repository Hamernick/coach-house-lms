# Roadmap Section Routing
Status: In Progress
Owner: Caleb
Priority: P1
Target release: 2026-01-26

---

## Purpose
- Persist the selected roadmap section in the URL so refreshes and shares stay on the same section.

## Current State
- Roadmap section list uses buttons only; selection does not update the route.
- `/accelerator/roadmap` has no slug route, so section URLs are missing there.

## Scope
In scope:
- Update the roadmap TOC to use links for section navigation.
- Add `/accelerator/roadmap/[slug]` route to load the selected section on refresh.

Out of scope:
- Redesign the TOC UI.
- New data models or roadmap content changes.

## UX Flow
- Entry points: Roadmap TOC in `/roadmap` and `/accelerator/roadmap`.
- Primary user path: click a section -> URL updates -> refresh keeps section.
- Empty / loading / error states: unchanged.

## UI Requirements
- Screens or components affected: Roadmap TOC list, roadmap section page route.
- Design patterns to follow: existing roadmap TOC styles.
- Copy updates: none.

## Data & Architecture
- Tables / fields touched: none.
- RLS / permissions: unchanged.
- Server actions / routes: add a slug route under `/accelerator/roadmap`.
- Caching / ISR / no-store: unchanged (dynamic route).

## Integrations
- Stripe / Supabase / external APIs: none.

## Security & Privacy
- Sensitive data handling: unchanged.
- Sanitization / validation: unchanged.
- Logging and audit notes: none.

## Performance
- LCP or heavy components: no change.
- Lazy loading needs: none.

## Accessibility
- Key checks (labels, focus, keyboard, reduced motion): links remain keyboard accessible.

## Analytics & Tracking
- Events to track: none.
- KPIs impacted: none.

## Edge Cases
- Slug not found should fall back to the first section.

## Migration / Backfill
- Required data updates: none.

## Acceptance Criteria
- Clicking a roadmap section updates the URL to include the slug.
- Refreshing the page keeps the same section selected.
- `/accelerator/roadmap/<slug>` renders the selected section.

## Test Plan
- Unit tests: none.
- Integration tests: navigate in roadmap TOC and refresh.
- RLS tests: none.
- Manual QA path: `/roadmap` and `/accelerator/roadmap` section clicks + refresh.

## Rollout Plan
- Feature flags: none.
- Deploy steps: standard.
- Rollback plan: revert TOC link changes and remove slug route.

## Dependencies
- None.

## Open Questions
- None.

## Moonshot
- Persist TOC scroll position across sessions.
