# Brief: Unified App Shell Layout

Status: active
Owner: Caleb
Last updated: 2026-01-18

## Summary

Adopt a unified app shell modeled on the provided large/medium/small screenshots: a fixed, centered, rounded main screen with left and right control rails. The center shell does not move; only its inner content scrolls. This becomes the primary layout for all product pages except / (home), auth, and pricing. The shell is used for public and signed-in views (with auth-aware content), including /community and /news. The admin surface is updated to the new shell and the old admin page can be removed.
See `docs/app-shell.md` for the current shell contract and placement rules.

## Goals

- Unify layout across Accelerator, Community, Marketplace, People, My Organization, Roadmap, News, Modules, Dashboard, and Admin.
- Use one shared app shell component; remove legacy dashboard/accelerator shells.
- Keep existing functionality intact; do not invent new buttons or flows to mimic the reference layout.
- Make the center shell feel like the main screen of a device (Nintendo Switch analogy) with controls on the sides.
- Ensure the center shell expands into any collapsed rail space (no empty gap).
- Provide a consistent top bar for search, notifications, theme, and user actions.
- Preserve accessibility, keyboard support, focus visibility, and zero dead ends.

## Non-goals

- Rebuild marketing home, auth, or pricing pages.
- Redesign core workflows or remove functionality.
- Introduce new features not already present.

## Layout model

Overall structure:

- Root container is full viewport height and width with no document scroll.
- Top bar is fixed and spans the full width above rails and center shell; include a sign-in button when signed out.
- Left rail: global navigation and primary section switching.
- Center shell: fixed rounded container with internal scroll for page content.
- Right rail: contextual tools, filters, metadata, and secondary actions.

Scroll rules:

- Body does not scroll.
- Center shell content scrolls vertically.
- Rails are fixed; if rail content exceeds viewport, rails get their own internal scroll.
- Back and Forward restore center scroll position.

Collapse rules:

- Left and right rails can collapse independently.
- When a rail collapses, the center shell grows into that space and re-centers relative to the remaining rails.
- No persistent blank gutters when a rail is collapsed.

## Top bar

- Left cluster: back navigation, current context title.
- Center cluster: global search (when available for the current context).
- Right cluster: notifications, theme toggle, support/user menu, page-level actions when needed; include sign-in button for public views.
- Avoid duplicating controls already shown in rails; keep actions consistent with existing features.

## Responsive behavior

Large (desktop):

- Left rail and right rail visible.
- Center shell scales with viewport and rails, staying centered.
- Center shell has a large radius and a subtle border/shadow to read as a fixed screen.

Medium (tablet/laptop):

- Left rail collapses to icon or narrow mode by default.
- Right rail collapses to an offcanvas or drawer, opened on demand.
- Center shell expands to fill available space; retains rounded corners.

Small (mobile):

- Center shell becomes nearly full width with reduced outer padding.
- Left rail becomes a drawer; right rail becomes a bottom sheet or drawer.
- Controls remain reachable via top bar and rail toggles.

## Navigation and rail mapping logic

- Left rail is reserved for global navigation and section switching (public and signed-in).
- Right rail holds contextual controls, filters, metadata, and secondary actions.
- If a page has no suitable right-rail content, the right rail stays collapsed by default.
- Do not add new actions; only relocate existing controls and details.

## Page mapping (initial)

Accelerator overview:
- Left rail: Accelerator nav and class list.
- Center shell: overview content, curriculum, roadmap content.
- Right rail: progress summary, next up, coaching schedule CTA if already present.

Modules (class module detail):
- Left rail: class modules list and class nav.
- Center shell: module detail (video, notes, assignment, resources) unchanged.
- Right rail: only if existing module metadata or actions can be surfaced without duplicating content.

Community (/community):
- Left rail: global nav.
- Center shell: community header, map, organization list.
- Right rail: none unless existing filters or actions are present.

Marketplace:
- Left rail: global nav.
- Center shell: marketplace results and cards.
- Right rail: existing marketplace search and category filters.

People:
- Left rail: global nav.
- Center shell: org chart and people table.
- Right rail: existing people filters and actions (search, category filter, create person) when it improves clarity.

My Organization:
- Left rail: global nav and organization section entry points.
- Center shell: org profile card and existing tabs/forms.
- Right rail: contextual actions or summary only if already present.

Roadmap:
- Left rail: global nav.
- Center shell: strategic roadmap editor.
- Right rail: contextual actions if already present.

News:
- Left rail: global nav.
- Center shell: news index and articles.
- Right rail: none unless existing filters or actions are present.

Admin:
- Replace the old admin page with the unified shell.
- Left rail: admin section nav (classes, modules, users, payments, KPIs).
- Center shell: current admin content.
- Right rail: admin filters/actions as currently implemented.

## Accessibility and quality requirements

- Maintain keyboard navigation, visible focus, and correct ARIA semantics.
- Do not use non-semantic elements for navigation.
- Ensure touch targets meet size minimums.
- Keep top bar and rails reachable on mobile without losing context.
- Honor reduced motion and avoid layout-shifting animations.
- Avoid hydration mismatch by keeping client-only state stable.

## Plan

1. Inventory each target page for existing controls, filters, and actions.
2. Define shared shell slots and rail components.
3. Implement the shell in Accelerator as the baseline.
4. Extend to the remaining pages in scope.
5. QA across large, medium, and small layouts with focus and scroll checks.
