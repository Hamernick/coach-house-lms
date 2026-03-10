import { beforeEach, describe, expect, it, vi } from "vitest"

const {
  createSupabaseAdminClientMock,
  createNotificationMock,
  clearBoardMeetingReminderNotificationsForEventMock,
  syncBoardMeetingReminderNotificationsForEventMock,
} = vi.hoisted(() => ({
  createSupabaseAdminClientMock: vi.fn(),
  createNotificationMock: vi.fn(),
  clearBoardMeetingReminderNotificationsForEventMock: vi.fn(),
  syncBoardMeetingReminderNotificationsForEventMock: vi.fn(),
}))

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: createSupabaseAdminClientMock,
}))

vi.mock("@/lib/notifications", () => ({
  createNotification: createNotificationMock,
}))

vi.mock("@/features/board-notifications/server/actions", () => ({
  clearBoardMeetingReminderNotificationsForEvent:
    clearBoardMeetingReminderNotificationsForEventMock,
  syncBoardMeetingReminderNotificationsForEvent:
    syncBoardMeetingReminderNotificationsForEventMock,
}))

import { notifyCalendarChange } from "@/actions/roadmap-calendar-helpers"
import type { RoadmapCalendarEvent } from "@/lib/roadmap/calendar"

function buildEvent(overrides: Partial<RoadmapCalendarEvent> = {}): RoadmapCalendarEvent {
  return {
    id: "event-1",
    orgId: "org-1",
    title: "Board meeting",
    description: "Quarterly governance review",
    eventType: "board_meeting",
    startsAt: "2026-03-15T15:00:00.000Z",
    endsAt: "2026-03-15T16:00:00.000Z",
    allDay: false,
    recurrence: null,
    status: "active",
    assignedRoles: ["board"],
    createdAt: "2026-03-01T00:00:00.000Z",
    updatedAt: "2026-03-01T00:00:00.000Z",
    ...overrides,
  }
}

function createCalendarAdminStub() {
  const membershipsReturns = vi.fn().mockResolvedValue({
    data: [{ member_id: "admin-1", role: "admin" }],
    error: null,
  })
  const settingsMaybeSingle = vi.fn().mockResolvedValue({
    data: { staff_can_manage_calendar: false },
    error: null,
  })

  const from = vi.fn((table: string) => {
    if (table === "organization_memberships") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              returns: membershipsReturns,
            }),
          }),
        }),
      }
    }

    if (table === "organization_access_settings") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: settingsMaybeSingle,
          }),
        }),
      }
    }

    throw new Error(`Unexpected table access: ${table}`)
  })

  return { from }
}

describe("roadmap calendar board reminder sync", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createNotificationMock.mockResolvedValue({ ok: true })
    clearBoardMeetingReminderNotificationsForEventMock.mockResolvedValue(0)
    syncBoardMeetingReminderNotificationsForEventMock.mockResolvedValue({
      candidates: [],
      eventsScanned: 1,
      dueEvents: 0,
      skippedExisting: 0,
      skippedNoRecipients: 0,
      created: 0,
    })
  })

  it("clears and resyncs reminders when an internal board meeting is updated", async () => {
    const supabase = createCalendarAdminStub()
    createSupabaseAdminClientMock.mockReturnValue(supabase)

    await notifyCalendarChange({
      orgId: "org-1",
      actorId: "owner-1",
      calendarType: "internal",
      action: "updated",
      event: buildEvent(),
    })

    expect(clearBoardMeetingReminderNotificationsForEventMock).toHaveBeenCalledWith({
      eventId: "event-1",
      orgId: "org-1",
      supabase,
    })
    expect(syncBoardMeetingReminderNotificationsForEventMock).toHaveBeenCalledWith({
      event: expect.objectContaining({ id: "event-1" }),
      supabase,
    })
  })

  it("only clears reminders when the board meeting is deleted", async () => {
    const supabase = createCalendarAdminStub()
    createSupabaseAdminClientMock.mockReturnValue(supabase)

    await notifyCalendarChange({
      orgId: "org-1",
      actorId: "owner-1",
      calendarType: "internal",
      action: "deleted",
      event: buildEvent(),
    })

    expect(clearBoardMeetingReminderNotificationsForEventMock).toHaveBeenCalledTimes(1)
    expect(syncBoardMeetingReminderNotificationsForEventMock).not.toHaveBeenCalled()
  })
})
