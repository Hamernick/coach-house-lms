import { describe, expect, it } from "vitest"

import {
  isMobileNavigationPathActive,
  shouldShowMobileNavigation,
} from "@/features/mobile-navigation/lib"

describe("mobile navigation", () => {
  it("matches exact and nested navigation paths without treating root as global", () => {
    expect(isMobileNavigationPathActive("/workspace", "/workspace")).toBe(true)
    expect(
      isMobileNavigationPathActive("/workspace/calendar", "/workspace")
    ).toBe(true)
    expect(isMobileNavigationPathActive("/workspace", "/")).toBe(false)
  })

  it("hides the dock only on the admin dashboard and descendants", () => {
    expect(shouldShowMobileNavigation("/admin/dashboard")).toBe(false)
    expect(shouldShowMobileNavigation("/admin/dashboard/activity")).toBe(false)
    expect(shouldShowMobileNavigation("/admin/people")).toBe(true)
    expect(shouldShowMobileNavigation("/workspace")).toBe(true)
  })
})
