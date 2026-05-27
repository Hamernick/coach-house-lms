import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import {
  getRoadmapCalendarEventDates,
  roadmapCalendarEventOccursOnDay,
} from "@/components/roadmap/roadmap-calendar/helpers"
import type { RoadmapCalendarEvent } from "@/lib/roadmap/calendar"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

function buildEvent(overrides: Partial<RoadmapCalendarEvent> = {}): RoadmapCalendarEvent {
  return {
    id: "event-1",
    orgId: "org-1",
    title: "Customer call",
    description: null,
    eventType: "meeting",
    startsAt: "2026-05-14T15:00:00.000Z",
    endsAt: "2026-05-14T16:00:00.000Z",
    allDay: false,
    recurrence: null,
    status: "active",
    assignedRoles: ["admin"],
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-01T00:00:00.000Z",
    ...overrides,
  }
}

describe("roadmap calendar month agenda", () => {
  it("matches selected-day events by calendar day instead of the Today button path", () => {
    const event = buildEvent()

    expect(roadmapCalendarEventOccursOnDay(event, new Date(2026, 4, 14))).toBe(true)
    expect(roadmapCalendarEventOccursOnDay(event, new Date(2026, 4, 15))).toBe(false)
  })

  it("marks multi-day events on every visible day they touch", () => {
    const event = buildEvent({
      startsAt: new Date(2026, 4, 14, 23, 30).toISOString(),
      endsAt: new Date(2026, 4, 15, 0, 30).toISOString(),
    })

    expect(getRoadmapCalendarEventDates(event).map((date) => date.getDate())).toEqual([
      14,
      15,
    ])
    expect(roadmapCalendarEventOccursOnDay(event, new Date(2026, 4, 15))).toBe(true)
  })

  it("expands recurring events into agenda days and event dots", () => {
    const event = buildEvent({
      recurrence: { frequency: "weekly", count: 3 },
    })
    const dateKeys = getRoadmapCalendarEventDates(event).map((date) =>
      date.toISOString().slice(0, 10),
    )

    expect(roadmapCalendarEventOccursOnDay(event, new Date(2026, 4, 21))).toBe(true)
    expect(roadmapCalendarEventOccursOnDay(event, new Date(2026, 4, 28))).toBe(true)
    expect(roadmapCalendarEventOccursOnDay(event, new Date(2026, 5, 4))).toBe(false)
    expect(dateKeys).toEqual(["2026-05-14", "2026-05-21", "2026-05-28"])
  })

  it("keeps recurring event dots bounded by recurrence end dates", () => {
    const event = buildEvent({
      recurrence: { frequency: "monthly", endDate: "2026-07-31" },
    })
    const dateKeys = getRoadmapCalendarEventDates(event).map((date) =>
      date.toISOString().slice(0, 10),
    )

    expect(roadmapCalendarEventOccursOnDay(event, new Date(2026, 6, 14))).toBe(true)
    expect(roadmapCalendarEventOccursOnDay(event, new Date(2026, 7, 14))).toBe(false)
    expect(dateKeys).toEqual(["2026-05-14", "2026-06-14", "2026-07-14"])
  })

  it("loads month-overlapping and recurring events instead of only starts-inside-month rows", () => {
    const actionSource = readSource("src/actions/roadmap-calendar.ts")
    const calendar = readSource("src/components/roadmap/roadmap-calendar.tsx")

    expect(actionSource).toContain('query.lte("starts_at", to)')
    expect(actionSource).toContain("ends_at.gte.${from}")
    expect(actionSource).toContain("and(ends_at.is.null,starts_at.gte.${from})")
    expect(actionSource).toContain("recurrence.not.is.null")
    expect(actionSource).not.toContain('query.gte("starts_at", from)')
    expect(calendar).toContain("const monthEvents = useMemo")
    expect(calendar).toContain("getRoadmapCalendarEventDates(event).some")
    expect(calendar).toContain("events={monthEvents}")
  })

  it("keeps the popover chrome contained and limits scrolling to the agenda list", () => {
    const viewportControls = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-canvas-v2/components/workspace-canvas-surface-v2-viewport-controls-panel.tsx",
    )
    const agendaPanel = readSource(
      "src/components/roadmap/roadmap-calendar/components/roadmap-calendar-month-agenda-panel.tsx",
    )
    const agendaScrollContainers = agendaPanel.match(/overflow-y-auto/g) ?? []

    expect(viewportControls).toContain("bg-background/95 p-0 shadow-none backdrop-blur-xl")
    expect(viewportControls).not.toContain("bg-transparent")
    expect(viewportControls).not.toContain("backdrop-blur-0")
    expect(viewportControls).not.toContain("max-h-[min(43rem,calc(100svh-7rem))]")
    expect(agendaScrollContainers).toHaveLength(1)
    expect(agendaPanel).not.toContain("shadow-[")
    expect(agendaPanel).not.toContain("shadow-sm")
  })

  it("stretches the month grid evenly across the calendar panel", () => {
    const agendaPanel = readSource(
      "src/components/roadmap/roadmap-calendar/components/roadmap-calendar-month-agenda-panel.tsx",
    )
    const dayButton = readSource(
      "src/components/roadmap/roadmap-calendar/components/roadmap-calendar-day-with-event-dots.tsx",
    )

    expect(agendaPanel).toContain('month_grid: "w-full table-fixed border-collapse"')
    expect(agendaPanel).toContain('weekdays: "w-full border-b border-border/40"')
    expect(agendaPanel).toContain('"w-[14.285714%] pb-2')
    expect(agendaPanel).toContain('weeks: "w-full"')
    expect(agendaPanel).toContain('week: "w-full"')
    expect(agendaPanel).toContain('day: "w-[14.285714%] min-w-0')
    expect(dayButton).toContain("min-h-10 min-w-0")
  })

  it("attributes the shared shadcn calendar root back to the roadmap month-grid owner", () => {
    const agendaPanel = readSource(
      "src/components/roadmap/roadmap-calendar/components/roadmap-calendar-month-agenda-panel.tsx",
    )

    expect(agendaPanel).toContain("getReactGrabOwnerProps")
    expect(agendaPanel).toContain('ownerId: "roadmap-calendar-month-agenda:month-grid"')
    expect(agendaPanel).toContain('component: "RoadmapCalendarMonthAgendaPanel"')
    expect(agendaPanel).toContain('slot: "month-grid"')
    expect(agendaPanel).toContain('primitiveImport: "@/components/ui/calendar"')
  })

  it("keeps the add-event menu in the visible agenda footer without letting the list push it away", () => {
    const agendaPanel = readSource(
      "src/components/roadmap/roadmap-calendar/components/roadmap-calendar-month-agenda-panel.tsx",
    )
    const menuUsages = agendaPanel.match(/<RoadmapCalendarAddEventMenu/g) ?? []
    const addMenuIndex = agendaPanel.indexOf("<RoadmapCalendarAddEventMenu")
    const agendaScrollIndex = agendaPanel.indexOf("overflow-y-auto")

    expect(menuUsages).toHaveLength(1)
    expect(addMenuIndex).toBeGreaterThan(-1)
    expect(agendaScrollIndex).toBeGreaterThan(-1)
    expect(addMenuIndex).toBeGreaterThan(agendaScrollIndex)
    expect(agendaPanel).toContain("mt-3 shrink-0 border-t border-border/40 pt-3")
    expect(agendaPanel).toContain("mt-3 flex min-h-0 flex-1")
    expect(agendaPanel).not.toContain("min-h-[7.5rem]")
    expect(agendaPanel).toContain("disabled={!canManageCalendar}")
    expect(agendaPanel).toContain('variant="outline"')
  })

  it("keeps coaching out of the month-grid header", () => {
    const agendaPanel = readSource(
      "src/components/roadmap/roadmap-calendar/components/roadmap-calendar-month-agenda-panel.tsx",
    )
    const calendar = readSource("src/components/roadmap/roadmap-calendar.tsx")

    expect(agendaPanel).not.toContain("RoadmapCalendarCoachingHeaderAction")
    expect(agendaPanel).not.toContain("CoachingAvatarGroup")
    expect(agendaPanel).not.toContain('slot: "coaching-action"')
    expect(agendaPanel).not.toContain("useCoachingBooking")
    expect(agendaPanel).toContain("shrink-0 whitespace-nowrap text-lg")
    expect(agendaPanel).not.toContain('<span className="min-w-0 truncate whitespace-nowrap leading-snug">')
    expect(agendaPanel).toContain('grid grid-cols-[minmax(0,1fr)_auto] items-center')
    expect(agendaPanel).toContain("flex min-w-0 shrink-0 items-center gap-1.5")
    expect(agendaPanel).toContain(
      "const showTodayButton = !isSameCalendarMonth(month, new Date())",
    )
    expect(agendaPanel).toContain("{showTodayButton ? (")
    expect(agendaPanel).toContain(") : null}")
    expect(agendaPanel).not.toContain("RoadmapCalendarCoachingTab")
    expect(agendaPanel).not.toContain("Add hold")
    expect(agendaPanel).not.toContain("CardContent")
    expect(calendar).not.toContain("isTodaySelected")
  })

  it("keeps event-editor state changes off the month grid render path", () => {
    const calendar = readSource("src/components/roadmap/roadmap-calendar.tsx")
    const agendaPanel = readSource(
      "src/components/roadmap/roadmap-calendar/components/roadmap-calendar-month-agenda-panel.tsx",
    )
    const eventDrawer = readSource(
      "src/components/roadmap/roadmap-calendar/components/roadmap-calendar-event-drawer.tsx",
    )

    expect(calendar).toContain("useCallback")
    expect(calendar).toContain("const handleEditEvent = useCallback")
    expect(calendar).toContain("const formatTimeRange = useCallback")
    expect(agendaPanel).toContain("export const RoadmapCalendarMonthAgendaPanel = memo")
    expect(agendaPanel).toContain("const RoadmapCalendarAgendaRow = memo")
    expect(eventDrawer).toContain("export const RoadmapCalendarEventDrawer = memo")
  })

  it("keeps the add-event controls aligned with shadcn select and menu composition", () => {
    const agendaPanel = readSource(
      "src/components/roadmap/roadmap-calendar/components/roadmap-calendar-month-agenda-panel.tsx",
    )
    const eventDrawer = readSource(
      "src/components/roadmap/roadmap-calendar/components/roadmap-calendar-event-drawer.tsx",
    )

    expect(agendaPanel).toContain("DropdownMenuGroup")
    expect(eventDrawer).toContain("SelectGroup")
    expect(eventDrawer).toContain("DrawerDescription")
    expect(eventDrawer).toContain("ROADMAP_CALENDAR_EVENT_TYPE_META")
    expect(eventDrawer).toContain("eventTypeMeta.badgeClassName")
    expect(eventDrawer).toContain('data-icon="inline-start"')
    expect(eventDrawer).not.toContain("space-y-")
  })

  it("shows event row status and role targeting without adding a second calendar surface", () => {
    const agendaPanel = readSource(
      "src/components/roadmap/roadmap-calendar/components/roadmap-calendar-month-agenda-panel.tsx",
    )

    expect(agendaPanel).toContain("ROLE_LABEL_BY_ID")
    expect(agendaPanel).toContain('roleLabels.join(", ")')
    expect(agendaPanel).toContain("line-through decoration-muted-foreground/60")
    expect(agendaPanel).toContain("Canceled")
  })

  it("keeps full agenda times visible below the event title", () => {
    const agendaPanel = readSource(
      "src/components/roadmap/roadmap-calendar/components/roadmap-calendar-month-agenda-panel.tsx",
    )

    expect(agendaPanel).toContain("grid-cols-[auto_minmax(0,1fr)]")
    expect(agendaPanel).toContain("whitespace-normal")
    expect(agendaPanel).not.toContain("grid-cols-[auto_3.75rem_minmax(0,1fr)]")
    expect(agendaPanel).not.toContain("truncate text-left text-xs text-muted-foreground/70 tabular-nums")
  })
})
