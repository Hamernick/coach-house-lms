# Workspace Gate 2 Browser Proof

Date: 2026-08-06
Status: Verified locally
Scope: desktop/mobile, light/dark, drawer fullscreen, overflow, reduced motion,
and responsive accessibility
Non-goals: production writes, visual redesign, `/find` UI, Finance UI, commit,
push, merge, or deployment

## Result

Gate 2 browser evidence item 3 passes. The real authenticated `/workspace`
surface was checked at desktop and mobile widths in light and dark themes. The
drawer preserved its `20px` top corners, owned the canvas bounds at fullscreen,
restored its prior height, kept viewport controls visible only outside
fullscreen, and created no document overflow or application errors.

The responsive pass found one app-shell warning: the mobile contextual-details
sheet had a title but no accessible description. `ShellRightRail` now renders a
screen-reader-only `SheetDescription`; its focused source guard passes, and a
fresh desktop-to-mobile reflow produces no new warning or error logs.

## Authenticated Workspace Matrix

| State              | Evidence                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Desktop dark/light | `1792x1008`; both themes rendered with no document overflow                                                              |
| Desktop fullscreen | Canvas and drawer matched `left 241`, `top 57`, `right 1519`, `bottom 991`; `20px` top corners; viewport controls hidden |
| Desktop restored   | People remained selected; content ended at the canvas bottom within `0.52px`; viewport controls returned                 |
| Mobile dark/light  | `500x782`; both themes rendered with no document overflow                                                                |
| Mobile fullscreen  | Canvas and drawer matched `left 20`, `top 56`, `right 480`, `bottom 710`; `20px` top corners; viewport controls hidden   |
| Mobile restored    | People remained selected; content ended at the canvas bottom within `0.52px`; dark theme and prior snap restored         |
| Browser logs       | No new warnings or errors after the responsive accessibility fix                                                         |

## Reduced Motion

The existing React Flow browser fixture passed at `390x844` with
`reducedMotion: "reduce"`. It verifies a readable mobile canvas, viewport zoom
of at least `0.85`, and `0s` node transition duration:

```text
PLAYWRIGHT_BASE_URL=http://localhost:3000 pnpm exec playwright test \
  tests/visual/workspace-ontology.visual.spec.ts \
  --config playwright.visual.config.ts \
  --grep "reduced motion keeps mobile Focus readable"

1 passed
```

No visual baseline changed because this slice intentionally changed no visual
appearance.

## Evidence Boundary

This is authenticated local browser and current-worktree test evidence. In
combination with the focused and guardrail proof, it closes Gate 2. It does not
prove production or a clean release artifact.
