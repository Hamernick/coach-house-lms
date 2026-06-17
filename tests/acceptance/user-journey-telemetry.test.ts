import { readFileSync } from "node:fs"

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { createSupabaseAdminClientMock } = vi.hoisted(() => ({
  createSupabaseAdminClientMock: vi.fn(),
}))

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: createSupabaseAdminClientMock,
}))

function createTelemetrySupabaseStub() {
  const eventSingleMock = vi.fn().mockResolvedValue({
    data: { id: "event-1" },
    error: null,
  })
  const eventSelectMock = vi.fn().mockReturnValue({ single: eventSingleMock })
  const eventInsertMock = vi.fn().mockReturnValue({ select: eventSelectMock })
  const checkpointUpsertMock = vi.fn().mockResolvedValue({ error: null })

  const fromMock = vi.fn((table: string) => {
    if (table === "user_journey_events") {
      return { insert: eventInsertMock }
    }
    if (table === "user_activation_checkpoints") {
      return { upsert: checkpointUpsertMock }
    }
    throw new Error(`Unexpected telemetry table: ${table}`)
  })

  return {
    client: { from: fromMock },
    eventInsertMock,
    checkpointUpsertMock,
  }
}

describe("user journey telemetry", () => {
  const previousTelemetryTestEnable = process.env.USER_JOURNEY_TELEMETRY_TEST_ENABLE

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.USER_JOURNEY_TELEMETRY_TEST_ENABLE = "1"
  })

  afterEach(() => {
    if (previousTelemetryTestEnable === undefined) {
      delete process.env.USER_JOURNEY_TELEMETRY_TEST_ENABLE
    } else {
      process.env.USER_JOURNEY_TELEMETRY_TEST_ENABLE = previousTelemetryTestEnable
    }
  })

  it("writes a sanitized event and idempotent activation checkpoint", async () => {
    const { client, eventInsertMock, checkpointUpsertMock } = createTelemetrySupabaseStub()
    createSupabaseAdminClientMock.mockReturnValue(client)

    const { trackUserJourneyMilestone } = await import("@/lib/user-journey")
    const result = await trackUserJourneyMilestone({
      userId: "user-1",
      orgId: "org-1",
      eventName: "checkout_completed",
      journey: "paid_builder",
      source: "pricing_success_page",
      surface: "pricing_success",
      planTier: "organization",
      checkpoint: "paid_plan_confirmed",
      metadata: {
        email: "private@example.test",
        checkoutSessionId: "cs_123",
        nested: {
          token: "secret",
          kept: true,
        },
      },
    })

    expect(result).toEqual({ ok: true, eventId: "event-1" })
    expect(eventInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        org_id: "org-1",
        event_name: "checkout_completed",
        plan_tier: "organization",
        metadata: {
          checkoutSessionId: "cs_123",
          nested: { kept: true },
        },
      }),
    )
    expect(checkpointUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        org_id: "org-1",
        checkpoint: "paid_plan_confirmed",
        source_event_id: "event-1",
      }),
      { onConflict: "user_id,org_id,checkpoint", ignoreDuplicates: true },
    )
  })

  it("does not throw when the service role client is unavailable", async () => {
    createSupabaseAdminClientMock.mockImplementation(() => {
      throw new Error("missing_service_role")
    })

    const { trackUserJourneyMilestone } = await import("@/lib/user-journey")
    await expect(
      trackUserJourneyMilestone({
        userId: "user-1",
        eventName: "workspace_viewed",
        checkpoint: "workspace_first_viewed",
      }),
    ).resolves.toEqual({ ok: false, eventId: null, reason: "unavailable" })
  })

  it("treats a missing telemetry table as unavailable and skips checkpoint writes", async () => {
    const eventSingleMock = vi.fn().mockResolvedValue({
      data: null,
      error: {
        code: "PGRST205",
        message:
          "Could not find the table 'public.user_journey_events' in the schema cache",
      },
    })
    const eventSelectMock = vi.fn().mockReturnValue({ single: eventSingleMock })
    const eventInsertMock = vi.fn().mockReturnValue({ select: eventSelectMock })
    const fromMock = vi.fn((table: string) => {
      if (table === "user_journey_events") {
        return { insert: eventInsertMock }
      }
      throw new Error(`Unexpected telemetry table: ${table}`)
    })
    createSupabaseAdminClientMock.mockReturnValue({ from: fromMock })

    const { trackUserJourneyMilestone } = await import("@/lib/user-journey")
    await expect(
      trackUserJourneyMilestone({
        userId: "user-1",
        eventName: "workspace_viewed",
        checkpoint: "workspace_first_viewed",
      }),
    ).resolves.toEqual({ ok: false, eventId: null, reason: "unavailable" })
    expect(fromMock).not.toHaveBeenCalledWith("user_activation_checkpoints")
  })

  it("keeps journey telemetry tables locked to admin reads", () => {
    const migration = readFileSync(
      "supabase/migrations/20260513011500_add_user_journey_telemetry.sql",
      "utf8",
    )
    const reloadMigration = readFileSync(
      "supabase/migrations/20260513015500_reload_user_journey_telemetry_schema_cache.sql",
      "utf8",
    )

    expect(migration).toContain("create table if not exists public.user_journey_events")
    expect(migration).toContain("create table if not exists public.user_activation_checkpoints")
    expect(migration).toContain("alter table public.user_journey_events enable row level security")
    expect(migration).toContain("alter table public.user_activation_checkpoints force row level security")
    expect(migration).toContain("revoke all on table public.user_journey_events from anon, authenticated")
    expect(migration).toContain("user_activation_checkpoints_admin_read")
    expect(migration).toContain("notify pgrst, 'reload schema'")
    expect(reloadMigration).toContain("notify pgrst, 'reload schema'")
  })
})
