"use client"

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
  recommendedIntervalMonths,
  stripSelectedDate,
  stripDays,
  eventDayKeys,
  selectedDayEvents,
  visibleEvents,
  onSelectStripDate,
  onShiftStripDays,
}: {
  calendar: MyOrganizationCalendarView
  recommendedIntervalMonths: number
  stripSelectedDate: Date
  stripDays: Date[]
  eventDayKeys: Set<string>
  selectedDayEvents: MyOrganizationCalendarView["upcomingEvents"]
  visibleEvents: MyOrganizationCalendarView["upcomingEvents"]
  onSelectStripDate: (date: Date) => void
  onShiftStripDays: (deltaDays: number) => void
}) {
  return (
    <CalendarDateStripEventsPanel
      calendar={calendar}
      compactCanvasCard
      showTopDivider={false}
      stripSelectedDate={stripSelectedDate}
      stripDays={stripDays}
      eventDayKeys={eventDayKeys}
      selectedDayEvents={selectedDayEvents}
      visibleEvents={visibleEvents}
      recommendedIntervalMonths={recommendedIntervalMonths}
      onSelectStripDate={onSelectStripDate}
      onShiftStripDays={onShiftStripDays}
    />
  )
}
