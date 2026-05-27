import { endOfMonth, startOfMonth } from "date-fns"

import type { RoadmapCalendarEvent } from "@/lib/roadmap/calendar"
import { type EventDraft } from "./types"

const MAX_EVENT_DOT_DAYS = 370
const MAX_RECURRENCE_OCCURRENCES = 5200

export function getMonthRange(month: Date) {
  const start = startOfMonth(month)
  const end = endOfMonth(month)
  return {
    from: start.toISOString(),
    to: end.toISOString(),
  }
}

function isValidDate(date: Date) {
  return !Number.isNaN(date.getTime())
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function endOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

function getRecurrenceInterval(event: RoadmapCalendarEvent) {
  const interval = event.recurrence?.interval
  return typeof interval === "number" && interval > 0 ? interval : 1
}

function addMonthsClamped(date: Date, months: number) {
  const next = new Date(date)
  const day = next.getDate()
  next.setDate(1)
  next.setMonth(next.getMonth() + months)
  next.setDate(Math.min(day, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()))
  return next
}

function advanceOccurrenceStart(event: RoadmapCalendarEvent, start: Date) {
  const interval = getRecurrenceInterval(event)
  if (event.recurrence?.frequency === "weekly") {
    const next = new Date(start)
    next.setDate(next.getDate() + 7 * interval)
    return next
  }
  if (event.recurrence?.frequency === "quarterly") return addMonthsClamped(start, 3 * interval)
  if (event.recurrence?.frequency === "annual") return addMonthsClamped(start, 12 * interval)
  return addMonthsClamped(start, interval)
}

function parseRecurrenceEndDate(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(value.includes("T") ? value : `${value}T23:59:59.999`)
  return isValidDate(date) ? date : null
}

function getCalendarEventEndForDayComparison(event: RoadmapCalendarEvent, start: Date) {
  if (!event.endsAt) return start
  const end = new Date(event.endsAt)
  if (!isValidDate(end)) return start

  if (
    event.allDay &&
    end.getTime() > start.getTime() &&
    end.getHours() === 0 &&
    end.getMinutes() === 0 &&
    end.getSeconds() === 0 &&
    end.getMilliseconds() === 0
  ) {
    return new Date(end.getTime() - 1)
  }

  return end
}

function resolveOccurrenceEnd(event: RoadmapCalendarEvent, originalStart: Date, occurrenceStart: Date) {
  const originalEnd = getCalendarEventEndForDayComparison(event, originalStart)
  const duration = Math.max(originalEnd.getTime() - originalStart.getTime(), 0)
  return new Date(occurrenceStart.getTime() + duration)
}

function eventSpanTouchesDay(start: Date, end: Date, day: Date) {
  return (
    start.getTime() <= endOfLocalDay(day).getTime() &&
    end.getTime() >= startOfLocalDay(day).getTime()
  )
}

function isOccurrenceWithinRecurrenceBounds(
  event: RoadmapCalendarEvent,
  occurrenceIndex: number,
  occurrenceStart: Date,
) {
  const count = event.recurrence?.count
  if (typeof count === "number" && count > 0 && occurrenceIndex >= count) return false

  const endDate = parseRecurrenceEndDate(event.recurrence?.endDate)
  return !endDate || occurrenceStart.getTime() <= endDate.getTime()
}

function collectEventSpanDates(start: Date, end: Date, dates: Date[], seen: Set<string>) {
  const cursor = startOfLocalDay(start)
  const last = startOfLocalDay(end)

  while (cursor.getTime() <= last.getTime() && dates.length < MAX_EVENT_DOT_DAYS) {
    const key = getRoadmapCalendarDayKey(cursor)
    if (!seen.has(key)) {
      seen.add(key)
      dates.push(new Date(cursor))
    }
    cursor.setDate(cursor.getDate() + 1)
  }
}

export function getRoadmapCalendarDayKey(date: Date) {
  if (!isValidDate(date)) return ""
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

export function isSameRoadmapCalendarMonth(left: Date, right: Date) {
  return (
    isValidDate(left) &&
    isValidDate(right) &&
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth()
  )
}

export function getRoadmapCalendarEventStartDate(event: RoadmapCalendarEvent) {
  const start = new Date(event.startsAt)
  return isValidDate(start) ? start : null
}

export function roadmapCalendarEventOccursOnDay(event: RoadmapCalendarEvent, day: Date) {
  const start = getRoadmapCalendarEventStartDate(event)
  if (!start || !isValidDate(day)) return false

  if (!event.recurrence) {
    return eventSpanTouchesDay(start, getCalendarEventEndForDayComparison(event, start), day)
  }

  const dayEnd = endOfLocalDay(day).getTime()
  let occurrenceStart = start

  for (let index = 0; index < MAX_RECURRENCE_OCCURRENCES; index += 1) {
    if (!isOccurrenceWithinRecurrenceBounds(event, index, occurrenceStart)) break
    if (occurrenceStart.getTime() > dayEnd) break

    const occurrenceEnd = resolveOccurrenceEnd(event, start, occurrenceStart)
    if (eventSpanTouchesDay(occurrenceStart, occurrenceEnd, day)) return true

    const nextStart = advanceOccurrenceStart(event, occurrenceStart)
    if (!isValidDate(nextStart) || nextStart.getTime() <= occurrenceStart.getTime()) break
    occurrenceStart = nextStart
  }

  return false
}

export function getRoadmapCalendarEventDates(event: RoadmapCalendarEvent) {
  const start = getRoadmapCalendarEventStartDate(event)
  if (!start) return []

  const end = getCalendarEventEndForDayComparison(event, start)
  const dates: Date[] = []

  if (!event.recurrence) {
    collectEventSpanDates(start, end, dates, new Set())
    return dates
  }

  const seen = new Set<string>()
  let occurrenceStart = start

  for (let index = 0; index < MAX_RECURRENCE_OCCURRENCES && dates.length < MAX_EVENT_DOT_DAYS; index += 1) {
    if (!isOccurrenceWithinRecurrenceBounds(event, index, occurrenceStart)) break

    collectEventSpanDates(
      occurrenceStart,
      resolveOccurrenceEnd(event, start, occurrenceStart),
      dates,
      seen,
    )

    const nextStart = advanceOccurrenceStart(event, occurrenceStart)
    if (!isValidDate(nextStart) || nextStart.getTime() <= occurrenceStart.getTime()) break
    occurrenceStart = nextStart
  }

  return dates.sort((left, right) => left.getTime() - right.getTime())
}

export function sortRoadmapCalendarEventsByStart(
  left: RoadmapCalendarEvent,
  right: RoadmapCalendarEvent,
) {
  const leftStart = getRoadmapCalendarEventStartDate(left)?.getTime() ?? 0
  const rightStart = getRoadmapCalendarEventStartDate(right)?.getTime() ?? 0
  return leftStart - rightStart || left.title.localeCompare(right.title)
}

export function getFirstRoadmapCalendarEventDate(events: RoadmapCalendarEvent[], month: Date) {
  return events
    .map(getRoadmapCalendarEventStartDate)
    .filter((date): date is Date => date !== null && isSameRoadmapCalendarMonth(date, month))
    .sort((left, right) => left.getTime() - right.getTime())[0]
}

export function toDatetimeLocal(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

export function fromDatetimeLocal(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toISOString()
}

export function addMinutesToDatetimeLocal(value: string, minutes: number) {
  if (!value) return ""
  const start = new Date(value)
  if (Number.isNaN(start.getTime())) return ""
  start.setMinutes(start.getMinutes() + minutes)
  return toDatetimeLocal(start.toISOString())
}

export function eventDurationMinutes(event: RoadmapCalendarEvent) {
  if (!event.endsAt) return null
  const start = new Date(event.startsAt)
  const end = new Date(event.endsAt)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null
  const minutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60))
  return minutes > 0 ? minutes : null
}

export function buildDraft({
  event,
  baseDate,
}: {
  event?: RoadmapCalendarEvent | null
  baseDate?: Date
}): EventDraft {
  if (event) {
    return {
      title: event.title,
      description: event.description ?? "",
      eventType: event.eventType,
      startsAt: toDatetimeLocal(event.startsAt),
      endsAt: event.endsAt ? toDatetimeLocal(event.endsAt) : "",
      allDay: event.allDay,
      status: event.status,
      assignedRoles: event.assignedRoles,
      recurrence: event.recurrence,
    }
  }

  const startDate = baseDate ? new Date(baseDate) : new Date()
  startDate.setHours(9, 0, 0, 0)
  const endDate = new Date(startDate)
  endDate.setHours(endDate.getHours() + 1)

  return {
    title: "",
    description: "",
    eventType: "meeting",
    startsAt: toDatetimeLocal(startDate.toISOString()),
    endsAt: toDatetimeLocal(endDate.toISOString()),
    allDay: false,
    status: "active",
    assignedRoles: ["admin"],
    recurrence: null,
  }
}
