import type { RoadmapCalendarAssignedRole } from "@/lib/roadmap/calendar"

export const ROLE_OPTIONS: Array<{ id: RoadmapCalendarAssignedRole; label: string }> = [
  { id: "admin", label: "Admins" },
  { id: "staff", label: "Staff" },
  { id: "board", label: "Board" },
]

export const DEMO_SEED_KEY = "roadmap-calendar-seeded-v2"
export const DURATION_OPTIONS = [15, 30, 45, 60] as const
