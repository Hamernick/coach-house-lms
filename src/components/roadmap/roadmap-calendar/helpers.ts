import { endOfMonth, startOfMonth } from "date-fns"

import type { RoadmapCalendarEvent } from "@/lib/roadmap/calendar"
import { type EventDraft } from "./types"

export function getMonthRange(month: Date) {
  const start = startOfMonth(month)
  const end = endOfMonth(month)
  return {
    from: start.toISOString(),
    to: end.toISOString(),
  }
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
