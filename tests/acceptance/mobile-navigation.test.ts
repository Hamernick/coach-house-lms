import { describe, expect, it } from "vitest"

import {
  isMobileNavigationPathActive,
  resolveMobileNavigationIndex,
} from "@/features/mobile-navigation/lib"

describe("mobile navigation", () => {
  it("matches exact and nested navigation paths without treating root as global", () => {
    expect(isMobileNavigationPathActive("/workspace", "/workspace")).toBe(true)
    expect(
      isMobileNavigationPathActive("/workspace/calendar", "/workspace")
    ).toBe(true)
    expect(isMobileNavigationPathActive("/workspace", "/")).toBe(false)
  })

  it("maps pointer position to a bounded navigation item", () => {
    const bounds = { left: 100, top: 20, width: 300, height: 60, count: 3 }
    expect(resolveMobileNavigationIndex({ ...bounds, x: 110, y: 40 })).toBe(0)
    expect(resolveMobileNavigationIndex({ ...bounds, x: 250, y: 40 })).toBe(1)
    expect(resolveMobileNavigationIndex({ ...bounds, x: 399, y: 40 })).toBe(2)
    expect(
      resolveMobileNavigationIndex({ ...bounds, x: 401, y: 40 })
    ).toBeNull()
  })
})
