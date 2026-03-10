import { describe, expect, it } from "vitest"

import { buildMyOrganizationCalendarView } from "@/app/(dashboard)/my-organization/_lib/calendar"
import type { UpcomingEvent } from "@/app/(dashboard)/my-organization/_lib/types"

function buildEvent(overrides: Partial<UpcomingEvent>): UpcomingEvent {
  return {
    id: "event-1",
    title: "Board meeting",
    description: "Monthly board sync",
    event_type: "board_meeting",
    starts_at: "2026-02-10T15:00:00.000Z",
    ends_at: "2026-02-10T16:00:00.000Z",
    all_day: false,
    recurrence: null,
    status: "active",
    assigned_roles: ["admin", "board"],
    ...overrides,
  }
}

describe("my organization calendar view", () => {
  it("keeps enriched upcoming event metadata on the view payload", () => {
    const upcomingEvents = [
      buildEvent({ id: "event-1", title: "Board meeting" }),
      buildEvent({
        id: "event-2",
        title: "Grant deadline",
        starts_at: "2026-02-21T18:00:00.000Z",
        ends_at: "2026-02-21T19:00:00.000Z",
        assigned_roles: ["admin", "staff"],
      }),
    ]

    const view = buildMyOrganizationCalendarView({
      monthParam: "2026-02",
      searchParams: { view: "workspace" },
      upcomingEvents,
    })

    expect(view.nextEvent?.id).toBe("event-1")
    expect(view.upcomingEvents).toHaveLength(2)
    expect(view.upcomingEvents[0]?.assigned_roles).toEqual(["admin", "board"])
    expect(view.upcomingEvents[1]?.title).toBe("Grant deadline")
  })

  it("only marks event days that belong to the displayed month", () => {
    const view = buildMyOrganizationCalendarView({
      monthParam: "2026-02",
      upcomingEvents: [
        buildEvent({ starts_at: "2026-02-08T15:00:00.000Z" }),
        buildEvent({
          id: "event-2",
          starts_at: "2026-03-02T15:00:00.000Z",
          ends_at: "2026-03-02T16:00:00.000Z",
        }),
      ],
    })

    expect(view.eventDays.has(8)).toBe(true)
    expect(view.eventDays.has(2)).toBe(false)
  })
})
