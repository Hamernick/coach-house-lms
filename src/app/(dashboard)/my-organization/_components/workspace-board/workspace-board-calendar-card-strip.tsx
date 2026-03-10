"use client"

import type { ReactNode } from "react"

import type { MyOrganizationCalendarView } from "../../_lib/types"
import { CalendarDateStripEventsPanel } from "./workspace-board-calendar-card-strip-panel"
import {
  buildCalendarDayKey,
  buildDateStripDays,
  isSameCalendarDay,
  parseAnchorMonthFromNextHref,
  startOfLocalDay,
} from "./workspace-board-calendar-card-strip-utils"

export {
  buildCalendarDayKey,
  buildDateStripDays,
  isSameCalendarDay,
  parseAnchorMonthFromNextHref,
  startOfLocalDay,
}

export function renderCalendarCanvasPreviewCard({
  calendar,
  stripSelectedDate,
  stripDays,
  eventDayKeys,
  selectedDayEvents,
  visibleEvents,
  headerAction,
  onSelectStripDate,
  onShiftStripDays,
}: {
  calendar: MyOrganizationCalendarView
  stripSelectedDate: Date
  stripDays: Date[]
  eventDayKeys: Set<string>
  selectedDayEvents: MyOrganizationCalendarView["upcomingEvents"]
  visibleEvents: MyOrganizationCalendarView["upcomingEvents"]
  headerAction?: ReactNode
  onSelectStripDate: (date: Date) => void
  onShiftStripDays: (deltaDays: number) => void
}) {
  return (
    <CalendarDateStripEventsPanel
      calendar={calendar}
      compactCanvasCard
      showTopDivider={false}
      headerAction={headerAction}
      stripSelectedDate={stripSelectedDate}
      stripDays={stripDays}
      eventDayKeys={eventDayKeys}
      selectedDayEvents={selectedDayEvents}
      visibleEvents={visibleEvents}
      onSelectStripDate={onSelectStripDate}
      onShiftStripDays={onShiftStripDays}
    />
  )
}
