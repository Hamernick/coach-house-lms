# Workspace Card Layout Standards (Run-and-Gun Safe)

Date: 2026-03-05  
Scope: Workspace board cards (`src/app/(dashboard)/my-organization/_components/workspace-board/**`)

## Goal

Keep rapid card iteration safe by enforcing one layout contract that prevents:
- clipping inside fixed-size cards,
- hidden overflow in narrow widths,
- random dead-space artifacts from ad-hoc flex rules.

## Layout Contract (Required)

1. **Every card body uses `min-w-0` + `min-h-0`.**
2. **Any expanding section uses `flex-1` + `min-h-0`.**
3. **Scrollable regions must declare both axes explicitly:**
   - `overflow-y-auto` (when needed),
   - `overflow-x-hidden` (default for board cards).
4. **User-facing text inside cards must be resilient in narrow widths:**
   - `break-words` + `[overflow-wrap:anywhere]`,
   - add clamp only when intentional.
5. **No one-off inline layout hacks.**
   - Reuse `workspace-board-card-layout-system.ts` tokens.

## Implementation Anchor

- Shared token module:
  - `workspace-board-card-layout-system.ts`
- Required tokens:
  - `flexColumn`
  - `flexFill`
  - `scrollY`
  - `textWrap`

## QA Checklist For Every New/Edited Card

1. `sm` and `md` card sizes show all primary content without horizontal clipping.
2. Long words/labels wrap, never bleed outside card edges.
3. Compact preview mode has intentional vertical distribution (no unexplained dead chin).
4. Scroll behavior is explicit and deterministic.
5. `pnpm eslint` + `pnpm exec tsc -p tsconfig.json --noEmit` pass.
