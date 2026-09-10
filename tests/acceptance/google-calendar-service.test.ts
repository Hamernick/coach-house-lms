import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { CalendarState } from "@/features/google-calendar/types"

type Row = Record<string, unknown>
let tables: Record<string, Row[]>
let calls: string[]
function database() {
  return {
    from(table: string) {
      calls.push(table)
      const filters: ((row: Row) => boolean)[] = []
      let operation = "read"
      let values: Row = {}
      let single = false
      const run = () => {
        const rows = tables[table] ?? []
        const matched = rows.filter((row) =>
          filters.every((filter) => filter(row))
        )
        let result = matched
        if (operation === "update")
          matched.forEach((row) => Object.assign(row, structuredClone(values)))
        if (operation === "delete")
          tables[table] = rows.filter((row) => !matched.includes(row))
        if (operation === "insert" || operation === "upsert") {
          const existing =
            operation === "upsert"
              ? rows.find((row) => row.user_id === values.user_id)
              : null
          if (existing) Object.assign(existing, structuredClone(values))
          else {
            rows.push(structuredClone(values))
            tables[table] = rows
          }
          result = [existing ?? rows[rows.length - 1]]
        }
        return {
          data: structuredClone(single ? (result[0] ?? null) : result),
          error: null,
        }
      }
      const chain = {
        select: () => chain,
        eq: (key: string, value: unknown) => {
          filters.push((row) => row[key] === value)
          return chain
        },
        gt: (key: string, value: string) => {
          filters.push((row) => String(row[key]) > value)
          return chain
        },
        is: (key: string, value: unknown) => {
          filters.push((row) => row[key] === value)
          return chain
        },
        update: (input: Row) => {
          operation = "update"
          values = input
          return chain
        },
        upsert: (input: Row) => {
          operation = "upsert"
          values = input
          return chain
        },
        insert: (input: Row) => {
          operation = "insert"
          values = input
          return chain
        },
        delete: () => {
          operation = "delete"
          return chain
        },
        maybeSingle: () => {
          single = true
          return Promise.resolve(run())
        },
        then: (resolve: (value: ReturnType<typeof run>) => unknown) =>
          Promise.resolve(run()).then(resolve),
      }
      return chain
    },
  }
}
const state = (): CalendarState => ({
  selected: [{ id: "personal", name: "Private calendar", timeZone: "UTC" }],
  caches: {
    personal: {
      from: "2026-09-01",
      to: "2026-10-01",
      fullStartedAt: "2026-09-01",
      syncToken: "cursor",
      events: [
        {
          id: "private-event",
          calendarId: "personal",
          calendarName: "Private calendar",
          title: "Private appointment",
          start: "2026-09-08T14:00:00Z",
          end: "2026-09-08T15:00:00Z",
          allDay: false,
          url: null,
        },
      ],
    },
  },
  destinations: {},
})
const row = (userId: string) => ({
  user_id: userId,
  google_subject: "google-" + userId,
  google_email: userId + "@example.invalid",
  status: "connected",
  enabled: true,
  refresh_secret: { ciphertext: "encrypted" },
  granted_scopes: [],
  revision: "revision-1",
  lease_id: null,
  lease_expires_at: null,
  export_org_id: null,
  state: state(),
  time_zone: "UTC",
  last_synced_at: null,
  last_error: null,
  next_sync_at: "2026-09-01",
})
beforeEach(() => {
  tables = {
    google_calendar_connections: [row("user-a")],
    google_calendar_oauth_intents: [],
  }
  calls = []
  vi.doMock("@/lib/supabase/admin", () => ({
    createSupabaseAdminClient: database,
  }))
  vi.doMock("@/features/google-calendar/server/config", () => ({
    calendarConfigured: () => true,
    calendarConfig: () => ({
      clientId: "test",
      clientSecret: "test",
      redirectUri: "https://app.test/api/integrations/google-calendar/callback",
    }),
    CALENDAR_EXPORT_SCOPE: "export",
    CALENDAR_LIST_SCOPE: "list",
    CALENDAR_READ_SCOPE: "read",
  }))
  vi.stubEnv(
    "GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEYS",
    JSON.stringify({ v1: Buffer.alloc(32, 3).toString("base64") })
  )
  vi.stubEnv("GOOGLE_CALENDAR_TOKEN_ENCRYPTION_CURRENT_VERSION", "v1")
})
afterEach(() => {
  for (const modulePath of [
    "@/lib/supabase/admin",
    "@/features/google-calendar/server/config",
    "@/features/google-calendar/server/google-api",
    "@/lib/supabase/route",
    "@/lib/organization/active-org",
  ])
    vi.doUnmock(modulePath)
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.resetModules()
})
describe("Calendar connection isolation and cancellation", () => {
  it("only returns the requesting user's private events and safe summary", async () => {
    const service = await import("@/features/google-calendar/server/service")
    expect(
      await service.personalCalendarEvents("user-b", "2026-09-01", "2026-10-01")
    ).toEqual([])
    expect(
      await service.personalCalendarEvents("user-a", "2026-09-01", "2026-10-01")
    ).toHaveLength(1)
    const summary = JSON.stringify(
      await service.calendarSummary("user-a", "org-a")
    )
    expect(summary).not.toContain("encrypted")
    expect(summary).not.toContain("Private appointment")
    expect(calls).not.toContain("roadmap_calendar_internal_events")
  })
  it("pauses immediately, hides imports, and rejects an in-flight worker's stale write", async () => {
    const store = await import("@/features/google-calendar/server/store")
    const { setCalendarEnabled, personalCalendarEvents } =
      await import("@/features/google-calendar/server/service")
    const original = await store.getConnection("user-a")
    await setCalendarEnabled("user-a", false)
    await expect(
      store.updateConnection(original!, { last_synced_at: "2026-09-08" })
    ).rejects.toMatchObject({ code: "sync_busy" })
    expect(
      await personalCalendarEvents("user-a", "2026-09-01", "2026-10-01")
    ).toEqual([])
    expect(
      (tables.google_calendar_connections[0].state as CalendarState).selected
    ).toHaveLength(1)
  })
  it("disconnects Calendar locally while preserving other Google services and exported copies", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
    const { disconnectCalendar } =
      await import("@/features/google-calendar/server/service")
    await disconnectCalendar("user-a")
    const disconnected = tables.google_calendar_connections[0]
    expect(disconnected.refresh_secret).toBeNull()
    expect(disconnected.enabled).toBe(false)
    expect((disconnected.state as CalendarState).caches).toEqual({})
    expect(fetchMock).not.toHaveBeenCalled()
    expect(calls.every((table) => table.startsWith("google_calendar_"))).toBe(
      true
    )
  })
  it("allows only one claim and rejects work after disconnect", async () => {
    const store = await import("@/features/google-calendar/server/store")
    const original = await store.getConnection("user-a")
    const claimed = await store.updateConnection(original!, {
      revision: "worker-1",
      lease_id: "lease",
      lease_expires_at: new Date(Date.now() + 60000).toISOString(),
    })
    await expect(
      store.updateConnection(original!, { revision: "worker-2" })
    ).rejects.toMatchObject({ code: "sync_busy" })
    const { disconnectCalendar } =
      await import("@/features/google-calendar/server/service")
    await disconnectCalendar("user-a")
    await expect(store.requireActiveLease(claimed)).rejects.toMatchObject({
      code: "sync_paused",
    })
  })
  it("binds one-time OAuth state to the signed-in user and rejects replay", async () => {
    vi.doMock(
      "@/features/google-calendar/server/google-api",
      () => ({
        exchangeCalendarCode: vi.fn().mockResolvedValue({
          tokens: { refresh_token: "test-refresh" },
          subject: "new-sub",
          email: "test@example.invalid",
          scopes: ["read", "list"],
        }),
        refreshCalendarToken: vi.fn(),
      })
    )
    const oauth = await import("@/features/google-calendar/server/oauth")
    const url = new URL(await oauth.startCalendarConnection("user-a"))
    const intentState = url.searchParams.get("state")!
    expect(url.searchParams.get("code_challenge_method")).toBe("S256")
    await expect(
      oauth.completeCalendarConnection("user-b", intentState, "code")
    ).rejects.toMatchObject({ code: "invalid_state" })
    await oauth.completeCalendarConnection("user-a", intentState, "code")
    await expect(
      oauth.completeCalendarConnection("user-a", intentState, "code")
    ).rejects.toMatchObject({ code: "invalid_state" })
    expect(tables.google_calendar_connections[0].enabled).toBe(false)
    expect(
      (tables.google_calendar_connections[0].state as CalendarState).caches
    ).toEqual({})
  })
})

