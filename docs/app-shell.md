# App Shell Contract

Purpose: a single, unified layout for all internal and public product surfaces (except `/`, auth, and pricing) with a fixed center shell and left/right control rails. This document is the source of truth for layout behavior, naming, and placement rules.

## Scope

Applies to: `/dashboard`, `/accelerator`, `/community`, `/marketplace`, `/people`, `/roadmap`, `/news`, `/modules`, and all admin routes.
Excludes: `/` (home), auth, and pricing routes.

## Anatomy and naming

- AppShell: top-level layout component. Owns all layout tokens and scroll rules.
- AppShellHeader (Top rail): fixed header spanning full width.
- Left rail (primary nav): global navigation and section switching.
- Center shell (main screen): fixed rounded container; only the inner content scrolls.
- Right rail (context rail): filters, selectors, secondary actions, and context metadata.

Slot/portal components:

- HeaderTitlePortal: injects the page title into the top rail.
- HeaderActionsPortal: injects page actions into the top rail (only global or page-level actions).
- RightRailSlot: injects contextual content into the right rail.

## Layout and scroll rules (MUST)

- Single scroll surface: only the center shell content (`data-shell-scroll`) scrolls.
- Rails and top rail are fixed; no page-level scroll outside the center shell.
- No nested shells or nested "card within card" containers.
- Center shell is always rounded, bordered, and visually distinct from rails.
- When rails collapse/expand, the center shell grows into freed space (no dead gaps).
- Keep a consistent viewport gutter via `--shell-gutter` (see tokens).
- When the right rail is absent, the center shell still keeps the outer gutter.

## Tokens and sizing (MUST)

Use tokens defined by AppShell instead of ad-hoc sizes:

- `--shell-header`: top rail height.
- `--shell-gutter`: outer gap between viewport/rails and the center shell.
- `--shell-rail-padding`: horizontal padding inside left/right rails.
- `--shell-rail-item-padding`: internal padding for rail labels and buttons.
- `--shell-rail-gap`: vertical gap between rail sections.
- `--shell-max-w`: max width for center shell content (expands when left rail collapses).
- `--sidebar-width` and `--sidebar-width-icon`: rail widths for expanded/collapsed.
- `--shell-border`: border color for the center shell.

## Placement rules (MUST)

Top rail:

- Brand, back, breadcrumbs, global search, notifications, theme, account/sign-in, rail toggles.
- Page actions only if they are truly global (use HeaderActionsPortal).

Left rail:

- Primary navigation and section switching only.
- No page-specific filters or selectors.

Right rail:

- Page-specific tools, filters, selectors, module lists, secondary actions.
- Use RightRailSlot with priority ordering if multiple panels are needed.

Center shell:

- Primary content only (no duplicated nav or control rails).
- Loading/empty/error states must render here.

## Responsive behavior (MUST)

Desktop:

- Both rails are visible when expanded.
- Center shell remains centered within available space.

Medium:

- Left rail can collapse to icon mode.
- Right rail stays inline when available; toggle is in the top rail.

Mobile:

- Left/right rails become sheets or drawers.
- Center shell fills width minus `--shell-gutter`.
- Maintain safe-area padding and prevent horizontal overflow.

## Page mapping (MUST/SHOULD)

Use this placement model for each surface:

- Accelerator overview: center = overview + curriculum; right rail = track selector + module list + next/back.
- Module detail: center = module content; right rail = module list + next/back.
- Community: center = map + org list; right rail = filters/search.
- Marketplace: center = results; right rail = filters.
- People: center = list/graph; right rail = filters/sorting.
- Roadmap: center = editor; right rail = section list/toggles.
- News: center = article list or article; right rail = categories/related.
- Admin: center = tables/forms; right rail = filters/details.

Public pages:

- Keep the same shell layout.
- Show a sign-in button in the top rail.
- Hide account-only actions and global search if unavailable.

## Hardening and edge cases (MUST/SHOULD)

- Long labels: use `min-w-0` + `truncate` on nav, header, and rail content.
- Empty right rail: render nothing and let the rail collapse automatically.
- Ensure all buttons have accessible labels; icon-only controls must have `aria-label`.
- Avoid layout shifts by keeping skeletons aligned to final content.
- Honor `prefers-reduced-motion` for rail animations and transitions.

## Do not

- Do not move page-specific filters into the left rail.
- Do not add a second scrolling container inside the center shell.
- Do not add extra "shell card" wrappers inside the center shell.
- Do not bypass HeaderTitlePortal/HeaderActionsPortal/RightRailSlot for layout-critical elements.
