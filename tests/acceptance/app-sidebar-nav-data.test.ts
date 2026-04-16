import { describe, expect, it } from "vitest"

import { RESOURCE_NAV, buildMainNav } from "@/components/app-sidebar/nav-data"

describe("app sidebar nav data", () => {
  it("shows the internal platform item only for true platform admins", () => {
    expect(
      buildMainNav({
        isAdmin: true,
        showOrgAdmin: true,
        canAccessOrgAdmin: true,
      }).map((item) => item.title),
    ).toContain("Platform")

    expect(
      buildMainNav({
        isAdmin: false,
        showOrgAdmin: true,
        canAccessOrgAdmin: true,
      }).map((item) => item.title),
    ).not.toContain("Platform")
  })

  it("shows Platform Lab only when explicitly enabled for platform admins", () => {
    expect(
      buildMainNav({
        isAdmin: true,
        showOrgAdmin: true,
        canAccessOrgAdmin: true,
        showPlatformLab: true,
      }).map((item) => item.title),
    ).toContain("Platform Lab")

    expect(
      buildMainNav({
        isAdmin: true,
        showOrgAdmin: true,
        canAccessOrgAdmin: true,
        showPlatformLab: false,
      }).map((item) => item.title),
    ).not.toContain("Platform Lab")
  })

  it("replaces the workspace nav with the member workspace routes when enabled", () => {
    const nav = buildMainNav({
      isAdmin: false,
      showOrgAdmin: false,
      canAccessOrgAdmin: false,
      showMemberWorkspace: true,
    })

    expect(nav.map((item) => item.title)).toEqual([
      "Workspace",
      "Projects",
      "Tasks",
      "People",
      "Documents",
    ])
    expect(nav.find((item) => item.title === "Tasks")?.href).toBe("/tasks")
  })

  it("does not show Marketplace in the sidebar resource nav", () => {
    expect(RESOURCE_NAV.map((item) => item.name)).toEqual([
      "Knowledge base",
      "Community",
    ])
  })
})
