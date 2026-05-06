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
      hasMemberWorkspaceAccess: true,
    })

    expect(nav.map((item) => item.title)).toEqual([
      "Workspace",
      "Find",
      "Projects",
      "Tasks",
      "People",
      "Documents",
    ])
    expect(nav.find((item) => item.title === "Find")?.href).toBe("/find")
    expect(nav.find((item) => item.title === "Tasks")?.href).toBe("/tasks")
  })

  it("shows Find only for free self-only member accounts", () => {
    const nav = buildMainNav({
      isAdmin: false,
      showOrgAdmin: false,
      canAccessOrgAdmin: false,
      showMemberWorkspace: false,
      hasMemberWorkspaceAccess: false,
    })

    expect(nav.map((item) => item.title)).toEqual(["Find"])
    expect(nav.find((item) => item.title === "Workspace")).toBeUndefined()
    expect(nav.find((item) => item.title === "Find")?.href).toBe("/find")
    expect(nav.find((item) => item.title === "Projects")).toBeUndefined()
    expect(nav.find((item) => item.title === "Tasks")).toBeUndefined()
    expect(nav.find((item) => item.title === "People")).toBeUndefined()
    expect(nav.find((item) => item.title === "Documents")).toBeUndefined()
  })

  it("omits project and task nav instead of rendering upgrade badges without access", () => {
    const nav = buildMainNav({
      isAdmin: false,
      showOrgAdmin: false,
      canAccessOrgAdmin: false,
      showMemberWorkspace: true,
      hasMemberWorkspaceAccess: false,
    })

    expect(nav.find((item) => item.title === "Find")?.href).toBe("/find")
    expect(nav.find((item) => item.title === "Find")?.locked).not.toBe(true)
    expect(nav.find((item) => item.title === "Projects")).toBeUndefined()
    expect(nav.find((item) => item.title === "Tasks")).toBeUndefined()
    expect(nav.map((item) => item.badge)).not.toContain("Upgrade")
  })

  it("omits locked admin upgrade rows when org admin is unavailable", () => {
    const nav = buildMainNav({
      isAdmin: false,
      showOrgAdmin: true,
      canAccessOrgAdmin: false,
      showMemberWorkspace: false,
      hasMemberWorkspaceAccess: false,
    })

    expect(nav.map((item) => item.title)).toEqual(["Find"])
    expect(nav.find((item) => item.title === "Admin")).toBeUndefined()
    expect(nav.map((item) => item.badge)).not.toContain("Upgrade")
  })

  it("does not show Marketplace in the sidebar resource nav", () => {
    expect(RESOURCE_NAV.map((item) => item.name)).toEqual([
      "Knowledge base",
      "Find organizations",
      "Community",
    ])
    expect(RESOURCE_NAV.find((item) => item.name === "Find organizations")).toMatchObject({
      url: "/find",
    })
  })
})
