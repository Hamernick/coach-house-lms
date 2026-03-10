# Organization Workspace Board — Phased Delivery Contract (v2)

## Source Brief (Condensed)

This plan implements the user brief for a minimal, high-agency organization planning board with:

- card-based editable canvas (drag/drop + auto layout + size controls),
- corrected semantic card relationships,
- dedicated calendar + communications work surfaces,
- realtime collaboration (cursors + presence),
- temporary time-boxed collaboration invites,
- clean navigation for building and presenting to board members,
- strict non-breaking integration into existing `/organization` flows.

## Current Baseline

Implemented and active now:

- table-backed persistence (`organization_workspace_boards`, `organization_workspace_invites`) with RLS,
- workspace canvas with presets + auto layout + save,
- economic engine card copy (replacing funding-mix framing),
- calendar and communications card shells,
- realtime cursor + presence stack,
- temporary invite duration controls.

## Gaps To Close (Ordered)

1. Clean route surfaces for workspace and board presentation.
2. Presentation-mode UX (read-only by design even for editors during board presentations).
3. Card-level UX refinements for presentation/interaction parity.
4. Communications and calendar behaviors from shell -> production capability.
5. Invite/presence governance polish and handoff docs.

## Canonical Navigation + Presentation Surfaces

Primary workspace (interactive):

- `/organization/workspace`

Board presentation mode (read-only focus):

- `/organization/workspace/present`

Backward-compatible entry points kept:

- `/organization?view=workspace`
- `/organization?view=workspace&mode=present`

## Role + Capability Matrix

- `owner/admin/staff`
  - view workspace, edit layout, save layout, create/revoke temp invites, present mode.
- `board`
  - view workspace, create/revoke temp invites, present mode, no layout editing.
- `member`
  - view workspace, present mode, no layout editing/invite management.

## Delivery Phases

### Phase 1 — Navigation + Presentation Foundation (Current)

- Add canonical workspace and presentation routes.
- Add presentation mode into seed/view/canvas pipeline.
- Preserve backward compatibility for existing query-param routes.
- Add explicit UI pathways:
  - Dashboard -> Workspace
  - Dashboard -> Present to board
  - Editor -> Workspace
  - Workspace -> Presentation toggle

### Phase 2 — Workspace Card UX + Layout Fidelity

- Tighten visual consistency for card internals in both edit and presentation modes.
- Add explicit “board-ready” card density/spacing variants.
- Ensure card controls are context-aware (edit vs present).

#### Phase 2 Progress (2026-02-23)

- Added shared presentation-mode density tuning in `WorkspaceBoardCardFrame`:
  - tighter header/content spacing,
  - slightly denser title/subtitle typography,
  - preserves existing presentation-mode control restrictions and navigation behavior.
- Updated `WorkspaceBoardNode` presentation rendering to reduce editor affordances/noise:
  - hides visible React Flow connection handles in presentation mode (while keeping edge anchors intact),
  - suppresses inline coaching copy and internal continuation CTA in presentation mode,
  - tightens card icon badge density.
- Updated `WorkspaceBoardCanvas` presentation chrome:
  - removed editor grid background in presentation mode,
  - softened edge styling for board-facing readability,
  - added calmer presentation backdrop and slightly increased `fitView` padding.
- Updated `WorkspaceBoardToolbar` presentation mode chrome:
  - distinct board-presentation labeling,
  - reduced operator-only clutter (avatar hidden),
  - clearer return CTA (`Edit workspace`).
- Added explicit presentation-mode summary variants for high-interaction cards:
  - `WorkspaceBoardCalendarCard` now renders a board-facing event/month/upcoming summary instead of disabled edit controls.
  - `WorkspaceBoardCommunicationsCard` now renders a board-facing draft/channel/heatmap summary instead of disabled composer controls.
- Follow-up summary parity tweaks:
  - restored calendar month navigation in the presentation summary,
  - added communications heatmap legend in the presentation summary for board readability.
- Updated `WorkspaceBoardCollaboration` presentation indicator:
  - replaced avatar-stack-heavy chrome with a compact board-facing presence/status chip in presentation mode,
  - preserved full collaborator avatar stack in interactive workspace mode.
- Updated `RealtimeCursors` presentation behavior:
  - keeps live cursor presence active,
  - hides the cursor connection-status banner in presentation mode to reduce operator/debug chrome on the board surface.
