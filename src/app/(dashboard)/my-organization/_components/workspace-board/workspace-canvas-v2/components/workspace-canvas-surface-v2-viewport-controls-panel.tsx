"use client"

import LocateFixedIcon from "lucide-react/dist/esm/icons/locate-fixed"
import MinusIcon from "lucide-react/dist/esm/icons/minus"
import PlusIcon from "lucide-react/dist/esm/icons/plus"
import RotateCcwIcon from "lucide-react/dist/esm/icons/rotate-ccw"

import { useRegisterAppShellCalendarTutorial } from "@/components/app-shell/calendar-action-context"
import { Button } from "@/components/ui/button"

import type { MyOrganizationCalendarView } from "../../../../_lib/types"
import { WorkspaceCanvasSurfaceV2HelpOverlay } from "./workspace-canvas-surface-v2-help-overlay"

export function WorkspaceCanvasSurfaceV2ViewportControls({
  calendar: _calendar,
  canEdit: _canEdit,
  tutorialCalendarButtonCallout,
  onTutorialCalendarButtonComplete,
  onRecenterView,
  onResetView,
  onZoomIn,
  onZoomOut,
}: {
  calendar: MyOrganizationCalendarView
  canEdit: boolean
  tutorialCalendarButtonCallout?: { title: string; instruction: string } | null
  onTutorialCalendarButtonComplete?: (() => void) | undefined
  onRecenterView: () => void
  onResetView: () => void
  onZoomIn: () => void
  onZoomOut: () => void
}) {
  useRegisterAppShellCalendarTutorial({
    tutorialCalendarButtonCallout: tutorialCalendarButtonCallout ?? null,
    onTutorialCalendarButtonComplete,
  })

  return (
    <div className="pointer-events-none absolute top-4 right-4 z-30 flex items-start justify-end">
      <div className="border-border/70 bg-card/92 pointer-events-auto flex items-center gap-1 rounded-2xl border p-1 shadow-sm backdrop-blur transition-[box-shadow,background-color] duration-180 ease-out">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl"
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
          className="h-9 w-9 rounded-xl"
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
          className="h-9 w-9 rounded-xl"
          onClick={onRecenterView}
          aria-label="Recenter view"
          title="Recenter view"
        >
          <LocateFixedIcon className="h-4 w-4" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl"
          onClick={onResetView}
          aria-label="Reset view"
          title="Reset view"
        >
          <RotateCcwIcon className="h-4 w-4" aria-hidden />
        </Button>
        <WorkspaceCanvasSurfaceV2HelpOverlay integrated />
      </div>
    </div>
  )
}
