"use client"

import { useId, useState, type MouseEvent } from "react"
import CalendarDaysIcon from "lucide-react/dist/esm/icons/calendar-days"
import LocateFixedIcon from "lucide-react/dist/esm/icons/locate-fixed"
import MinusIcon from "lucide-react/dist/esm/icons/minus"
import PlusIcon from "lucide-react/dist/esm/icons/plus"
import RotateCcwIcon from "lucide-react/dist/esm/icons/rotate-ccw"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  WORKSPACE_TUTORIAL_INVERSE_CONTROL_SURFACE_CLASSNAME,
  WORKSPACE_TUTORIAL_INVERSE_TOOLTIP_CLASSNAME,
} from "@/components/workspace/workspace-tutorial-theme"
import { cn } from "@/lib/utils"

import type { MyOrganizationCalendarView } from "../../../../_lib/types"
import { WorkspaceBoardCalendarCard } from "../../workspace-board-calendar-card"
import { WorkspaceTutorialCallout } from "../../workspace-tutorial-callout"
import { WorkspaceCanvasSurfaceV2HelpOverlay } from "./workspace-canvas-surface-v2-help-overlay"

export function WorkspaceCanvasSurfaceV2ViewportControls({
  calendar,
  canEdit,
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
  const [calendarOpen, setCalendarOpen] = useState(false)
  const calendarRegionId = useId()
  const tutorialCalendarButtonActive = tutorialCalendarButtonCallout !== null
  const handleCalendarTriggerClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (!tutorialCalendarButtonActive) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    onTutorialCalendarButtonComplete?.()
  }

  return (
    <div className="pointer-events-none absolute right-4 top-4 z-30 flex items-start justify-end">
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverAnchor asChild>
          <div
            className={cn(
              "pointer-events-auto flex items-center gap-1 rounded-2xl border border-border/70 bg-card/92 p-1 shadow-sm backdrop-blur transition-[box-shadow,background-color] duration-180 ease-out",
              calendarOpen && "bg-card/96 shadow-md",
            )}
          >
            <PopoverTrigger asChild>
              <div className="relative inline-flex overflow-visible">
                {tutorialCalendarButtonCallout ? (
                  <WorkspaceTutorialCallout
                    reactGrabOwnerId="workspace-canvas-viewport-controls:calendar-callout"
                    mode="indicator"
                    title={tutorialCalendarButtonCallout.title}
                    instruction={tutorialCalendarButtonCallout.instruction}
                    tapHereLabel="Open calendar"
                    indicatorIconPosition="after"
                    tooltipContentClassName={
                      `${WORKSPACE_TUTORIAL_INVERSE_TOOLTIP_CLASSNAME} !px-2 !py-1`
                    }
                    indicatorSide="left"
                    indicatorAnchorAlign="center"
                    indicatorAnchorVerticalAlign="center"
                    indicatorSideOffset={6}
                  />
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={calendarOpen ? "Hide calendar" : "Show calendar"}
                  aria-expanded={calendarOpen}
                  aria-controls={calendarRegionId}
                  title={calendarOpen ? "Hide calendar" : "Show calendar"}
                  onClick={handleCalendarTriggerClick}
                  className={cn(
                    "h-9 w-9 rounded-xl transition-[background-color,color,box-shadow,transform] duration-180 ease-out",
                    calendarOpen &&
                      "bg-accent text-accent-foreground shadow-sm hover:bg-accent hover:text-accent-foreground",
                    tutorialCalendarButtonActive &&
                      WORKSPACE_TUTORIAL_INVERSE_CONTROL_SURFACE_CLASSNAME,
                  )}
                >
                  <CalendarDaysIcon className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </PopoverTrigger>
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
        </PopoverAnchor>

        <PopoverContent
          id={calendarRegionId}
          role="region"
          aria-label="Workspace calendar"
          side="bottom"
          align="end"
          sideOffset={8}
          collisionPadding={16}
          className="w-[min(24rem,calc(100vw-2rem))] rounded-[22px] border-border/70 bg-card/96 p-2 shadow-lg backdrop-blur data-[side=bottom]:slide-in-from-top-1 data-[state=closed]:zoom-out-98 data-[state=open]:zoom-in-98 motion-reduce:data-[state=open]:animate-none motion-reduce:data-[state=closed]:animate-none"
        >
          <div className="max-h-[min(32rem,calc(100svh-7rem))] overflow-y-auto overscroll-contain rounded-[18px] bg-background/60 p-2">
            <WorkspaceBoardCalendarCard calendar={calendar} canEdit={canEdit} />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
