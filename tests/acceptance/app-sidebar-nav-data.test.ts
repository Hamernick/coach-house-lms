import { describe, expect, it } from "vitest"

import { buildMainNav } from "@/components/app-sidebar/nav-data"

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
})
