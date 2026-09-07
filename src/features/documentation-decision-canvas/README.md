# Documentation decision canvas

Shared React Flow navigation for the 14 Documentation planners. Each node expands into its existing planner section inside the canvas viewport. The canvas is embedded in its article between introductory guidance and examples, with no Tool/Overview tabs. It uses the hero width, and editor content stays capped at 672px.

- Public UI: `DocumentationDecisionCanvasPanel`.
- Public controller: `useDocumentationDecisionCanvasController`.
- Steps can declare earlier dependencies. Omitted dependencies form a sequence. Social Media branches from audience into message and channels, then joins at safeguards.
- Dependencies show planning order, not automated validation, eligibility, or locked steps. Any node remains editable.
- Reviewed status is an explicit user action. Editing a node clears its review and downstream reviews; unrelated branches remain reviewed.
- Progress stores only step IDs and a draft change marker in browser storage, scoped to the planner route. Planner hooks still own the actual draft, sanitization, calculations, reset, and exports. Storage failure leaves editing and export available.
- Desktop fits the graph. Mobile uses readable vertical nodes with pan/zoom, a guided next-step action, and an accessible list view.
- Zoom, fit, and list controls live in the canvas footer. During editing, that footer holds Back and review/continue actions; only the form body scrolls within the viewport.
- Opening and collapsing an editor animates from the selected node. Reduced motion removes the transition. Collapse restores focus to the node or footer action, and Escape leaves an open select menu before collapsing the editor.
- Nodes reuse WorkspaceNodeFrame root/surface and shadcn Buttons. The inline editor and footer link to the canvas owner through React Grab metadata; no dialog or portal wraps the form.
- No server actions, new packages, migrations, provider calls, or generated advice.

Behavior coverage: `tests/acceptance/documentation-decision-canvas.test.ts`.
Browser coverage: `tests/visual/documentation-decision-canvas.visual.spec.ts` and `documentation-planners.visual.spec.ts`.
