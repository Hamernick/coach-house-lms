import type {
  RoadmapCalendarAssignedRole,
  RoadmapCalendarRecurrence,
} from "@/lib/roadmap/calendar"

export type EventDraft = {
  title: string
  description: string
  startsAt: string
  endsAt: string
  allDay: boolean
  status: "active" | "canceled"
  assignedRoles: RoadmapCalendarAssignedRole[]
  recurrence: RoadmapCalendarRecurrence | null
}