it.each(["openid email", "read", "list", ""])(
  "keeps OAuth state usable when an incomplete grant is corrected: %s",
  async (reportedScope) => {
    vi.doMock("@/lib/supabase/route", () => ({
      createSupabaseRouteHandlerClient: () => ({
        auth: {
          getUser: async () => ({
            data: { user: { id: "user-a" } },
            error: null,
          }),
        },
      }),
    }))
    vi.doMock("@/lib/organization/active-org", () => ({
      resolveActiveOrganization: async () => ({ orgId: "org-current" }),
    }))
    vi.doMock("@/features/google-calendar/server/google-api", () => ({
      exchangeCalendarCode: vi.fn().mockResolvedValue({
        tokens: { refresh_token: "test-refresh" },
        subject: "new-sub",
        email: "test@example.invalid",
        scopes: ["read", "list"],
      }),
      refreshCalendarToken: vi.fn(),
    }))
    const { NextRequest } = await import("next/server")
    const { startCalendarConnection } =
      await import("@/features/google-calendar/server/oauth")
    const { calendarCallback } =
      await import("@/features/google-calendar/server/actions")
    const { exchangeCalendarCode } =
      await import("@/features/google-calendar/server/google-api")
    const authorization = new URL(await startCalendarConnection("user-a"))
    const callback = new URL(
      "https://app.test/api/integrations/google-calendar/callback"
    )
    callback.searchParams.set("state", authorization.searchParams.get("state")!)
    callback.searchParams.set("code", "incomplete-grant-code")
    callback.searchParams.set("scope", reportedScope)

    const incomplete = await calendarCallback(new NextRequest(callback))
    expect(incomplete.headers.get("location")).toContain("googleCalendar=scope_denied")
    expect(exchangeCalendarCode).not.toHaveBeenCalled()
    expect(tables.google_calendar_oauth_intents).toHaveLength(1)

    callback.searchParams.set("code", "corrected-grant-code")
    callback.searchParams.set("scope", "openid email read list")
    const corrected = await calendarCallback(new NextRequest(callback))
    expect(corrected.headers.get("location")).toContain("googleCalendar=setup")
    expect(exchangeCalendarCode).toHaveBeenCalledTimes(1)
    expect(tables.google_calendar_oauth_intents).toHaveLength(0)
    expect(tables.google_calendar_connections[0].google_subject).toBe("new-sub")
    expect(tables.google_calendar_connections[0].enabled).toBe(false)

    const replay = await calendarCallback(new NextRequest(callback))
    expect(replay.headers.get("location")).toContain("googleCalendar=invalid_state")
    expect(exchangeCalendarCode).toHaveBeenCalledTimes(1)
  }
)

