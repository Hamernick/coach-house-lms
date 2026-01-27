# Accelerator Shell Polish
Status: In Progress
Owner: Caleb
Priority: P0
Target release: Launch

---

## Skills
- brainstorming
- design-guidelines
- vercel-react-best-practices

## Purpose
- Make Accelerator navigation feel coherent and scalable: one Track selector, consistent toggles, and a focused module header.
- Remove UI drift that slows down iteration and undermines launch polish.

## Current State
- Track selector appears in both the Accelerator overview rail and the Accelerator right rail, but they are not synced.
- Sidebar toggle and right-rail toggle use different visual treatments.
- Module pages show a centered title/stepper in content instead of a structured header.

## Scope
In scope:
- Sync Track selection via URL param across Accelerator overview + right rail.
- Align Track selector styling (icon variant).
- Unify sidebar/right-rail toggle button styles.
- Add a module subheader slot in the app shell and move module stepper + title/subtitle into a left-aligned header treatment.

Out of scope:
- Full app shell refactor or design system rebuild.
- New module content or curriculum changes.

## UX Flow
- Entry points: `/accelerator`, `/accelerator/class/*/module/*`.
- Primary user path: pick Track → view modules → open module → stepper in header.
- Secondary paths: right-rail Track change, prev/next stepper controls.
- Empty / loading / error states: preserve existing patterns and skeletons.

## UI Requirements
- Screens or components affected:
  - `src/components/app-shell.tsx`
  - `src/components/app-sidebar/classes-section.tsx`
  - `src/components/accelerator/start-building-pager.tsx`
  - `src/components/training/module-detail.tsx`
  - `src/components/training/module-detail/module-stepper.tsx`
  - `src/components/training/module-detail/module-header.tsx`
- Design patterns to follow: shadcn shell, left-aligned header copy, consistent icon buttons.
- Copy updates: none.

## Data & Architecture
- Tables / fields touched: none.
- RLS / permissions: none.
- Server actions / routes: none.
- Caching / ISR / no-store: unchanged.

## Integrations
- Stripe / Supabase / external APIs: none.
- Webhooks or background jobs: none.

## Security & Privacy
- Sensitive data handling: none.
- Sanitization / validation: none.
- Logging and audit notes: none.

## Performance
- Keep stepper rendering in a single component; avoid duplicate mounts.
- No new heavy client dependencies.

## Accessibility
- Icon-only buttons keep `aria-label`.
- Focus rings remain visible with consistent sizing.
- Header stepper must be keyboard navigable.

## Analytics & Tracking
- No new tracking.

## Edge Cases
- Missing or invalid `track` query param falls back to active route class or first available.
- No published classes: Track selector hides as today.
- Narrow screens: stepper horizontally scrolls without clipping.

## Migration / Backfill
- None.

## Acceptance Criteria
- Track selectors stay in sync across overview + right rail using `?track=`.
- Track selector uses icon variant in both locations.
- Sidebar + right-rail toggle buttons look identical.
- Module pages show title/subtitle and stepper in the header; centered title in content is removed.

## Test Plan
- Unit tests: n/a.
- Integration tests: n/a.
- RLS tests: n/a.
- Manual QA path:
  - Open `/accelerator`; change Track in rail, confirm grid updates.
  - Open `/accelerator`; change Track in overview; confirm rail selector updates.
  - Open module page; verify header title/subtitle + stepper present, body title removed.
  - Verify toggle buttons match visually.

## Rollout Plan
- Feature flags: none.
- Deploy steps: standard.
- Rollback plan: revert brief changes.

## Dependencies
- None.

## Open Questions
- None.

## Moonshot
- Modularize app shell into composable layout primitives after launch.
