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
      "Projects",
      "Tasks",
      "People",
      "Documents",
    ])
    expect(nav.find((item) => item.title === "Tasks")?.href).toBe("/tasks")
  })

  it("locks project and task nav for free member workspace users", () => {
    const nav = buildMainNav({
      isAdmin: false,
      showOrgAdmin: false,
      canAccessOrgAdmin: false,
      showMemberWorkspace: true,
      hasMemberWorkspaceAccess: false,
    })

    expect(nav.find((item) => item.title === "Projects")).toMatchObject({
      locked: true,
      upgradeHref:
        "?paywall=organization&plan=organization&upgrade=member-workspace-access&source=nav-projects",
    })
    expect(nav.find((item) => item.title === "Projects")?.href).toBeUndefined()
    expect(nav.find((item) => item.title === "Tasks")).toMatchObject({
      locked: true,
      upgradeHref:
        "?paywall=organization&plan=organization&upgrade=member-workspace-access&source=nav-tasks",
    })
    expect(nav.find((item) => item.title === "Tasks")?.href).toBeUndefined()
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
