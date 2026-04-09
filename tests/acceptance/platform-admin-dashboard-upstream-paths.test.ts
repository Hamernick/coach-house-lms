import { describe, expect, it } from "vitest"

import {
  PLATFORM_LAB_BASE_PATH,
  platformLabAssetPath,
  platformLabPath,
  stripPlatformLabBasePath,
} from "@/features/platform-admin-dashboard/upstream/lib/platform-lab-paths"

describe("platform admin dashboard upstream path helpers", () => {
  it("builds platform lab-relative route hrefs", () => {
    expect(platformLabPath()).toBe(PLATFORM_LAB_BASE_PATH)
    expect(platformLabPath("/tasks")).toBe("/internal/platform-lab/tasks")
    expect(platformLabPath("clients/123")).toBe("/internal/platform-lab/clients/123")
  })

  it("normalizes prefixed lab paths back to donor-relative paths", () => {
    expect(stripPlatformLabBasePath("/internal/platform-lab")).toBe("/")
    expect(stripPlatformLabBasePath("/internal/platform-lab/projects/demo")).toBe("/projects/demo")
    expect(stripPlatformLabBasePath("/somewhere-else")).toBe("/somewhere-else")
  })

  it("scopes donor assets under the isolated public namespace", () => {
    expect(platformLabAssetPath("logo-wrapper.png")).toBe("/platform-lab/logo-wrapper.png")
    expect(platformLabAssetPath("/avatar-profile.jpg")).toBe("/platform-lab/avatar-profile.jpg")
  })
})
