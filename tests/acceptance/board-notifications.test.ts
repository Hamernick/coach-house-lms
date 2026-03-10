import { beforeEach, describe, expect, it, vi } from "vitest"

const { createNotificationMock } = vi.hoisted(() => ({
  createNotificationMock: vi.fn(),
}))

vi.mock("@/lib/notifications", () => ({
  createNotification: createNotificationMock,
}))

import {
  buildBoardMeetingReminderMetadata,
  buildBoardMeetingReminderPlan,
} from "@/features/board-notifications"
import {
  clearBoardMeetingReminderNotificationsForEvent,
  runBoardMeetingReminderSweep,
} from "@/features/board-notifications/server/actions"
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

type BoardReminderSupabaseStubOptions = {
  events?: Array<Record<string, unknown>>
  memberships?: Array<Record<string, unknown>>
  notifications?: Array<Record<string, unknown>>
}

function createBoardReminderSupabaseStub({
  events = [],
  memberships = [],
  notifications = [],
}: BoardReminderSupabaseStubOptions = {}) {
  const eventsReturns = vi.fn().mockResolvedValue({ data: events, error: null })
  const membershipsReturns = vi.fn().mockResolvedValue({ data: memberships, error: null })
  const notificationsReturns = vi.fn().mockResolvedValue({ data: notifications, error: null })
  const notificationsDeleteIn = vi.fn().mockResolvedValue({ error: null })

  const from = vi.fn((table: string) => {
    if (table === "roadmap_calendar_internal_events") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              returns: eventsReturns,
            }),
          }),
        }),
      }
    }

    if (table === "organization_memberships") {
      return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              returns: membershipsReturns,
            }),
          }),
        }),
      }
    }

    if (table === "notifications") {
      const notificationRecipientFilter = {
        in: vi.fn().mockReturnValue({
          returns: notificationsReturns,
        }),
        returns: notificationsReturns,
      }

      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue(notificationRecipientFilter),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          in: notificationsDeleteIn,
        }),
      }
    }

    throw new Error(`Unexpected table access: ${table}`)
  })

  return {
    supabase: { from },
    notificationsDeleteIn,
  }
}

describe("board notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createNotificationMock.mockResolvedValue({ ok: true })
  })

  it("plans one reminder per board member when a board meeting is 7 days away", () => {
    const event = buildEvent()

    const plan = buildBoardMeetingReminderPlan({
      events: [event],
      memberships: [{ orgId: "org-1", recipientId: "board-1" }],
      existingNotifications: [],
      now: new Date("2026-03-08T09:00:00.000Z"),
    })

    expect(plan.candidates).toHaveLength(1)
    expect(plan.dueEvents).toBe(1)
    expect(plan.candidates[0]).toMatchObject({
      userId: "board-1",
      orgId: "org-1",
      title: "Board meeting is in 7 days",
      metadata: {
        eventId: "event-1",
        reminderWindowDays: 7,
        recipientId: "board-1",
      },
    })
  })

  it("does not suppress a new annual reminder when only a prior year's occurrence was sent", () => {
    const event = buildEvent({
      startsAt: "2025-03-15T15:00:00.000Z",
      endsAt: "2025-03-15T16:00:00.000Z",
      recurrence: { frequency: "annual" },
    })

    const plan = buildBoardMeetingReminderPlan({
      events: [event],
      memberships: [{ orgId: "org-1", recipientId: "board-1" }],
      existingNotifications: [
        {
          id: "notif-last-year",
          userId: "board-1",
          orgId: "org-1",
          metadata: buildBoardMeetingReminderMetadata({
            eventId: "event-1",
            reminderWindowDays: 7,
            recipientId: "board-1",
            occurrenceStartsAt: "2025-03-15T15:00:00.000Z",
          }),
        },
      ],
      now: new Date("2026-03-08T12:00:00.000Z"),
    })

    expect(plan.candidates).toHaveLength(1)
    expect(plan.skippedExisting).toBe(0)
    expect(plan.candidates[0]?.metadata.occurrenceStartsAt).toBe("2026-03-15T15:00:00.000Z")
  })

  it("creates notifications through the sweep and respects metadata dedupe on reruns", async () => {
    const notificationMetadata = buildBoardMeetingReminderMetadata({
      eventId: "event-1",
      reminderWindowDays: 7,
      recipientId: "board-1",
      occurrenceStartsAt: "2026-03-15T15:00:00.000Z",
    })

    const baseEventRow = {
      id: "event-1",
      org_id: "org-1",
      title: "Board meeting",
      description: "Quarterly governance review",
      event_type: "board_meeting",
      starts_at: "2026-03-15T15:00:00.000Z",
      ends_at: "2026-03-15T16:00:00.000Z",
      all_day: false,
      recurrence: null,
      status: "active",
      assigned_roles: ["board"],
      created_at: "2026-03-01T00:00:00.000Z",
      updated_at: "2026-03-01T00:00:00.000Z",
    }

    const baseMembershipRow = {
      org_id: "org-1",
      member_id: "board-1",
    }

    const firstRun = createBoardReminderSupabaseStub({
      events: [baseEventRow],
      memberships: [baseMembershipRow],
      notifications: [],
    })

    const firstResult = await runBoardMeetingReminderSweep({
      now: new Date("2026-03-08T12:00:00.000Z"),
      supabase: firstRun.supabase as never,
    })

    expect(firstResult.created).toBe(1)
    expect(createNotificationMock).toHaveBeenCalledWith(
      firstRun.supabase,
      expect.objectContaining({
        userId: "board-1",
        type: "board_meeting_reminder",
        metadata: notificationMetadata,
      }),
    )

    createNotificationMock.mockClear()

    const secondRun = createBoardReminderSupabaseStub({
      events: [baseEventRow],
      memberships: [baseMembershipRow],
      notifications: [
        {
          id: "notif-1",
          user_id: "board-1",
          org_id: "org-1",
          metadata: notificationMetadata,
        },
      ],
    })

    const secondResult = await runBoardMeetingReminderSweep({
      now: new Date("2026-03-08T12:00:00.000Z"),
      supabase: secondRun.supabase as never,
    })

    expect(secondResult.created).toBe(0)
    expect(secondResult.skippedExisting).toBe(1)
    expect(createNotificationMock).not.toHaveBeenCalled()
  })

  it("clears only reminder notifications attached to the specified board event", async () => {
    const supabase = createBoardReminderSupabaseStub({
      notifications: [
        {
          id: "notif-1",
          user_id: "board-1",
          org_id: "org-1",
          metadata: buildBoardMeetingReminderMetadata({
            eventId: "event-1",
            reminderWindowDays: 7,
            recipientId: "board-1",
            occurrenceStartsAt: "2026-03-15T15:00:00.000Z",
          }),
        },
        {
          id: "notif-2",
          user_id: "board-1",
          org_id: "org-1",
          metadata: buildBoardMeetingReminderMetadata({
            eventId: "event-2",
            reminderWindowDays: 1,
            recipientId: "board-1",
            occurrenceStartsAt: "2026-03-12T15:00:00.000Z",
          }),
        },
      ],
    })

    const deletedCount = await clearBoardMeetingReminderNotificationsForEvent({
      eventId: "event-1",
      orgId: "org-1",
      supabase: supabase.supabase as never,
    })

    expect(deletedCount).toBe(1)
    expect(supabase.notificationsDeleteIn).toHaveBeenCalledWith("id", ["notif-1"])
  })
})
