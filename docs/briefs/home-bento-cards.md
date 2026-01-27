# Brief: Home Page Bento Cards (Core Offering)
Status: Draft  
Owner: Codex  
Priority: P1  
Target release: ASAP (launch polish)

---

## Purpose
Rebuild the “What you get” / core offering cards on `/home2` into a true bento layout that:
- Feels intentional and flexible across desktop/tablet/mobile.
- Handles variable text lengths without clipping or awkward whitespace.
- Scales card sizes responsively while keeping a balanced mosaic.

## Scope
- Redesign the PRODUCT_HIGHLIGHTS section on `/home2` into a bento grid.
- Define explicit size tokens (e.g., large/medium/small tiles) with clear span rules.
- Ensure content (icon, eyebrow, title, copy, CTA) fits without overflow; multi-line titles allowed.
- Light/dark support; no gradients.
- Keep Inter/Sora body system; align with public header grid.

Out of scope: creating new marketing content, video hero, or net-new sections.

## Requirements / Constraints
- Tailwind grid with deterministic spans (no dynamic class names that purge).
- Breakpoints:
  - Mobile: single column; consistent spacing; cards auto height.
  - Tablet: 2–3 cols; maintain readable widths.
  - Desktop: 12-col bento with a few hero tiles and small supporting tiles.
- Content safety: titles up to 40 chars; descriptions up to 120 chars; CTA row pinned to bottom.
- Icons inline; no external images required.
- Cards clickable; respect external link targets.

## Proposed Layout (desktop)
- Grid: `md:grid-cols-12` `auto-rows-[minmax(180px,1fr)]`.
- Tile presets:
  - L: col-span-6 row-span-2
  - M: col-span-4 row-span-2
  - S: col-span-2 row-span-2 (tall skinny)
  - XS: col-span-3 row-span-1 (short wide)
- Map PRODUCT_HIGHLIGHTS to presets:
  - Accelerator: L
  - Platform: M
  - Community: S
  - Docs: XS
  - Map: XS

## UX Details
- Padding: 20–22px inside; 18–20px gap.
- Icon pill top-left; text stack beneath; CTA row bottom with subtle arrow.
- Text handling: titles `text-base font-semibold` with `leading-tight`; descriptions `text-sm text-muted-foreground`; clamp description to 3 lines to avoid overflow.
- Hover: subtle lift + shadow; focus-visible ring.
- Alignment: section container aligns to header grid (no auto-centering; use same max width as header).

## Data / Content
- Reuse PRODUCT_HIGHLIGHTS array; add `size` enum instead of raw spans.
- Clamp description: `line-clamp-3`.

## Acceptance Criteria
- Cards align left with header grid on desktop; no right overflow.
- No text clipping at common lengths; line-clamp-3 for descriptions.
- Layout remains balanced at sm/md/lg breakpoints; tiles wrap gracefully.
- Hover/focus states consistent with design system.
- Tests: pnpm lint; pnpm test:snapshots (update if changed); note if acceptance skipped.

## Skills / Tools to use
- `ui-ux-pro-max` for layout tokens and responsive spans.
- `brainstorming` (done) not required further unless scope changes.
- `/rams` for quick UI lint once implemented.

