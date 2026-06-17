# Workspace Node Frame Contract

This contract defines the visual and ownership pattern for cards rendered as nodes on the Organization Workspace React Flow canvas.

The goal is to make workspace nodes easy for an engineer or AI agent to identify, modify, and extend without guessing whether the correct owner is a shared primitive, a React Flow node wrapper, or feature content.

## Current Transitional State

The workspace canvas currently has mixed node shells:

- Generic workspace nodes use `WorkspaceBoardCardFrame`, built from `Frame`, `FramePanel`, `FrameHeader`, `FrameBody`, and optional `FrameFooter`.
- `accelerator` uses a card-style shell in `WorkspaceBoardAcceleratorCard`.
- `fiscal-sponsorship` uses a card-style shell in `FiscalSponsorshipPanel` when rendered as `surface="workspace-card"`.
- `organization-overview` uses a card-style shell in `WorkspaceBoardOrganizationCardShell`.

This mixed state is allowed only as a transition. Do not add new one-off canvas node shells.

## Target Pattern

The target product-level abstraction is `WorkspaceNodeFrame`.

`WorkspaceNodeFrame` should use lower-level UI primitives internally, but it owns the canvas node visual convention:

```tsx
<WorkspaceNodeFrame cardId="organization-overview" title="Organization">
  <WorkspaceNodeFrame.Body>
    <OrganizationOverviewBody />
  </WorkspaceNodeFrame.Body>
  <WorkspaceNodeFrame.Footer>
    <WorkspaceNodeProgress />
  </WorkspaceNodeFrame.Footer>
</WorkspaceNodeFrame>
```

Required anatomy:

- **Root shell:** muted rounded workspace node surface.
- **Header:** title, status/meta, and header-only actions.
- **Body:** primary card content inside the inset content surface.
- **Footer:** progress, summaries, and primary/secondary action buttons.

The title belongs in the header. Primary content belongs in the body. Progress and action rows belong in the footer unless they are truly header metadata.

## Spacing Rules

- The workspace node root owns the outer card rhythm.
- The body content should sit in an inset panel.
- Header, body, and footer gaps must be visually balanced.
- If a node has no footer, the bottom gutter must still intentionally balance the shell.
- Do not leave a no-footer node with a collapsed bottom gap just because `CardContent` or `FrameBody` defaults to `pb-0`.
- Child radius must be less than or equal to parent radius.
- Avoid nested floating card stacks. Use the inset body panel for the main content surface.

## React Flow Boundary

React Flow owns canvas behavior:

- node and edge state
- positions and layout reconciliation
- drag behavior
- selection/connectability
- handles
- viewport commands
- node measurement and `useUpdateNodeInternals`

The workspace node shell owns visual structure only:

- root shell chrome
- header/body/footer anatomy
- internal spacing
- drag-handle class placement
- `nodrag` / `nopan` boundaries around interactive content

Do not move React Flow state, edge logic, handle IDs, viewport commands, or node persistence into the visual shell.

## React Flow Practices To Preserve

- Keep `nodeTypes` and `edgeTypes` stable, outside render or memoized.
- Keep custom node components memoized when they receive React Flow node props.
- Keep handles rendered through React Flow `Handle` components.
- Keep handles outside clipped or scrollable content.
- Use `.workspace-card-drag-handle` for draggable card regions.
- Use `nodrag` and `nopan` on buttons, menus, inputs, drawers, and other interactive regions inside a node.
- Use `nowheel` on scrollable regions that should not zoom the canvas.
- When dynamic node content changes size, keep the `useUpdateNodeInternals` sync path intact.

Reference docs:

- React Flow custom nodes: https://reactflow.dev/learn/customization/custom-nodes
- React Flow handles: https://reactflow.dev/learn/customization/handles
- React Flow performance: https://reactflow.dev/learn/advanced-use/performance
- React Flow utility classes: https://reactflow.dev/learn/customization/utility-classes

## Ownership Rules

When changing a workspace canvas node:

1. Identify the React Flow wrapper first.
2. Identify the workspace node shell.
3. Identify the feature body/footer owner.
4. Patch the highest valid owner.

Examples:

- Node position persistence belongs to workspace board state/persistence, not the visual shell.
- Handles and connections belong to the React Flow node wrapper and connection helpers, not feature body content.
- Header/body/footer spacing belongs to the workspace node shell.
- Checklist row, document row, or fiscal step behavior belongs to the feature component that renders that content.

## Anti-Patterns

Do not:

- Create a new one-off canvas node shell by importing `Card` or raw `Frame` directly into a feature component.
- Put the title in the body because it is easier to align.
- Put footer actions in the body because the footer is missing.
- Fix a React Flow drag/edge/persistence bug by changing card padding.
- Fix a visual shell bug by changing React Flow node state.
- Apply `overflow-hidden` to a shell if it clips handles, focus rings, or callout surfaces.
- Add broad `transition-all` or layout animations to node shell dimensions.
- Edit shared UI primitives when the bug belongs to a workspace-node owner.

## Migration Order

Migrate existing nodes only in small visual-neutral slices:

1. `organization-overview`
2. `accelerator`
3. `fiscal-sponsorship`
4. generic `WorkspaceBoardCardFrame` nodes

Each migration must preserve:

- current canvas node dimensions
- React Flow handles
- drag-handle behavior
- `nodrag` / `nopan` behavior
- visible content ordering
- existing focused acceptance tests

## Guardrail Expectations

Tests should enforce:

- header renders before body
- body renders before footer when footer exists
- no-footer body spacing remains intentional
- React Flow handles stay outside visual card content
- visual shells do not import React Flow state APIs
- feature body components do not own workspace shell chrome
