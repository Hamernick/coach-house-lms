import { describe, expect, it } from "vitest"

import {
  PLATFORM_SETUP_NOTIFICATION_ID,
  buildPlatformSetupNotification,
  isPlatformSetupNotificationId,
} from "@/lib/supabase/management-api-config"

describe("supabase management api config", () => {
  it("builds the synthetic platform setup notification", () => {
    const notification = buildPlatformSetupNotification("2026-03-11T17:00:00.000Z")

    expect(notification).toMatchObject({
      id: PLATFORM_SETUP_NOTIFICATION_ID,
      title: "Platform tools need setup",
      href: "/admin/platform",
      tone: "warning",
      createdAt: "2026-03-11T17:00:00.000Z",
      readAt: null,
      archivedAt: null,
    })
  })

  it("recognizes only the synthetic platform setup notification id", () => {
    expect(isPlatformSetupNotificationId(PLATFORM_SETUP_NOTIFICATION_ID)).toBe(true)
    expect(isPlatformSetupNotificationId("notification_123")).toBe(false)
  })
})
