import type {
  RoadmapCalendarAssignedRole,
  RoadmapCalendarEventType,
  RoadmapCalendarRecurrence,
} from "@/lib/roadmap/calendar"

export type EventDraft = {
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
