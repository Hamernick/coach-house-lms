import { describe, expect, it } from "vitest"

import { buildCalendarStripEventPreview } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-calendar-card-strip-data"
import type { UpcomingEvent } from "@/app/(dashboard)/my-organization/_lib/types"

function buildEvent(overrides: Partial<UpcomingEvent> = {}): UpcomingEvent {
  return {
    id: "event-1",
    title: "Board check-in",
    description: "Review board packet and confirm invites.",
    event_type: "board_meeting",
    starts_at: "2026-03-09T15:00:00.000Z",
    ends_at: "2026-03-09T16:00:00.000Z",
    all_day: false,
    recurrence: null,
    status: "active",
    assigned_roles: ["board"],
    ...overrides,
  }
}

describe("workspace board calendar strip data", () => {
  it("keeps the backing event payload on real event preview items", () => {
    const event = buildEvent()

    const preview = buildCalendarStripEventPreview({
      visibleEvents: [event],
      selectedDayEvents: [event],
    })

    expect(preview.selectedDayEventCount).toBe(1)
    expect(preview.eventItems[0]).toMatchObject({
      id: "event-1",
      title: "Board check-in",
      invitesLabel: "Invites: board",
      detailDescription: "Review board packet and confirm invites.",
      isPreview: false,
      event,
    })
  })

  it("returns preview-detail content when no real events exist yet", () => {
    const preview = buildCalendarStripEventPreview({
      visibleEvents: [],
      selectedDayEvents: [],
    })

    expect(preview.selectedDayEventCount).toBe(2)
    expect(preview.eventItems[0]).toMatchObject({
      id: "preview-event-1",
      event: null,
      isPreview: true,
    })
    expect(preview.eventItems[0]?.detailDescription).toContain("recurring board check-in")
  })
})
