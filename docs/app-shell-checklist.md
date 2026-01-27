# App Shell QA Checklist

Use this for every page that renders inside the unified shell.

## Structure

- [ ] Page renders inside AppShell (no nested shells).
- [ ] Only `data-shell-scroll` scrolls; body and rails are fixed.
- [ ] Center shell has rounded border and is visually distinct.
- [ ] HeaderTitlePortal and HeaderActionsPortal are used for header content.
- [ ] RightRailSlot is used for context tools (no ad-hoc right panels).

## Rails and alignment

- [ ] Left rail collapses without leaving a gap; center shell expands into space.
- [ ] Right rail toggles open/closed without layout jitter.
- [ ] Header rail toggles align with the center shell edges.
- [ ] Rails and top bar share the same background surface (no stray borders).
- [ ] `--shell-gutter` spacing is consistent on both sides.

## Responsive

- [ ] Mobile: left/right rails become sheets; center shell keeps gutter.
- [ ] Medium: left rail can collapse to icon; right rail stays inline when present.
- [ ] No horizontal overflow at any breakpoint.
- [ ] Safe areas respected (`env(safe-area-inset-*)`).

## Content states

- [ ] Loading state uses skeletons that mirror final layout.
- [ ] Empty state includes a recovery action (no dead ends).
- [ ] Error state shows inline error + optional toast.
- [ ] Long text is truncated and does not break rail widths.

## Accessibility and interaction

- [ ] All icon-only buttons have `aria-label`.
- [ ] Focus rings visible (`:focus-visible`).
- [ ] Hit targets >= 24px (>= 44px on mobile).
- [ ] Reduced-motion mode is respected for rail animations.

## Performance

- [ ] No extra re-render loops from rail content.
- [ ] Large lists in rails are virtualized if > 50 items.
- [ ] Images above the fold are preloaded and sized to prevent CLS.

