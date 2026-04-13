import { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js"
import { describe, expect, it } from "vitest"

import { resolveRealtimeCursorConnectionState } from "@/hooks/use-realtime-cursors"

describe("resolveRealtimeCursorConnectionState", () => {
  it("prioritizes browser offline state over any subscribe status", () => {
    expect(
      resolveRealtimeCursorConnectionState({
        networkAvailable: false,
        subscribeStatus: REALTIME_SUBSCRIBE_STATES.SUBSCRIBED,
      }),
    ).toBe("degraded")
  })

  it("treats subscribed channels as live when the browser is online", () => {
    expect(
      resolveRealtimeCursorConnectionState({
        networkAvailable: true,
        subscribeStatus: REALTIME_SUBSCRIBE_STATES.SUBSCRIBED,
      }),
    ).toBe("live")
  })

  it("maps channel errors, timeouts, and closes to degraded", () => {
    expect(
      resolveRealtimeCursorConnectionState({
        networkAvailable: true,
        subscribeStatus: REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR,
      }),
    ).toBe("degraded")
    expect(
      resolveRealtimeCursorConnectionState({
        networkAvailable: true,
        subscribeStatus: REALTIME_SUBSCRIBE_STATES.TIMED_OUT,
      }),
    ).toBe("degraded")
    expect(
      resolveRealtimeCursorConnectionState({
        networkAvailable: true,
        subscribeStatus: REALTIME_SUBSCRIBE_STATES.CLOSED,
      }),
    ).toBe("degraded")
  })

  it("keeps all other online states in connecting", () => {
    expect(
      resolveRealtimeCursorConnectionState({
        networkAvailable: true,
        subscribeStatus: null,
      }),
    ).toBe("connecting")
    expect(
      resolveRealtimeCursorConnectionState({
        networkAvailable: true,
        subscribeStatus: "joining",
      }),
    ).toBe("connecting")
  })
})
