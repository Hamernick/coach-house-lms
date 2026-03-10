import {
  normalizeAssignedRoles,
  normalizeEventType,
  normalizeRecurrence,
} from "@/lib/roadmap/calendar"

import type { UpcomingEvent } from "./types"

export type UpcomingEventRow = {
  id: string
  title: string
  description: string | null
  event_type: string | null
  starts_at: string
  ends_at: string | null
  all_day: boolean
  recurrence: unknown | null
  status: string
  assigned_roles: string[] | null
}

export function mapUpcomingEvents(rows: UpcomingEventRow[] | null | undefined): UpcomingEvent[] {
  if (!rows || rows.length === 0) return []
  return rows.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    event_type: normalizeEventType(event.event_type),
    starts_at: event.starts_at,
    ends_at: event.ends_at,
    all_day: event.all_day,
    recurrence: normalizeRecurrence(event.recurrence),
    status: event.status === "canceled" ? "canceled" : "active",
    assigned_roles: normalizeAssignedRoles(event.assigned_roles ?? []),
  }))
}