- Workspace surface UX refactor pass:
  - removed the redundant workspace intro header strip so the board canvas occupies the full dashboard content area,
  - added explicit dashboard quick actions (`Open workspace`, `Open shared workspace`) and renamed lingering “Present to board” CTAs to shared-workspace language,
  - moved workspace controls/navigation into the right rail (mode switch, layout controls, invites, save, back-to-dashboard),
  - added a React Flow dot grid plus drag tuning (`snapToGrid`, visible-only rendering, drag threshold) for smoother interaction,
  - fixed card clipping by aligning React Flow node dimensions with rendered card sizes and rebalanced preset spacing to keep the organization card more central,
  - replaced dual size icon toggles with a single `Size` popover and added in-canvas fullscreen card overlays (close in place, no route navigation).
- React Flow interaction hardening follow-up:
  - switched cards to header-handle dragging (`dragHandle`) so in-card controls/forms do not compete with canvas dragging,
  - marked card controls/content as `nodrag`/`nopan` regions for smoother input interaction,
  - memoized workspace node/card renderers and added `Esc` to close the in-canvas fullscreen overlay.
- Canvas chrome + rail design refinement follow-up:
  - kept React Flow minimap/zoom controls visible while removing the fit-view button from the controls group,
  - rounded/styled minimap and controls surfaces to match workspace card chrome,
  - restored visible React Flow dot-grid contrast using explicit rgba dot colors (previous CSS-var SVG color was too faint/inconsistent),
  - improved right-rail visual hierarchy (descriptions, grouped action surfaces, cleaner navigation/action spacing, stronger contrast containers).
- Workspace canvas/fullscreen control correction follow-up:
  - removed shell-content padding gap around the workspace surface (workspace view now bleeds to the content body edges),
  - fixed React Flow class mismatch (`org-flow` styles now apply to workspace canvas controls/minimap),
  - simplified fullscreen overlay to a true canvas takeover (removed extra wrapper/badge/padding),
  - replaced the text `Size` trigger + duplicate top-level fullscreen button with a single overflow menu for resize/full-canvas actions (fullscreen close remains in fullscreen mode).
- Workspace canvas occupancy + balanced anchor tuning follow-up:
  - corrected the workspace wrapper height `calc(...)` Tailwind arbitrary value syntax (previous no-space `+` expression could be ignored by the browser),
  - removed outer canvas panel chrome (border/radius/shadow) so the board surface hard-fills the shell panel,
  - re-centered the default `balanced` preset around the organization card anchor and tightened `fitView` padding/max zoom for better canvas usage.
- Workspace card density + focused layout follow-up:
  - tightened non-fullscreen card overflow behavior (frame only scrolls in fullscreen, while dense card internals handle their own overflow),
  - added compact canvas variants for calendar/communications card internals to reduce clipping and nested-scroll feel on the board,
  - rebalanced `calendar-focused` and `communications-focused` preset positions so the organization card remains a stronger center anchor,
  - split communications card renderers into a dedicated sibling module to keep the interactive state/action container lean and within lint file-size limits.
- Workspace interaction/perf + fullscreen chrome follow-up:
  - memoized `WorkspaceBoardCard` with a custom comparator so non-communications cards do not rerender on communications-only state updates,
  - changed fullscreen canvas-card chrome to true edge-to-edge (`rounded-none`, no border/shadow) and removed translucent overlay gap around the fullscreen surface.
- Workspace drag smoothness follow-up:
  - removed live React Flow grid snapping (which made card dragging feel sticky/jittery),
  - kept tidy alignment by snapping persisted positions on drag-stop to an 8px grid.
- Workspace right-rail surface cleanup follow-up:
  - flattened overly nested rail surfaces (fewer inset containers / border-on-border stacks),
  - tightened contrast and button chrome consistency across controls/layout/access/footer actions while preserving the same rail behavior.
- Workspace drag regression fix follow-up:
  - switched React Flow canvas nodes to `useNodesState(...)` control during drag so cards visibly move while dragging,
  - retained snap-on-drop persistence into workspace board state (8px alignment) to keep saved layouts tidy.
