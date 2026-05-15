import type { RoadmapCalendarEventType } from "@/lib/roadmap/calendar"

export const ROADMAP_CALENDAR_EVENT_TYPE_ORDER: RoadmapCalendarEventType[] = [
  "meeting",
  "board_meeting",
  "deadline",
  "milestone",
  "other",
]

export const ROADMAP_CALENDAR_EVENT_TYPE_META: Record<
  RoadmapCalendarEventType,
  {
    dotClassName: string
    badgeClassName: string
  }
> = {
  meeting: {
    dotClassName: "bg-sky-500",
    badgeClassName: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
  },
  board_meeting: {
    dotClassName: "bg-violet-500",
    badgeClassName: "bg-violet-500/12 text-violet-700 dark:text-violet-300",
  },
  deadline: {
    dotClassName: "bg-rose-500",
    badgeClassName: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
  },
  milestone: {
    dotClassName: "bg-emerald-500",
    badgeClassName: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  },
  other: {
    dotClassName: "bg-amber-500",
    badgeClassName: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
  },
}

export const ROADMAP_CALENDAR_EVENT_MODIFIER_BY_TYPE: Record<
  RoadmapCalendarEventType,
  string
> = {
  meeting: "eventMeeting",
  board_meeting: "eventBoardMeeting",
  deadline: "eventDeadline",
  milestone: "eventMilestone",
  other: "eventOther",
}
