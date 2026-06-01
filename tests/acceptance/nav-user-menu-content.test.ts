import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

describe("nav user menu content", () => {
  it("owns the org admin link in the avatar menu instead of stale sidebar menu rows", () => {
    const menuSource = readFileSync(
      join(ROOT, "src/components/nav-user/nav-user-menu-content.tsx"),
      "utf8",
    )
    const navUserSource = readFileSync(
      join(ROOT, "src/components/nav-user.tsx"),
      "utf8",
    )
    const sidebarSource = readFileSync(
      join(ROOT, "src/components/app-sidebar.tsx"),
      "utf8",
    )

    expect(menuSource).toContain("showOrgAdmin && canAccessOrgAdmin")
    expect(menuSource).toContain('href="/admin"')
    expect(menuSource).toContain("ShieldIcon")
    expect(menuSource).toMatch(/>\s*Admin\s*<\/Link>/)

    expect(menuSource).not.toContain('href="/coaching"')
    expect(menuSource).not.toContain("Book coaching")
    expect(menuSource).not.toContain("Submit feedback")
    expect(menuSource).not.toContain("mailto:joel@coachhousesolutions.org")

    expect(navUserSource).toContain("showOrgAdmin={showOrgAdmin}")
    expect(navUserSource).toContain("canAccessOrgAdmin={canAccessOrgAdmin}")
    expect(sidebarSource).toContain("showOrgAdmin={showOrgAdmin}")
    expect(sidebarSource).toContain("canAccessOrgAdmin={canAccessOrgAdmin}")
  })
})
