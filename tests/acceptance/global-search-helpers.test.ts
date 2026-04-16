import { describe, expect, it } from "vitest"

import { buildBaseSearchItems } from "@/components/global-search/global-search-helpers"

describe("global search helper base items", () => {
  it("adds Platform Lab only when explicitly requested", () => {
    const withPlatformLab = buildBaseSearchItems({
      enableAccelerator: false,
      showOrgAdmin: true,
      showMemberWorkspace: false,
      showPlatformLab: true,
    })

    expect(withPlatformLab.map((item) => item.label)).toContain("Platform Lab")

    const withoutPlatformLab = buildBaseSearchItems({
      enableAccelerator: false,
      showOrgAdmin: true,
      showMemberWorkspace: false,
      showPlatformLab: false,
    })

    expect(withoutPlatformLab.map((item) => item.label)).not.toContain(
      "Platform Lab",
    )
  })

  it("promotes projects and tasks when the member workspace nav is enabled", () => {
    const items = buildBaseSearchItems({
      enableAccelerator: false,
      showOrgAdmin: false,
      showMemberWorkspace: true,
      showPlatformLab: false,
    })

    expect(items.map((item) => item.label)).toEqual(
      expect.arrayContaining([
        "Workspace",
        "Projects",
        "Tasks",
      ]),
    )
    expect(items.find((item) => item.label === "Tasks")?.href).toBe("/tasks")
    expect(items.map((item) => item.label)).not.toContain("Organization")
    expect(items.map((item) => item.label)).not.toContain("Access Requests")
  })
})