- Workspace drag performance hardening follow-up:
  - memoized the workspace right rail and stabilized its props/callbacks so drag-frame updates do not re-render the right-rail slot tree,
  - memoized the realtime cursor overlay mount and removed `onlyRenderVisibleElements` (unnecessary overhead for the small 6-card board).
- Workspace drag perf refactor + canvas surface cleanup follow-up:
  - removed the explicit canvas wrapper gradient (flat workspace surface so the React Flow dot-grid renders cleanly in dark mode),
  - extracted the React Flow canvas into a memoized child with local drag/fullscreen state so drag-frame node updates no longer re-render the outer workspace shell/right-rail composition.
- Workspace drag performance (docs-aligned) follow-up:
  - paused local realtime cursor mousemove publishing while a card is actively dragging to reduce competing mousemove/network work on the main thread,
  - memoized remaining React Flow config objects (`fitViewOptions`, `defaultEdgeOptions`, `proOptions`) and set `nodeDragThreshold={0}` for more immediate drag response,
  - reduced dragged-card paint cost by dropping card box-shadow while the React Flow node has the `.dragging` state class.
- Workspace whole-tree perf cleanup follow-up:
  - suspended local realtime cursor publishing during viewport move/zoom interactions as well (not just node drag),
  - removed `framer-motion` layout animations from communications card canvas renderers,
  - removed canvas card shadows and React Flow controls `backdrop-filter`,
  - added viewport/node containment hints (`will-change`, `contain`) on the workspace React Flow surface.
- Workspace canvas preview architecture follow-up:
  - documented a dedicated performance architecture brief in `docs/plans/2026-02-24-workspace-canvas-performance-architecture-brief.md`,
  - switched `Calendar` and `Communications` canvas nodes to lightweight summary previews (heavy editor controls now render in fullscreen mode only),
  - lightened the dark-mode workspace canvas surface (`dark:bg-zinc-800`) so the dot grid remains legible without an overly dark background.
- Workspace uncontrolled React Flow interaction path follow-up:
  - migrated the workspace canvas flow surface from controlled `useNodesState(...)` drag frames to uncontrolled React Flow nodes (`defaultNodes` + imperative `setNodes` sync),
  - React Flow now owns live drag movement/viewport interaction; app `boardState` persists snapped positions only on drag stop and syncs discrete node/data updates back into the instance.
- Workspace profiling-first experiment tooling follow-up:
  - added a dev-only workspace perf debug panel to toggle and compare likely bottlenecks (`MiniMap`, controls, edges, right rail, realtime cursors, `onlyRenderVisibleElements`, background dots/lines/off),
  - surfaced quick runtime context in-canvas (`DPR`, viewport size, node/edge counts) to support reproducible Chrome trace capture and experiment notes.
- Workspace right-rail redesign + cleanup follow-up:
  - removed the temporary dev perf debug overlay/wiring after confirming the interaction issue was user drag-handle targeting rather than a persistent regression,
  - rebuilt the workspace right rail to align with shell/accelerator sidebar patterns (fewer nested bordered surfaces, clearer grouping, stronger spacing, larger rail action hit areas),
  - added bottom padding to the shell right-rail scroll container so bottom-aligned CTA cards do not clip against the rail edge.
- Workspace right-rail flattening follow-up:
  - removed workspace right-rail parent card containers and subtitles, keeping sections as plain/invisible wrappers with single content surfaces,
  - moved `Back to dashboard` to the top of the workspace rail and removed its parent card wrapper,
  - moved section action buttons below their content blocks and added label truncation/min-width guards to avoid narrow-rail button text overflow/clipping.
- Workspace right-rail prototype-aligned access redesign follow-up:
  - removed the shared-workspace route toggle CTA from the workspace rail and stopped surfacing presentation-mode terminology in right-rail controls,
  - replaced the invite/member stat tiles with a prototype-style board-access pill (grouped member avatars + separate circular `+` invite trigger),
  - moved `Back to dashboard` back to the bottom rail slot and simplified the rail to two primary sections (`Board access`, `Board layout`) plus the bottom nav action.
- Workspace right-rail controls + ELK auto-layout follow-up:
  - renamed the access surface to `Team Access`, restored a hover card with member details and quick actions (`Invite`, `Manage members`), and removed the remaining rail dropdown/tile-heavy control layout,
  - replaced the layout preset dropdown (and `Save` / `Auto layout` buttons) with icon preset buttons,
  - upgraded workspace auto-layout from the placeholder preset-return function to an async ELK-backed layout path (`elkjs`) with layered/radial presets and fallback to canonical preset coordinates when ELK is unavailable/errors.
