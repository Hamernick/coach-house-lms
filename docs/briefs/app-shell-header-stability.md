# App Shell Header Stability
Status: Draft
Owner: Caleb
Priority: P0
Target release: ASAP

---

## Purpose
- Stop mobile header changes from breaking desktop layout and vice versa.
- Make the header/rails layout predictable, aligned, and smooth for launch-critical navigation.

## Current State
- Header uses container queries + CSS variable rail widths; small layout tweaks can collapse desktop into mobile layout.
- Breadcrumbs and right-side actions can overlap on mobile; desktop alignment can drift when rails open/close.
- Sidebar collapse animation is asymmetric (close feels clunky compared to open).
- Hydration mismatch warnings appear in dev after hot reload when header classes change (server/client HTML diverges).

## Scope
In scope:
- Refactor header layout to use explicit breakpoints (md) instead of container-query decisions.
- Separate mobile vs desktop header structure (md:hidden / md:flex) to avoid layout cross-talk.
- Align header logo, sidebar menu items, and footer items on a shared vertical axis in collapsed state.
- Ensure breadcrumbs truncate only on mobile and never overlap right-side actions.
- Smooth collapse/expand animation to use consistent easing and timing.

Out of scope:
- Redesign of sidebar navigation content or IA.
- Changes to global search logic or notifications behavior.
- Major new design system tokens.

## UX Flow
- Entry points: any dashboard page header.
- Primary user path: user navigates pages on desktop and mobile; toggles left/right rails.
- Secondary paths: uses global search, tutorial button, notifications, theme toggle.
- Empty / loading / error states: no special states required.

## UI Requirements
- Screens or components affected: AppShellHeader, header portals, breadcrumbs, sidebar container.
- Design patterns to follow: current app shell layout, shadcn/ui button styling.
- Copy updates: none.

## Data & Architecture
- Tables / fields touched: none.
- RLS / permissions: none.
- Server actions / routes: none.
- Caching / ISR / no-store: no changes.

## Integrations
- Stripe / Supabase / external APIs: none.
- Webhooks or background jobs: none.

## Security & Privacy
- Sensitive data handling: none.
- Sanitization / validation: none.
- Logging and audit notes: none.

## Performance
- LCP or heavy components: avoid extra layout thrash; use CSS only.
- Lazy loading needs: none.

## Accessibility
- Key checks (labels, focus, keyboard, reduced motion): maintain aria labels on toggles; focus rings remain visible; respect prefers-reduced-motion for transitions.

## Analytics & Tracking
- Events to track: none.
- KPIs impacted: navigation friction, layout stability.

## Edge Cases
- Right rail open while left rail collapsed.
- Long breadcrumb labels and multi-segment breadcrumbs on narrow screens.
- Mobile with notches/safe-area insets.
- No user (public header) vs authed header.

## Migration / Backfill
- Required data updates: none.

## Acceptance Criteria
- Desktop header remains stable regardless of rail state (no unintended mobile layout).
- Mobile header never overlaps breadcrumbs and action icons.
- Breadcrumbs are left-aligned and truncate only on mobile.
- Left rail items and logo are vertically aligned on the same axis in collapsed state.
- Sidebar collapse/expand animation is smooth and consistent in both directions.
- No hydration mismatch warnings after clean reload (excluding extensions).

## Test Plan
- Unit tests: none.
- Integration tests: none.
- RLS tests: none.
- Manual QA path:
  - Desktop: toggle left rail open/closed with right rail open/closed; verify alignment and animation.
  - Mobile: check header alignment, breadcrumb truncation, safe-area padding, and action buttons.
  - Mixed: navigate between pages with long breadcrumb labels.

## Rollout Plan
- Feature flags: none.
- Deploy steps: merge to main; verify in staging.
- Rollback plan: revert header refactor commit.

## Dependencies
- None.

## Open Questions
- Should the header center slot (search) appear on mobile or remain right-slot only?
- Do we want a fixed header height across all contexts, or allow taller header on certain pages?

## Moonshot
- Create a shared layout spec with tokenized rail/header spacing to prevent future drift.