it("rejects cross-origin mutations, changed workspaces, and forged event owners", async () => {
  vi.doMock("@/lib/supabase/route", () => ({
    createSupabaseRouteHandlerClient: () => ({
      auth: {
        getUser: async () => ({
          data: { user: { id: "user-b" } },
          error: null,
        }),
      },
    }),
  }))
  vi.doMock("@/lib/organization/active-org", () => ({
    resolveActiveOrganization: async () => ({ orgId: "org-current" }),
  }))
  const { NextRequest } = await import("next/server")
  const { calendarHandler, calendarCron } =
    await import("@/features/google-calendar/server/actions")
  const forged = new NextRequest(
    "https://app.test/api/integrations/google-calendar/enabled",
    {
      method: "POST",
      headers: { origin: "https://attacker.test" },
      body: JSON.stringify({ enabled: false }),
    }
  )
  expect((await calendarHandler("enabled")(forged)).status).toBe(403)
  expect(calls).toEqual([])
  const settings = new NextRequest(
    "https://app.test/api/integrations/google-calendar/settings",
    {
      method: "POST",
      headers: { origin: "https://app.test" },
      body: JSON.stringify({
        expectedOrgId: "org-old",
        calendarIds: [],
        exportBoard: true,
        timeZone: "UTC",
      }),
    }
  )
  expect((await calendarHandler("settings")(settings)).status).toBe(409)
  const events = await calendarHandler("events")(
    new NextRequest(
      "https://app.test/api/integrations/google-calendar/events?from=2026-09-01&to=2026-10-01&userId=user-a"
    )
  )
  expect(await events.json()).toEqual({ events: [] })
  const unauthorizedCron = await calendarCron(
    new NextRequest("https://app.test/api/integrations/google-calendar/cron")
  )
  expect(unauthorizedCron.status).toBe(401)
})