- Workspace auto-layout viewport recenter + rail title typography follow-up:
  - after async ELK layout application, the workspace canvas now triggers `fitView` so users immediately see the newly arranged cards,
  - removed tracked uppercase styling from right-rail section titles (`Team Access`, `Board layout`) to avoid the spaced-out text treatment.
- Workspace layout centering + preset transition follow-up:
  - removed the post-ELK anchor-offset normalization that was shifting computed layouts away from the visual center after preset changes,
  - added a lightweight preset-change transition on React Flow node transforms and animated `fitView` recentering for smoother layout switching without affecting drag interaction.
- Workspace preset recenter reliability follow-up:
  - delayed post-layout `fitView` recentering by an additional animation frame and used a dedicated layout-fit config (more padding + lower min zoom) so ELK preset switches keep the card group centered in view.
- Workspace dashboard-grid preset follow-up:
  - converted the `balanced` preset into a true dashboard-style grid layout option (tile grid) and relabeled it in the UI (`Dashboard Grid`),
  - made the grid preset deterministic (size-aware grid positioning) instead of routing it through ELK so the dashboard layout remains stable and predictable.
- Workspace dashboard-grid hierarchy tuning follow-up:
  - moved `Organization` into the center column of the dashboard grid top row to reinforce it as the primary anchor in the dashboard-style preset,
  - added an acceptance assertion to lock in the centered organization card hierarchy for the `Dashboard Grid` preset.
- Workspace dashboard-grid spacing tuning follow-up:
  - tightened dashboard-grid gutters/margins and top-aligned cards within rows so the preset reads more like a compact dashboard widget layout (less floating whitespace around smaller cards).
- Workspace reload state + initial viewport fit follow-up:
  - fixed desktop right-rail reload behavior so the right rail initializes open on page reload instead of flashing/landing closed,
  - replaced React Flow's eager mount-time `fitView` prop with a delayed manual initial `fitView` (post-node mount) to prevent over-zoomed initial canvas focus on reload.
- Workspace card visual hierarchy cleanup follow-up:
  - added per-card frame header controls to hide redundant frame title/subtitle copy where the card body already provides the identity (starting with `Organization` and `Calendar`),
  - flattened inner layout surfaces for `Organization`, `Formation Status`, `Brand Kit`, and `Economic Engine` (removed border-on-border card stacks in favor of dividers and lighter structure),
  - simplified the compact `Calendar` canvas preview into a flatter summary + calendar grid + meta pills layout with less nested card chrome.
- Workspace communications canvas-card cleanup follow-up:
  - removed the redundant `Communications` frame subtitle in the canvas card header,
  - replaced the compact communications preview's nested card stacks with a flatter summary + media placeholder + channel pills + single heatmap/meta panel layout,
  - reduced uppercase/tracked utility labels in the compact preview to align with the flatter card hierarchy pass.
- Workspace communications editor-card chrome cleanup follow-up:
  - flattened the fullscreen communications editor layout into divider-led sections (channels, draft composer, publishing activity) instead of stacked bordered containers,
  - removed outer container wrapping around channel connection toggles and switched to lighter single-surface channel status rows,
  - simplified nested preview/heatmap surfaces to muted single panels with lighter ring treatment and moved schedule context into compact meta chips.
- Workspace calendar editor-card chrome cleanup follow-up:
  - flattened the fullscreen calendar editor layout into divider-led sections (next event summary, month panel, actions) instead of stacked bordered containers,
  - simplified the month calendar chrome to a single muted panel with lighter ring treatment and reduced uppercase/tracked weekday utility labels,
  - moved cadence/queue context into compact inline chips inside the month panel and simplified the action area into a single grouped control stack.
- Workspace calendar date-strip redesign follow-up:
  - replaced the fullscreen month-grid-centric calendar UI with a top horizontal date strip (7-day selector with previous/next month navigation) inspired by the provided reference treatment,
  - added an event list directly below the strip that updates based on the selected strip date (falls back to upcoming events when that day has no events),
  - preserved existing create/edit/cadence action controls beneath the new date strip + event list layout.
