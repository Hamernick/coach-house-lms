# Workspace Operations Ontology

## Outcome

`/workspace` remains compact by default and can progressively reveal a typed,
actionable graph of the organization's programs, accelerator work, roadmap,
calendar, documents, activity, and people. The existing workspace cards remain
the canonical roots. Generated descendants are a projection of existing data,
not a competing data store.

## Architecture

- Keep React Flow ownership in `workspace-canvas-v2/**`.
- Add pure ontology contracts, projection, and deterministic scene layout in
  `src/features/workspace-ontology/**`.
- Keep expansion personal and reversible in bounded `workspace-details` and
  `workspace-groups` URL parameters. Legacy persisted ontology state remains
  readable for compatibility but is no longer written.
- Keep semantic detail level and viewport state personal to the viewer.
- Keep primary workspace cards anchored. Solve only their generated descendant
  lanes around fixed cards, people, and utility controls. Generated nodes use
  fixed depth ranks and never feed solved coordinates back into the next solve.

## Interaction

- Root cards expose a compact branch toggle that names the priority count when
  blocked, missing, or in-progress descendants need attention.
- Do not add a floating global ontology control panel. Root-card branch toggles
  reveal or hide each domain. Do not add node toolbars, pin controls, or a
  duplicate ontology legend.
- Generated nodes sort blocked, missing, in-progress, then complete; show status
  with text and icons; expose visible exact-route actions;
  and allow branch expansion. Clicking a group expands it; clicking a leaf
  opens its exact route/action when one exists or focuses its owning root.
- Graph nodes represent operational entities, not every field or learning-screen
  element. Accelerator branches stop at the lesson/module level; videos,
  resources, assignment questions, and completion controls are summarized by
  their lesson and never become separate cards. Accelerator actions open the
  next unfinished lesson.
- Calendar events are grouped by month, and calendar/activity projections do
  not silently cap records.
- Connections use labeled directional edges. One compact hierarchy label per
  parent and every cross-domain relationship label use opaque, readable labels
  in clear corridors without overlapping cards.
- Narrow screens focus the root or group that changed at a readable zoom rather
  than shrinking the entire graph into an unusable overview.
- Layout and camera changes animate only transforms and opacity for at most
  200ms, remain interruptible, and disable under reduced motion.

## Failure And Recovery

- Scene placement is pure, deterministic, and independent of expansion order.
- Stale async layout results are discarded. Accepted target nodes and
  signatures are committed before transition-only items render, so rapid
  toggles cannot corrupt another branch.
- Invalid URL state is normalized and bounded.
- Empty branches and missing links retain a clear next action.
- Presentation mode and normal browsing permit exploration without shared
  board writes.

## Verification

- Pure tests cover state normalization, projection, dense fixed-rank layout,
  expansion-order invariance, and primary-card position preservation.
- Component tests cover root toggles, selected-node actions, status redundancy,
  and canonical actions.
- Existing workspace persistence, interaction-lock, React Grab, surface, and
  visual guardrails must remain green.
