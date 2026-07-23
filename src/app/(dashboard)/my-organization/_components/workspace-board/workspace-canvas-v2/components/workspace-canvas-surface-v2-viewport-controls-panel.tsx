"use client"

import LocateFixedIcon from "lucide-react/dist/esm/icons/locate-fixed"
import MinusIcon from "lucide-react/dist/esm/icons/minus"
import PlusIcon from "lucide-react/dist/esm/icons/plus"

import { useRegisterAppShellCalendarTutorial } from "@/components/app-shell/calendar-action-context"
import { getReactGrabOwnerProps } from "@/components/dev/react-grab-surface"
import { Button } from "@/components/ui/button"

import { WorkspaceCanvasSurfaceV2HelpOverlay } from "./workspace-canvas-surface-v2-help-overlay"

const WORKSPACE_VIEWPORT_CONTROLS_SOURCE =
  "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-viewport-controls-panel.tsx"

function getViewportControlOwnerProps(
  control: "zoom-out" | "zoom-in" | "recenter"
) {
  return getReactGrabOwnerProps({
    ownerId: `workspace-canvas:viewport-${control}`,
    component: "WorkspaceCanvasSurfaceV2ViewportControls",
    source: WORKSPACE_VIEWPORT_CONTROLS_SOURCE,
    slot: "trigger",
    variant: control,
    primitiveImport: "@/components/ui/button",
  })
}

export function WorkspaceCanvasSurfaceV2ViewportControls({
  tutorialCalendarButtonCallout,
  onTutorialCalendarButtonComplete,
  onRecenterView,
  onZoomIn,
  onZoomOut,
}: {
  tutorialCalendarButtonCallout?: { title: string; instruction: string } | null
  onTutorialCalendarButtonComplete?: (() => void) | undefined
  onRecenterView: () => void
  onZoomIn: () => void
  onZoomOut: () => void
}) {
  useRegisterAppShellCalendarTutorial({
    tutorialCalendarButtonCallout: tutorialCalendarButtonCallout ?? null,
    onTutorialCalendarButtonComplete,
  })

  return (
    <div className="pointer-events-none absolute right-4 bottom-4 z-30 flex items-start justify-end md:top-4 md:bottom-auto">
      <div className="border-border/70 bg-card/92 pointer-events-auto flex items-center gap-1 rounded-2xl border p-1 shadow-sm backdrop-blur transition-[box-shadow,background-color] duration-180 ease-out">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          {...getViewportControlOwnerProps("zoom-out")}
          className="size-11 touch-manipulation rounded-xl md:size-9"
          onClick={onZoomOut}
          aria-label="Zoom out"
          title="Zoom out"
        >
          <MinusIcon className="h-4 w-4" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          {...getViewportControlOwnerProps("zoom-in")}
          className="size-11 touch-manipulation rounded-xl md:size-9"
          onClick={onZoomIn}
          aria-label="Zoom in"
          title="Zoom in"
        >
          <PlusIcon className="h-4 w-4" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          {...getViewportControlOwnerProps("recenter")}
          className="size-11 touch-manipulation rounded-xl md:size-9"
          onClick={onRecenterView}
          aria-label="Recenter view"
          title="Recenter view"
        >
          <LocateFixedIcon className="h-4 w-4" aria-hidden />
        </Button>
        <WorkspaceCanvasSurfaceV2HelpOverlay integrated />
      </div>
    </div>
  )
}
