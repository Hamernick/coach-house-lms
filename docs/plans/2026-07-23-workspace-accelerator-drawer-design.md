# Workspace Accelerator Drawer

## Goal

Make Accelerator work feel native to the workspace. Selecting an Accelerator
module or step on the canvas opens the existing workspace bottom sheet at the
exact requested content without a route transition.

## Architecture

The local `WorkspaceCanvasOverlayDrawer` owns the Accelerator tab. It reuses the
existing `WorkspaceAcceleratorCardPanel` through the workspace lazy-loader and
adds a drawer-specific presentation mode. The shared drawer primitive remains
unchanged.

Canvas Accelerator URLs are retained as canonical deep links. The workspace
canvas recognizes `/workspace/accelerator` destinations and converts normal
activation into a drawer request. Modified new-tab activation and surfaces
outside the workspace provider retain the full-page route.

## Data and state

The workspace server seed already contains the Accelerator timeline, module
content, resources, assignments, and progress. The drawer consumes this seed
directly, so opening a step requires no additional route or server load.

Drawer requests carry the request ID, step ID, module ID, and lesson-group key.
The panel synchronizes the exact step and opens its viewer. Current step and
completed-step state continue through the existing workspace board persistence
callback and Accelerator local-storage key. Drawer tab and snap-point
preferences are stored per organization and viewer.

## Interaction

The Accelerator tab is lazy-mounted and shows the existing structural skeleton
until its code is ready. Selecting a module opens videos, resources,
assignments, decks, or completion content inside the sheet. On narrow screens,
the open viewer replaces the checklist; on large screens, checklist and viewer
remain side by side. Switching tabs or collapsing the drawer unmounts the panel
so media cannot continue playing off-screen.

Users without Accelerator access receive one clear access action. The existing
Radix drawer and tabs retain keyboard, focus, and screen-reader behavior.

## Verification

Acceptance coverage must prove exact URL parsing, in-place canvas activation,
lazy mounting, access gating, responsive layout, progress wiring, preference
persistence, and full-page fallback. Live verification must confirm the
workspace URL does not change, the requested step opens, the sheet remains
responsive, and video or assignment content stops when the tab is left.
