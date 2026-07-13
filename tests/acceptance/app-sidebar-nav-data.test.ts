import { describe, expect, it } from "vitest"
import EarthIcon from "lucide-react/dist/esm/icons/earth"

import { RESOURCE_NAV, buildMainNav } from "@/components/app-sidebar/nav-data"

describe("app sidebar nav data", () => {
  it("shows the internal platform item only for true platform admins", () => {
    expect(
      buildMainNav({
        isAdmin: true,
        showOrgAdmin: true,
        canAccessOrgAdmin: true,
      }).map((item) => item.title)
    ).toContain("Platform")
    expect(
      buildMainNav({
        isAdmin: true,
        showOrgAdmin: true,
        canAccessOrgAdmin: true,
      }).map((item) => item.title)
    ).not.toContain("User Journeys")

    expect(
      buildMainNav({
        isAdmin: false,
        showOrgAdmin: true,
        canAccessOrgAdmin: true,
      }).map((item) => item.title)
    ).not.toContain("Platform")
    expect(
      buildMainNav({
        isAdmin: false,
        showOrgAdmin: true,
        canAccessOrgAdmin: true,
      }).map((item) => item.title)
    ).not.toContain("User Journeys")
  })

  it("shows Platform Lab only when explicitly enabled for platform admins", () => {
    expect(
      buildMainNav({
        isAdmin: true,
        showOrgAdmin: true,
        canAccessOrgAdmin: true,
        showPlatformLab: true,
      }).map((item) => item.title)
    ).toContain("Platform Lab")

    expect(
      buildMainNav({
        isAdmin: true,
        showOrgAdmin: true,
        canAccessOrgAdmin: true,
        showPlatformLab: false,
      }).map((item) => item.title)
    ).not.toContain("Platform Lab")
  })

  it("hides project and task nav from regular member workspace users", () => {
    const nav = buildMainNav({
      isAdmin: false,
      showOrgAdmin: false,
      canAccessOrgAdmin: false,
      showMemberWorkspace: true,
      hasMemberWorkspaceAccess: true,
    })

    expect(nav.map((item) => item.title)).toEqual(["Workspace", "Find"])
    expect(nav.find((item) => item.title === "Find")?.href).toBe("/find")
    expect(nav.find((item) => item.title === "Find")?.icon).toBe(EarthIcon)
    expect(nav.find((item) => item.title === "Organizations")).toBeUndefined()
    expect(nav.find((item) => item.title === "Projects")).toBeUndefined()
    expect(nav.find((item) => item.title === "Tasks")).toBeUndefined()
    expect(nav.find((item) => item.title === "Email")).toBeUndefined()
    expect(nav.find((item) => item.title === "People")).toBeUndefined()
    expect(nav.find((item) => item.title === "Documents")).toBeUndefined()
  })

  it("keeps org admin out of the main sidebar nav even when available", () => {
    const nav = buildMainNav({
      isAdmin: false,
      showOrgAdmin: true,
      canAccessOrgAdmin: true,
      showMemberWorkspace: true,
      hasMemberWorkspaceAccess: true,
    })

    expect(nav.find((item) => item.title === "Admin")).toBeUndefined()
  })

  it("includes member workspace routes alongside platform routes for platform admins", () => {
    const nav = buildMainNav({
      isAdmin: true,
      showOrgAdmin: true,
      canAccessOrgAdmin: true,
      showMemberWorkspace: true,
      hasMemberWorkspaceAccess: true,
      showPlatformLab: true,
    })

    expect(nav.map((item) => item.title)).toEqual([
      "Workspace",
      "Find",
      "Organizations",
      "Tasks",
      "Email",
      "Platform",
      "Platform Lab",
      "Prototypes",
    ])
    expect(nav.find((item) => item.title === "Organizations")?.href).toBe(
      "/organizations"
    )
    expect(nav.find((item) => item.title === "Prototypes")?.tree).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "user-journeys",
          label: "User Journeys",
        }),
      ])
    )
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
    expect(nav.find((item) => item.title === "Organizations")).toBeUndefined()
    expect(nav.find((item) => item.title === "Projects")).toBeUndefined()
    expect(nav.find((item) => item.title === "Tasks")).toBeUndefined()
    expect(nav.find((item) => item.title === "Email")).toBeUndefined()
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
    expect(nav.find((item) => item.title === "Find")?.icon).toBe(EarthIcon)
    expect(nav.find((item) => item.title === "Find")?.locked).not.toBe(true)
    expect(nav.find((item) => item.title === "Organizations")).toBeUndefined()
    expect(nav.find((item) => item.title === "Projects")).toBeUndefined()
    expect(nav.find((item) => item.title === "Tasks")).toBeUndefined()
    expect(nav.find((item) => item.title === "Email")).toBeUndefined()
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

  it("does not duplicate Find in the sidebar resource nav", () => {
    expect(RESOURCE_NAV.map((item) => item.name)).toEqual([
      "Knowledge base",
      "Community",
    ])
    expect(
      RESOURCE_NAV.find((item) => item.name === "Find organizations")
    ).toBeUndefined()
    expect(RESOURCE_NAV.find((item) => item.url === "/find")).toBeUndefined()
  })
})
