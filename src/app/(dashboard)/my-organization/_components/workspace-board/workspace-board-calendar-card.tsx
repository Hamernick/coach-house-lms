"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import CalendarPlus2Icon from "lucide-react/dist/esm/icons/calendar-plus-2"
import ChevronLeftIcon from "lucide-react/dist/esm/icons/chevron-left"
import ChevronRightIcon from "lucide-react/dist/esm/icons/chevron-right"
import Repeat2Icon from "lucide-react/dist/esm/icons/repeat-2"

import { MyOrganizationAddEventSheetButton } from "@/components/organization/my-organization-add-event-sheet-button"
import { RoadmapCalendar } from "@/components/roadmap/roadmap-calendar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { WORKSPACE_ROADMAP_PATH } from "@/lib/workspace/routes"

import type { MyOrganizationCalendarView } from "../../_lib/types"
import { safeDateLabel } from "../../_lib/helpers"
import {
  buildCalendarDayKey,
  buildDateStripDays,
  isSameCalendarDay,
  renderCalendarCanvasPreviewCard,
  startOfLocalDay,
} from "./workspace-board-calendar-card-strip"
import type { WorkspaceCardSize } from "./workspace-board-types"

export function WorkspaceBoardCalendarCard({
  calendar,
  canEdit,
  formationStatus,
  isCanvasFullscreen = false,
  presentationMode = false,
}: {
  calendar: MyOrganizationCalendarView
  canEdit: boolean
  formationStatus?: string | null
  cardSize?: WorkspaceCardSize
  isCanvasFullscreen?: boolean
  presentationMode?: boolean
}) {
  const recommendedIntervalMonths =
    formationStatus === "approved" ? 3 : 1
  const upcomingPreview = calendar.upcomingEvents.slice(0, 3)
  const defaultStripSelectedDate = useMemo(() => startOfLocalDay(new Date()), [])
  const [stripSelectedDate, setStripSelectedDate] = useState(defaultStripSelectedDate)
  useEffect(() => {
    setStripSelectedDate(defaultStripSelectedDate)
  }, [defaultStripSelectedDate])

  const stripDayCount = 5
  const stripDays = useMemo(
    () => buildDateStripDays(stripSelectedDate, stripDayCount),
    [stripDayCount, stripSelectedDate],
  )
  const selectedDayEvents = useMemo(() => {
    return calendar.upcomingEvents.filter((event) => {
      const parsed = new Date(event.starts_at)
      if (Number.isNaN(parsed.getTime())) return false
      return isSameCalendarDay(parsed, stripSelectedDate)
    })
  }, [calendar.upcomingEvents, stripSelectedDate])
  const eventDayKeys = useMemo(() => {
    return new Set(
      calendar.upcomingEvents.flatMap((event) => {
        const parsed = new Date(event.starts_at)
        if (Number.isNaN(parsed.getTime())) return []
        return [buildCalendarDayKey(parsed)]
      }),
    )
  }, [calendar.upcomingEvents])
  const visibleEventLimit = 3
  const visibleEvents =
    selectedDayEvents.length > 0
      ? selectedDayEvents.slice(0, visibleEventLimit)
      : calendar.upcomingEvents.slice(0, visibleEventLimit)

  const shiftStripByDays = (deltaDays: number) => {
    setStripSelectedDate((previous) => {
      const next = new Date(previous)
      next.setDate(previous.getDate() + deltaDays)
      return next
    })
  }

  if (!presentationMode && isCanvasFullscreen) {
    return <RoadmapCalendar hideHeaderCopy />
  }

  if (presentationMode) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="rounded-xl border border-border/60 bg-background/25 p-3">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Next board event</p>
          <p className="mt-1 line-clamp-1 text-sm font-semibold text-foreground">
            {calendar.nextEvent?.title ?? "No upcoming events"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {calendar.nextEvent
              ? calendar.nextEvent.all_day
                ? safeDateLabel(calendar.nextEvent.starts_at)
                : safeDateLabel(calendar.nextEvent.starts_at, true)
              : "No scheduled milestones yet"}
          </p>
          {calendar.nextEvent?.assigned_roles.length ? (
            <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">
              Invites: {calendar.nextEvent.assigned_roles.join(", ")}
            </p>
          ) : null}
        </div>

        <div className="rounded-xl border border-border/60 bg-background/25 p-3">
          <div className="flex items-center justify-between gap-2">
            <Button asChild type="button" variant="ghost" size="icon" className="h-7 w-7 rounded-md">
              <Link href={calendar.previousMonthHref} aria-label={`Show ${calendar.previousMonthLabel}`}>
                <ChevronLeftIcon className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <div className="min-w-0 text-center">
              <p className="truncate text-sm font-semibold text-foreground">{calendar.monthLabel}</p>
              <p className="text-[11px] text-muted-foreground">
                {calendar.eventDays.size} active day{calendar.eventDays.size === 1 ? "" : "s"}
              </p>
            </div>
            <Button asChild type="button" variant="ghost" size="icon" className="h-7 w-7 rounded-md">
              <Link href={calendar.nextMonthHref} aria-label={`Show ${calendar.nextMonthLabel}`}>
                <ChevronRightIcon className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1">
            {calendar.weekdayLabels.map((label) => (
              <span key={label} className="text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {label.slice(0, 1)}
              </span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {calendar.grid.map((day, index) => {
              if (!day) {
                return <span key={`calendar-empty-${index}`} className="aspect-square min-h-6 rounded-md" aria-hidden />
              }
              const isSelected = calendar.selectedDay === day
              const hasEvent = calendar.eventDays.has(day)
              return (
                <span
                  key={`calendar-day-${day}`}
                  className={cn(
                    "inline-flex aspect-square min-h-6 items-center justify-center rounded-md text-[11px] font-medium tabular-nums",
                    isSelected
                      ? "bg-foreground text-background"
                      : hasEvent
                        ? "bg-muted text-foreground"
                        : "bg-background/70 text-muted-foreground",
                  )}
                >
                  {day}
                </span>
              )
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-background/20 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Upcoming queue</p>
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Repeat2Icon className="h-3 w-3 opacity-70" aria-hidden />
              {recommendedIntervalMonths === 3 ? "Quarterly cadence" : "Monthly cadence"}
            </span>
          </div>
          {upcomingPreview.length > 0 ? (
            <div className="mt-2 space-y-2">
              {upcomingPreview.map((event) => (
                <div
                  key={event.id}
                  className="rounded-lg border border-border/50 bg-background/60 px-2.5 py-2"
                >
                  <p className="line-clamp-1 text-xs font-medium text-foreground">{event.title}</p>
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                    {event.all_day ? safeDateLabel(event.starts_at) : safeDateLabel(event.starts_at, true)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">
              Add milestones in the full calendar to keep board rhythm visible.
            </p>
          )}
        </div>

        <Button asChild type="button" variant="ghost" size="sm" className="mt-auto h-8 justify-start px-2 text-xs">
          <Link href={WORKSPACE_ROADMAP_PATH}>
            <CalendarPlus2Icon className="h-3.5 w-3.5" aria-hidden />
            View calendar
          </Link>
        </Button>
      </div>
    )
  }

  return renderCalendarCanvasPreviewCard({
    calendar,
    stripSelectedDate,
    stripDays,
    eventDayKeys,
    selectedDayEvents,
    visibleEvents,
    headerAction: canEdit ? (
      <MyOrganizationAddEventSheetButton iconOnly className="h-7 w-7" />
    ) : null,
    onSelectStripDate: setStripSelectedDate,
    onShiftStripDays: shiftStripByDays,
  })
}
