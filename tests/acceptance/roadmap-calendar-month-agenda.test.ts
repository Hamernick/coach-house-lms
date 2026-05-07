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

    expect(agendaPanel).toContain('month_grid: "block w-full border-collapse"')
    expect(agendaPanel).toContain('weekdays: "grid w-full grid-cols-7')
    expect(agendaPanel).toContain('weeks: "block w-full"')
    expect(agendaPanel).toContain('day: "min-w-0 aspect-square')
    expect(dayButton).toContain("min-h-10 min-w-0")
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
