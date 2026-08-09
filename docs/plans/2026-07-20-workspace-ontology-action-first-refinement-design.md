# Workspace Ontology Action-First Refinement

## Outcome

The workspace ontology should answer “What needs attention, and what can I do
next?” without moving the primary cards users arranged. Exploration is personal,
deep-linkable, reversible, and understandable without a detached toolbar or
legend.

## Considered Approaches

1. Persist expansion in the shared board state. This preserves the current data
   path but lets one person rearrange another person’s view, so it is rejected.
2. Store expansion in local storage. This is personal but cannot be shared,
   restored through browser history, or inspected from the URL, so it is
   rejected.
3. Store expansion in URL parameters. This is personal, shareable, refresh-safe,
   and compatible with Back/Forward. This is the selected approach.

## State

- `workspace-details` stores expanded root IDs.
- `workspace-groups` stores expanded generated group IDs.
- URL parsing is bounded, normalized, and limited to stable identifiers.
- Native history navigation updates exploration without writing workspace board
  state.
- Legacy persisted ontology fields remain readable for schema compatibility but
  no interaction writes to them.

## Layout

- Primary workspace cards always retain their saved coordinates and drag
  behavior.
- Generated details occupy deterministic horizontal lanes to the right of the
  fixed workspace scene.
- Lanes avoid primary cards, people, utilities, and previously placed detail
  branches. Only generated detail nodes move when branches change.
- Layout remains order-independent, bounded, collision-free, interruptible, and
  reduced-motion safe.
- On mobile, opening a branch focuses its first revealed priority action at a
  readable zoom; collapsing returns to the owning parent.

## Information And Interaction

- Sort blocked, missing, in-progress, and complete nodes in that order while
  preserving source order inside each status.
- Root controls show priority counts when blocked or missing descendants exist.
- Generated nodes always display a concise action verb.
- A leaf without a direct workflow names the owning card it will focus; no
  generic “View” action is shown.
- Navigation uses native links. Expansion and in-canvas actions use buttons.
- Titles may occupy two lines; action and status text remain visible without
  hover. Relationship labels use an opaque, higher-contrast 11px treatment.
- Status always uses both icon and text.

## Verification

- Pure tests cover URL parsing/serialization, priority ordering, anchored roots,
  branch collision avoidance, deterministic reopening, and legacy state
  compatibility.
- Browser tests cover native link/button semantics, Back/Forward restoration,
  keyboard operation, mobile focus, long content, light/dark rendering, rapid
  toggles, and zero node/label collisions.
- Final validation uses an authenticated workspace with realistic sparse and
  dense data and a first-time-user task: identify the highest-priority item and
  open its owning workflow without instruction.
