export type RoadmapCalendarType = "public" | "internal"

export type RoadmapCalendarAssignedRole = "admin" | "staff" | "board"

export type RoadmapCalendarRecurrence = {
  frequency: "weekly" | "monthly" | "quarterly" | "annual"
  interval?: number
  byDay?: string[]
  endDate?: string | null
  count?: number | null
}

export type RoadmapCalendarEvent = {
  id: string
  orgId: string
  title: string
  description: string | null
  startsAt: string
  endsAt: string | null
  allDay: boolean
  recurrence: RoadmapCalendarRecurrence | null
  status: "active" | "canceled"
  assignedRoles: RoadmapCalendarAssignedRole[]
  createdAt: string
  updatedAt: string
}

export type RoadmapCalendarEventInput = {
  title: string
  description?: string | null
  startsAt: string
  endsAt?: string | null
  allDay?: boolean
  recurrence?: RoadmapCalendarRecurrence | null
  status?: "active" | "canceled"
  assignedRoles?: RoadmapCalendarAssignedRole[]
}

export type RoadmapCalendarEventUpdate = Partial<RoadmapCalendarEventInput>

export const ROADMAP_CALENDAR_PRESETS = [
  {
    id: "board_meeting",
    label: "Board meeting",
    title: "Board meeting",
  },
  {
    id: "reporting_deadline",
    label: "Reporting deadline",
    title: "Reporting deadline",
  },
  {
    id: "key_milestone",
    label: "Key milestone",
    title: "Key milestone",
  },
] as const

export function normalizeAssignedRoles(input: unknown): RoadmapCalendarAssignedRole[] {
  if (!Array.isArray(input)) return []
  return input.filter((role): role is RoadmapCalendarAssignedRole => role === "admin" || role === "staff" || role === "board")
}

export function normalizeRecurrence(input: unknown): RoadmapCalendarRecurrence | null {
  if (!input || typeof input !== "object") return null
  const recurrence = input as RoadmapCalendarRecurrence
  if (recurrence.frequency !== "weekly" && recurrence.frequency !== "monthly" && recurrence.frequency !== "quarterly" && recurrence.frequency !== "annual") {
    return null
  }
  const interval = typeof recurrence.interval === "number" && recurrence.interval > 0 ? recurrence.interval : undefined
  const byDay = Array.isArray(recurrence.byDay) ? recurrence.byDay.map(String) : undefined
  const endDate = typeof recurrence.endDate === "string" ? recurrence.endDate : undefined
  const count = typeof recurrence.count === "number" && recurrence.count > 0 ? recurrence.count : undefined
  return {
    frequency: recurrence.frequency,
    interval,
    byDay,
    endDate,
    count,
  }
}

export function mapCalendarRow(
  row: {
    id: string
    org_id: string
    title: string
    description: string | null
    starts_at: string
    ends_at: string | null
    all_day: boolean
    recurrence: unknown | null
    status: string
    assigned_roles: string[] | null
    created_at: string
    updated_at: string
  }
): RoadmapCalendarEvent {
  return {
    id: row.id,
    orgId: row.org_id,
    title: row.title,
    description: row.description,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    allDay: row.all_day,
    recurrence: normalizeRecurrence(row.recurrence),
    status: row.status === "canceled" ? "canceled" : "active",
    assignedRoles: normalizeAssignedRoles(row.assigned_roles ?? []),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function formatCalendarTime(value: string, options?: Intl.DateTimeFormatOptions) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    ...options,
  }).format(date)
}

export function formatCalendarDate(value: string, options?: Intl.DateTimeFormatOptions) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options,
  }).format(date)
}

export function formatCalendarWeekday(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date)
}

export function formatCalendarDateRange(event: RoadmapCalendarEvent) {
  if (event.allDay) {
    return formatCalendarDate(event.startsAt, { month: "short", day: "numeric" })
  }

  const startLabel = formatCalendarTime(event.startsAt)
  const endLabel = event.endsAt ? formatCalendarTime(event.endsAt) : null
  return endLabel ? `${startLabel}–${endLabel}` : startLabel
}

export function formatCalendarRecurrence(recurrence: RoadmapCalendarRecurrence | null) {
  if (!recurrence) return ""
  if (recurrence.frequency === "weekly") return "Repeats weekly"
  if (recurrence.frequency === "monthly") return "Repeats monthly"
  if (recurrence.frequency === "quarterly") return "Repeats quarterly"
  return "Repeats yearly"
}