- Workspace calendar canvas-preview date-strip correction:
  - wired the compact canvas calendar branch to use the same date-strip + event-list panel (the earlier redesign initially landed only on the fullscreen/editor path),
  - limited compact preview event rows and removed the top divider in the compact variant to fit the canvas card footprint.
- Workspace calendar date-strip container cleanup:
  - removed the extra inset panel wrapper around the date strip + events list so the redesigned calendar UI sits directly in the existing card container,
  - flattened the event list rows further (divider-only list, no nested rounded list box) to align with the anti-layering cleanup.
- Workspace calendar date-strip tile-shape correction:
  - converted strip date chips from auto-height pill buttons to square date tiles (`aspect-square`) with a tighter stacked month/day layout so they match the intended reference treatment.
- Workspace calendar compact strip spacing correction:
  - reduced the compact canvas date strip from 7 visible dates to 5 to preserve square tile shape and spacing in the narrower canvas card width,
  - reduced compact tile corner radius and typography scale so tiles read as squares instead of circles.
- Workspace calendar strip corner-radius follow-up:
  - reduced date-strip tile radii further (`compact: rounded-md`, `fullscreen: rounded-lg`) so the tiles read as square-first rather than pill/circle-shaped.
- Workspace calendar date-strip interaction correctness follow-up:
  - replaced date-strip left/right controls with in-card date shifting (no route navigation), so the strip actually scrolls through dates inside the workspace card,
  - switched strip event-dot detection to date-key matching across `upcomingEvents` (works across month boundaries as the strip shifts),
  - removed the fake fallback event list behavior so the list reflects the selected strip date only (empty state when no events exist for that date).
- Workspace calendar date-strip default anchoring follow-up:
  - changed the strip to default to the current local day and render a forward-running window (matching the provided reference) instead of centering on the next event date/month selection.
- Workspace canvas light-mode tone tuning:
  - darkened the light-mode workspace canvas base surface from near-white to a muted neutral (`zinc-100`) so the board and dot grid sit on a less washed-out background.

### Phase 3 — Calendar and Communications Capability Lift

- Calendar card:
  - recurring board meeting templates by cadence profile,
  - quick-add + edit affordances surfaced directly from board card,
  - explicit upcoming-event stack with role-aware actions.
- Communications card:
  - connected-channel model,
  - post type morphing (text/image/video),
  - schedule/post now with persistent status map.

#### Phase 3 Progress (2026-02-23)

- Calendar card now supports direct create/edit/delete from board context via in-card event sheet.
- Added role assignment controls (`admin`, `staff`, `board`) directly in workspace event flow.
- Added recurrence controls (weekly/monthly/quarterly/annual + optional end date) in board event flow.
- Calendar seed payload now carries enriched upcoming-event metadata needed for edit/invite workflows.
- Communications card now supports explicit channel connection state per surface (`social`, `email`, `blog`) with persisted connection records when channel table is available.
- Communications card post composer now supports in-card media mode morphing (`text`, `image`, `video`) alongside channel-aware publish/schedule flows.
- Communications card publish actions now persist scheduled/posted entries into dedicated workspace communications storage.
- Added workspace communications delivery queue processing (queued/sent/failed lifecycle + mock channel dispatch adapters) to support scheduled publishing execution.
- Workspace seed now hydrates communications heatmap activity from persisted communication posts.

### Phase 4 — Collaboration + Governance Hardening

- Invite lifecycle UX polish (duration stepper, expiry state, revocation feedback).
- Presence/cursor fallback handling and room lifecycle safeguards.
- Board presentation runbook + operator checklist in docs.

#### Phase 4 Progress (2026-02-23)

- Invite sheet upgraded to show lifecycle states: `active`, `expired`, `revoked`.
- Invite history now retained in UI for governance and post-session cleanup checks.
- Realtime cursor/presence surfaces now expose connection health (`live`, `connecting`, `degraded`).
- Added operator runbook: `docs/agent/workspace-presentation-runbook.md`.
- Workspace seed loading now degrades gracefully in non-migrated environments when communications tables are missing from the DB/schema cache.

## Non-Breaking Rule

No existing `view=editor` or default dashboard behavior can change while delivering these phases.
All additions must be additive, with existing links and query routes still functional.
