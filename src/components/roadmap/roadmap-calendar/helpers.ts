import { endOfMonth, startOfMonth } from "date-fns"

import type { RoadmapCalendarEvent } from "@/lib/roadmap/calendar"
import { type EventDraft } from "./types"

const MAX_EVENT_DOT_DAYS = 370

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

  const end = getCalendarEventEndForDayComparison(event, start)
  return (
    start.getTime() <= endOfLocalDay(day).getTime() &&
    end.getTime() >= startOfLocalDay(day).getTime()
  )
}

export function getRoadmapCalendarEventDates(event: RoadmapCalendarEvent) {
  const start = getRoadmapCalendarEventStartDate(event)
  if (!start) return []

  const end = getCalendarEventEndForDayComparison(event, start)
  const dates: Date[] = []
  const cursor = startOfLocalDay(start)
  const last = startOfLocalDay(end)

  while (cursor.getTime() <= last.getTime() && dates.length < MAX_EVENT_DOT_DAYS) {
    dates.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  return dates
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
