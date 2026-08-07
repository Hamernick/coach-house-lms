# Workspace Gate 2 Browser Proof

Date: 2026-08-06
Status: Candidate visual fixtures and disposable authenticated preview verified
Scope: desktop/mobile, light/dark, drawer fullscreen, overflow, reduced motion,
and responsive accessibility
Non-goals: production writes, visual redesign, `/find` UI, Finance UI, commit,
push, merge, or deployment

## Result

The isolated candidate passes `26/26` visual tests, including desktop/mobile,
light/dark, reduced-motion, workspace ontology, documents, public shell, and
`/find` fixtures. The real authenticated `/workspace` surface also passes
against disposable no-data Supabase project `cilvvwguqkakrpseebii`.

The drawer preserved its `20px` top corners, owned the canvas bounds at
fullscreen, restored its prior height and People tab, kept viewport controls
visible only outside fullscreen, and created no document overflow or
application errors. A real node drag created one board row; a passive reload
left its timestamp unchanged. The temporary user was deleted.

The responsive pass found one app-shell warning: the mobile contextual-details
sheet had a title but no accessible description. `ShellRightRail` now renders a
screen-reader-only `SheetDescription`; its focused source guard passes, and a
fresh desktop-to-mobile reflow produces no new warning or error logs.

## Authenticated Workspace Matrix

| State              | Evidence                                                                                     |
| ------------------ | -------------------------------------------------------------------------------------------- |
| Desktop dark/light | `1440x900`; both themes rendered with zero document overflow                                 |
| Desktop fullscreen | Frame `57,57,1167,883`; drawer within `1.33px`; `20px` top corners; viewport controls hidden |
| Desktop restored   | People remained selected and viewport controls returned                                      |
| Mobile light       | `500x782`; rendered with zero document overflow                                              |
| Mobile fullscreen  | Frame `20,56,480,710`; drawer within `1.05px`; `20px` top corners; viewport controls hidden  |
| Mobile restored    | People remained selected and the prior snap restored                                         |
| Persistence        | Explicit node drag created one board row; passive reload did not change its timestamp        |
| Browser logs       | No page errors or console errors                                                             |

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

The fixture and authenticated evidence prove the isolated candidate against a
disposable Supabase preview. They do not prove production, and no production
write or deployment occurred.
