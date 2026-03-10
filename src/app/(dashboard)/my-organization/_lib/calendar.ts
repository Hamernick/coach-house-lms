import { CALENDAR_WEEKDAY_LABELS } from "./constants"
import { parseMonthParam, withMonthParam } from "./helpers"
import type { MyOrganizationCalendarView, MyOrganizationSearchParams, UpcomingEvent } from "./types"

export function buildMyOrganizationCalendarView({
  monthParam,
  searchParams,
  upcomingEvents,
}: {
  monthParam: string
  searchParams?: MyOrganizationSearchParams
  upcomingEvents: UpcomingEvent[]
}): MyOrganizationCalendarView {
  const requestedMonthDate = parseMonthParam(monthParam)
  const calendarAnchorDate = (() => {
    if (requestedMonthDate) return requestedMonthDate
    const first = upcomingEvents[0]?.starts_at
    const parsed = first ? new Date(first) : new Date()
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed
  })()

  const calendarYear = calendarAnchorDate.getFullYear()
  const calendarMonth = calendarAnchorDate.getMonth()
  const monthLabel = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(calendarAnchorDate)
  const previousMonthDate = new Date(calendarYear, calendarMonth - 1, 1)
  const nextMonthDate = new Date(calendarYear, calendarMonth + 1, 1)
  const previousMonthHref = withMonthParam(searchParams, previousMonthDate)
  const nextMonthHref = withMonthParam(searchParams, nextMonthDate)
  const previousMonthLabel = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(previousMonthDate)
  const nextMonthLabel = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(nextMonthDate)
  const firstWeekday = new Date(calendarYear, calendarMonth, 1).getDay()
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate()

  const grid: Array<number | null> = []
  for (let index = 0; index < firstWeekday; index += 1) {
    grid.push(null)
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    grid.push(day)
  }
  while (grid.length % 7 !== 0) {
    grid.push(null)
  }

  const eventDays = new Set(
    upcomingEvents
      .map((event) => {
        const parsed = new Date(event.starts_at)
        if (Number.isNaN(parsed.getTime())) return null
        if (parsed.getFullYear() !== calendarYear || parsed.getMonth() !== calendarMonth) return null
        return parsed.getDate()
      })
      .filter((value): value is number => typeof value === "number"),
  )

  const nextEvent = upcomingEvents[0] ?? null
  const selectedDay = (() => {
    if (!nextEvent) return null
    const parsed = new Date(nextEvent.starts_at)
    if (Number.isNaN(parsed.getTime())) return null
    if (parsed.getFullYear() !== calendarYear || parsed.getMonth() !== calendarMonth) return null
    return parsed.getDate()
  })()

  return {
    monthLabel,
    previousMonthHref,
    nextMonthHref,
    previousMonthLabel,
    nextMonthLabel,
    grid,
    weekdayLabels: CALENDAR_WEEKDAY_LABELS,
    eventDays,
    selectedDay,
    upcomingEvents,
    nextEvent,
  }
}
