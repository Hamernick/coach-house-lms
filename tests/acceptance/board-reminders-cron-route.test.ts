import { beforeEach, describe, expect, it, vi } from "vitest"

const { authorizeBoardReminderCronRequestMock, runBoardMeetingReminderSweepMock } = vi.hoisted(() => ({
  authorizeBoardReminderCronRequestMock: vi.fn(),
  runBoardMeetingReminderSweepMock: vi.fn(),
}))

vi.mock("@/features/board-notifications/server/actions", () => ({
  authorizeBoardReminderCronRequest: authorizeBoardReminderCronRequestMock,
  runBoardMeetingReminderSweep: runBoardMeetingReminderSweepMock,
}))

import { GET } from "@/app/api/internal/cron/board-reminders/route"

describe("board reminders cron route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("rejects unauthorized requests", async () => {
    authorizeBoardReminderCronRequestMock.mockReturnValue({
      ok: false,
      status: 401,
      error: "Unauthorized",
    })

    const response = await GET(new Request("http://localhost/api/internal/cron/board-reminders"))
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json).toEqual({ error: "Unauthorized" })
    expect(runBoardMeetingReminderSweepMock).not.toHaveBeenCalled()
  })

  it("returns the sweep payload for authorized requests", async () => {
    authorizeBoardReminderCronRequestMock.mockReturnValue({ ok: true })
    runBoardMeetingReminderSweepMock.mockResolvedValue({
      candidates: [],
      eventsScanned: 3,
      dueEvents: 1,
      skippedExisting: 2,
      skippedNoRecipients: 0,
      created: 1,
    })

    const response = await GET(
      new Request("http://localhost/api/internal/cron/board-reminders", {
        headers: { authorization: "Bearer test-secret" },
      }),
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toMatchObject({
      eventsScanned: 3,
      dueEvents: 1,
      skippedExisting: 2,
      created: 1,
    })
  })
})
