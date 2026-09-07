# Documentation decision canvas

Local implementation in `feat/documentation-marketplace-design-20260904`, continuing the existing Documentation worktree.

The supplied references establish compact rounded widgets, restrained light/dark surfaces, dotted canvases, connected steps, pill controls, and explicit progress. Use that treatment within the existing Documentation system.

## Result

Articles integrate the planner after introductory/stage guidance and before examples and references, without Tool/Overview tabs. The planner occupies the same width as the page hero. A real React Flow canvas replaces the traditional form-step tabs; selecting a node expands it into an editor that fills the existing canvas viewport. Its form body scrolls and remains capped at 672px. Reading content retains its narrow width, and existing guide/tool anchors and step URLs remain usable.

All 14 existing planners share this behavior. Social Media separates audience/purpose, message/content, channels/cadence, ownership/safeguards, and review/export. Message and channel decisions share an audience input and join before safeguards. Other planners preserve their existing section groupings and calculations.

Users may explore any node, mark a step reviewed and continue, return to the canvas, zoom/pan, or use the list view. Reviewed does not mean validated. A changed decision clears its review and downstream reviews. Existing drafts and progress survive reload; export remains available if browser saving fails.

Canvas controls occupy the footer. While a node is expanded, the footer provides Back and review/continue navigation. Opening and collapsing animate from the node within the canvas bounds, respect reduced motion, and restore focus. Mobile keeps readable inputs, touch targets, and a scrollable form body; no full-screen dialog is used.

## Ownership and verification

- Scaffolded `src/features/documentation-decision-canvas` owns node rendering, graph layout, inline editor transitions, footer controls, and review progress.
- `nonprofit-documentation/components/documentation-tool-flow.tsx` owns planner content, editor actions, and URL/history integration.
- Existing planner hooks, draft keys, sanitizers, examples, calculations, and exports remain their owners.
- Keep React Grab enabled on localhost:3010 after visual baseline capture.
- Validate dependency invalidation and malformed storage, all 14 planner edit/export/reload workflows, history and reset confirmations, mobile light/dark layouts, keyboard focus, zoom, and intentional canvas/editor screenshots.
- Local preview only. No commit, push, deployment, provider mutation, or production fixture writes.
