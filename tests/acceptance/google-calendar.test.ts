import { afterEach, describe, expect, it, vi } from "vitest"
import {
  calendarEventOccursOnDay,
  mergeCalendarPage,
  normalizeCalendarSettings,
  normalizeGoogleEvent,
} from "@/features/google-calendar/lib"
import type {
  CalendarEvent,
  GoogleEvent,
} from "@/features/google-calendar/types"

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.resetModules()
})
function serverConfig() {
  for (const [key, value] of Object.entries({
    GOOGLE_CALENDAR_ENABLED: "true",
    GOOGLE_CALENDAR_CLIENT_ID: "test-client",
    GOOGLE_CALENDAR_CLIENT_SECRET: "test-secret",
    GOOGLE_CALENDAR_REDIRECT_URI:
      "https://coachhouse.test/api/integrations/google-calendar/callback",
    GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEYS: JSON.stringify({
      v1: Buffer.alloc(32, 7).toString("base64"),
    }),
    GOOGLE_CALENDAR_TOKEN_ENCRYPTION_CURRENT_VERSION: "v1",
  }))
    vi.stubEnv(key, value)
}
const event: GoogleEvent = {
  id: "event",
  summary: "Meeting",
  start: { dateTime: "2026-09-08T14:00:00Z" },
  end: { dateTime: "2026-09-08T15:00:00Z" },
}
describe("Google Calendar personal sync", () => {
  it("requires bounded distinct choices and a real time zone", () => {
    expect(
      normalizeCalendarSettings({
        calendarIds: ["primary"],
        exportBoard: false,
        timeZone: "America/New_York",
      }).calendarIds
    ).toEqual(["primary"])
    for (const body of [
      null,
      { calendarIds: ["x", "x"], exportBoard: false, timeZone: "UTC" },
      {
        calendarIds: Array.from({ length: 6 }, (_, i) => String(i)),
        exportBoard: false,
        timeZone: "UTC",
      },
      { calendarIds: [], exportBoard: true, timeZone: "Not/AZone" },
    ])
      expect(() => normalizeCalendarSettings(body)).toThrow()
  })
  it("never imports Coach House exports or unsafe links", () => {
    expect(
      normalizeGoogleEvent(
        {
          ...event,
          extendedProperties: { private: { coachHouseEvent: "board-event" } },
        },
        "a",
        "Work"
      )
    ).toBeNull()
    expect(
      normalizeGoogleEvent(
        { ...event, htmlLink: "javascript:alert(1)" },
        "a",
        "Work"
      )?.url
    ).toBeNull()
    expect(
      normalizeGoogleEvent(
        {
          ...event,
          htmlLink: "https://calendar.google.com/calendar/event?eid=abc",
        },
        "a",
        "Work"
      )?.url
    ).toContain("calendar.google.com")
  })
  it("merges recurring instances, updates, and cancellations idempotently", () => {
    const initial = mergeCalendarPage(
      [],
      [event, { ...event, id: "instance_1" }],
      "a",
      "Work",
      "2026-09-01",
      "2026-10-01"
    )
    const changes = [
      { ...event, summary: "Changed" },
      { id: "instance_1", status: "cancelled" },
    ]
    const merged = mergeCalendarPage(
      initial,
      changes,
      "a",
      "Work",
      "2026-09-01",
      "2026-10-01"
    )
    expect(merged).toHaveLength(1)
    expect(merged[0].title).toBe("Changed")
    expect(
      mergeCalendarPage(
        merged,
        changes,
        "a",
        "Work",
        "2026-09-01",
        "2026-10-01"
      )
    ).toEqual(merged)
  })
  it("preserves all-day exclusive ends across days and months", () => {
    const allDay = normalizeGoogleEvent(
      {
        id: "trip",
        start: { date: "2026-09-30" },
        end: { date: "2026-10-02" },
      },
      "a",
      "Home"
    ) as CalendarEvent
    expect(calendarEventOccursOnDay(allDay, new Date(2026, 8, 30))).toBe(true)
    expect(calendarEventOccursOnDay(allDay, new Date(2026, 9, 1))).toBe(true)
    expect(calendarEventOccursOnDay(allDay, new Date(2026, 9, 2))).toBe(false)
  })
  it("binds encrypted tokens to their user and purpose", async () => {
    serverConfig()
    const { encryptCalendarSecret, decryptCalendarSecret } =
      await import("@/features/google-calendar/server/token-crypto")
    const secret = encryptCalendarSecret("private-token", "user-a")
    expect(secret.ciphertext).not.toContain("private-token")
    expect(decryptCalendarSecret(secret, "user-a")).toBe("private-token")
    expect(() => decryptCalendarSecret(secret, "user-b")).toThrow()
    expect(() =>
      decryptCalendarSecret(
        { ...secret, authTag: Buffer.alloc(16).toString("base64") },
        "user-a"
      )
    ).toThrow()
  })
  it("keeps pagination on the same cursor and resets expired cursors", async () => {
    serverConfig()
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ items: [event], nextPageToken: "page-2" })
        )
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ items: [], nextSyncToken: "new-cursor" }))
      )
      .mockResolvedValueOnce(new Response("", { status: 410 }))
    vi.stubGlobal("fetch", fetchMock)
    const { importCalendarPage, newCalendarCache } =
      await import("@/features/google-calendar/server/sync-import")
    const choice = { id: "primary", name: "Personal", timeZone: "UTC" }
    const first = await importCalendarPage("token", choice, {
      ...newCalendarCache(),
      syncToken: "original-cursor",
    })
    const second = await importCalendarPage("token", choice, first)
    const query1 = new URL(fetchMock.mock.calls[0][0]).searchParams
    const query2 = new URL(fetchMock.mock.calls[1][0]).searchParams
    expect(query1.get("syncToken")).toBe("original-cursor")
    expect(query1.has("timeMin")).toBe(false)
    expect(query1.has("timeMax")).toBe(false)
    expect(query2.get("syncToken")).toBe("original-cursor")
    expect(query2.get("pageToken")).toBe("page-2")
    expect(second.syncToken).toBe("new-cursor")
    expect(second.pageToken).toBeUndefined()
    const reset = await importCalendarPage("token", choice, second)
    expect(reset.syncToken).toBeUndefined()
    expect(reset.events).toEqual([])
  })
  it("uses real recurrence rules, stable IDs, and date-only all-day exports", async () => {
    const { exportEventBody, exportEventId } =
      await import("@/features/google-calendar/server/sync-export")
    const base = {
      id: "board",
      orgId: "org",
      title: "Quarterly board",
      description: "<script>bad()</script><b>Agenda</b>",
      startsAt: "2026-09-08T04:00:00Z",
      endsAt: "2026-09-09T04:00:00Z",
      allDay: true,
      status: "active",
      eventType: "board_meeting",
      assignedRoles: [],
      createdAt: "2026-09-01",
      updatedAt: "2026-09-01",
      recurrence: { frequency: "quarterly", count: 4 },
    } as const
    const body = exportEventBody(
      { ...base, assignedRoles: [] },
      "America/New_York"
    )
    expect(body.start).toEqual({ date: "2026-09-08" })
    expect(body.end).toEqual({ date: "2026-09-09" })
    expect(body.recurrence).toEqual(["RRULE:FREQ=MONTHLY;INTERVAL=3;COUNT=4"])
    expect(body.description).toBe("Agenda")
    expect(exportEventId("org", "board")).toMatch(/^[0-9a-v]{5,1024}$/)
    expect(exportEventId("org", "board")).not.toBe(
      exportEventId("another-org", "board")
    )
  })
  it.each([
    "openid email",
    "https://www.googleapis.com/auth/calendar.events.readonly",
    "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
  ])("rejects tokens without both required Calendar scopes: %s", async (scope) => {
    serverConfig()
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({
          access_token: "test-access",
          id_token: "test-identity",
          scope,
        }), { status: 200 })
      )
    )
    const { exchangeCalendarCode } =
      await import("@/features/google-calendar/server/google-api")
    await expect(
      exchangeCalendarCode("test-code", "test-verifier")
    ).rejects.toMatchObject({ code: "scope_denied" })
  })
  it("maps provider quota errors separately from missing calendar access", async () => {
    serverConfig()
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({
              error: { errors: [{ reason: "userRateLimitExceeded" }] },
            }),
            { status: 403 }
          )
        )
    )
    const { calendarRequest } =
      await import("@/features/google-calendar/server/google-api")
    await expect(
      calendarRequest("token", "users/me/calendarList")
    ).rejects.toMatchObject({ code: "rate_limited" })
  })
})
