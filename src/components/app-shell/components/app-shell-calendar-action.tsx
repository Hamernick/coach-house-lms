"use client"

import {
  useCallback,
  useId,
  useState,
  type ComponentProps,
  type MouseEvent,
} from "react"
import dynamic from "next/dynamic"
import CalendarDaysIcon from "lucide-react/dist/esm/icons/calendar-days"

import { useAppShellCalendarActionRegistration } from "@/components/app-shell/calendar-action-context"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  WORKSPACE_TUTORIAL_INVERSE_CONTROL_SURFACE_CLASSNAME,
  WORKSPACE_TUTORIAL_INVERSE_TOOLTIP_CLASSNAME,
} from "@/components/workspace/workspace-tutorial-theme"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

const RoadmapCalendar = dynamic<
  ComponentProps<
    typeof import("@/components/roadmap/roadmap-calendar").RoadmapCalendar
  >
>(
  () =>
    import("@/components/roadmap/roadmap-calendar").then(
      (mod) => mod.RoadmapCalendar,
    ),
  { loading: () => null, ssr: false },
)

const WorkspaceTutorialCallout = dynamic<
  ComponentProps<
    typeof import("@/components/workspace/workspace-tutorial-callout").WorkspaceTutorialCallout
  >
>(
  () =>
    import("@/components/workspace/workspace-tutorial-callout").then(
      (mod) => mod.WorkspaceTutorialCallout,
    ),
  { loading: () => null, ssr: false },
)

export function AppShellCalendarAction() {
  const isMobile = useIsMobile()
  const { tutorialCalendarButtonCallout, onTutorialCalendarButtonComplete } =
    useAppShellCalendarActionRegistration()
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [calendarHasOpened, setCalendarHasOpened] = useState(false)
  const calendarRegionId = useId()
  const tutorialCalendarButtonActive = tutorialCalendarButtonCallout !== null

  const handleCalendarOpenChange = useCallback((open: boolean) => {
    setCalendarOpen(open)
    if (open) {
      setCalendarHasOpened(true)
    }
  }, [])

  const handleCalendarTriggerClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (!onTutorialCalendarButtonComplete) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    onTutorialCalendarButtonComplete()
  }

  const calendarTrigger = (
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
        "relative",
        calendarOpen &&
          "bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground shadow-sm",
        tutorialCalendarButtonActive &&
          WORKSPACE_TUTORIAL_INVERSE_CONTROL_SURFACE_CLASSNAME
      )}
    >
      <CalendarDaysIcon className="h-4 w-4" aria-hidden />
    </Button>
  )

  const tutorialCallout =
    tutorialCalendarButtonCallout ? (
      <WorkspaceTutorialCallout
        reactGrabOwnerId="workspace-canvas-viewport-controls:calendar-callout"
        mode="indicator"
        title={tutorialCalendarButtonCallout.title}
        instruction={tutorialCalendarButtonCallout.instruction}
        tapHereLabel="Open calendar"
        indicatorIconPosition="after"
        tooltipContentClassName={`${WORKSPACE_TUTORIAL_INVERSE_TOOLTIP_CLASSNAME} !px-2 !py-1`}
        indicatorSide="left"
        indicatorAnchorAlign="center"
        indicatorAnchorVerticalAlign="center"
        indicatorSideOffset={6}
      />
    ) : null
  const calendarBody = calendarHasOpened ? (
    <RoadmapCalendar hideHeaderCopy />
  ) : null

  if (isMobile) {
    return (
      <Drawer
        open={calendarOpen}
        onOpenChange={handleCalendarOpenChange}
        handleOnly
      >
        <div className="relative inline-flex">
          {tutorialCallout}
          <DrawerTrigger asChild>{calendarTrigger}</DrawerTrigger>
        </div>

        {calendarHasOpened ? (
          <DrawerContent
            forceMount
            className={cn(
              "border-border/70 bg-background/98 h-[88dvh] max-h-[88dvh] overflow-hidden rounded-t-3xl p-0 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl data-[state=closed]:hidden",
              "touch-pan-y overscroll-contain data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:max-h-[88dvh]"
            )}
          >
            <DrawerTitle className="sr-only">Workspace calendar</DrawerTitle>
            <div
              id={calendarRegionId}
              role="region"
              aria-label="Workspace calendar"
              className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-3 pt-3 pb-0"
            >
              {calendarBody}
            </div>
          </DrawerContent>
        ) : null}
      </Drawer>
    )
  }

  return (
    <Popover open={calendarOpen} onOpenChange={handleCalendarOpenChange}>
      <div className="relative inline-flex">
        {tutorialCallout}
        <PopoverTrigger asChild>{calendarTrigger}</PopoverTrigger>
      </div>

      {calendarHasOpened ? (
        <PopoverContent
          forceMount
          id={calendarRegionId}
          role="region"
          aria-label="Workspace calendar"
          side="bottom"
          align="end"
          sideOffset={8}
          collisionPadding={16}
          className="bg-background/95 data-[side=bottom]:slide-in-from-top-1 data-[state=closed]:zoom-out-98 data-[state=open]:zoom-in-98 w-[min(23.5rem,calc(100vw-1rem))] overflow-hidden rounded-[30px] border-0 p-0 shadow-none backdrop-blur-xl data-[state=closed]:hidden motion-reduce:data-[state=closed]:animate-none motion-reduce:data-[state=open]:animate-none"
        >
          {calendarBody}
        </PopoverContent>
      ) : null}
    </Popover>
  )
}
