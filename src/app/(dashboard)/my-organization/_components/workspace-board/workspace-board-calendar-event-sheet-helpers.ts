import type {
  RoadmapCalendarAssignedRole,
  RoadmapCalendarEventType,
  RoadmapCalendarRecurrence,
} from "@/lib/roadmap/calendar"

import type { UpcomingEvent } from "../../_lib/types"

export type CalendarEventDraft = {
  title: string
  description: string
  eventType: RoadmapCalendarEventType
  startsAt: string
  endsAt: string
  allDay: boolean
  status: "active" | "canceled"
  assignedRoles: RoadmapCalendarAssignedRole[]
  recurrence: RoadmapCalendarRecurrence | null
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

export function buildDefaultCalendarEventDraft(event?: UpcomingEvent | null): CalendarEventDraft {
  if (event) {
    return {
      title: event.title,
      description: event.description ?? "",
      eventType: event.event_type,
      startsAt: toDatetimeLocal(event.starts_at),
      endsAt: event.ends_at ? toDatetimeLocal(event.ends_at) : "",
      allDay: event.all_day,
      status: event.status,
      assignedRoles: event.assigned_roles,
      recurrence: event.recurrence,
    }
  }

  const start = new Date()
  start.setMinutes(0, 0, 0)
  start.setHours(start.getHours() + 1)
  const end = new Date(start)
  end.setHours(end.getHours() + 1)

  return {
    title: "",
    description: "",
    eventType: "meeting",
    startsAt: toDatetimeLocal(start.toISOString()),
    endsAt: toDatetimeLocal(end.toISOString()),
    allDay: false,
    status: "active",
    assignedRoles: ["admin"],
    recurrence: null,
  }
}
