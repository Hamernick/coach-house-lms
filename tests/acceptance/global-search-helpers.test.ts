import { describe, expect, it } from "vitest"

import {
  buildBaseSearchItems,
  resolveGlobalSearchResultHref,
} from "@/components/global-search/global-search-helpers"

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
      "Platform Lab"
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
      expect.arrayContaining(["Workspace", "Projects", "Tasks"])
    )
    expect(items.find((item) => item.label === "Tasks")?.href).toBe("/tasks")
    expect(items.find((item) => item.label === "Roadmap")?.href).toBe(
      "/workspace?drawer=roadmap"
    )
    expect(items.find((item) => item.label === "People")?.href).toBe(
      "/workspace?drawer=people"
    )
    expect(items.find((item) => item.label === "Documents")?.href).toBe(
      "/workspace?drawer=documents"
    )
    expect(items.map((item) => item.label)).not.toContain("Organization")
    expect(items.map((item) => item.label)).not.toContain("Access Requests")
  })

  it("omits organization workspace pages for free self-only users", () => {
    const items = buildBaseSearchItems({
      enableAccelerator: false,
      showOrgAdmin: false,
      showMemberWorkspace: false,
      showPlatformLab: false,
    })

    expect(items.map((item) => item.label)).toContain("Find")
    expect(items.map((item) => item.label)).not.toEqual(
      expect.arrayContaining([
        "Workspace",
        "Organization",
        "Projects",
        "Tasks",
        "People",
        "Documents",
      ])
    )
  })

  it("routes indexed workspace results into current drawers and views", () => {
    const moduleId = "5361b0eb-0658-4c3a-b3b6-aa0187badb78"

    expect(
      resolveGlobalSearchResultHref({
        id: `module:${moduleId}`,
        label: "Budgeting",
        href: "/accelerator/class/budget/module/1",
        group: "Modules",
      })
    ).toBe(`/workspace?drawer=accelerator&module=${moduleId}`)
    expect(
      resolveGlobalSearchResultHref({
        id: `question:${moduleId}:0`,
        label: "Budget",
        href: "/accelerator/class/budget/module/1",
        group: "Questions",
      })
    ).toBe(`/workspace?drawer=accelerator&module=${moduleId}`)
    expect(
      resolveGlobalSearchResultHref({
        id: "program:program-1",
        label: "Program",
        href: "/organization?tab=programs&programId=program-1",
        group: "Programs",
      })
    ).toBe("/workspace?view=editor&tab=programs&programId=program-1")
    expect(
      resolveGlobalSearchResultHref({
        id: "org:org-1",
        label: "Organization",
        href: "/organization",
        group: "My organization",
      })
    ).toBe("/workspace?view=editor&tab=company")
    expect(
      resolveGlobalSearchResultHref({
        id: "roadmap:org-1:mission",
        label: "Mission",
        href: "/roadmap#mission",
        group: "Roadmap",
      })
    ).toBe("/workspace?drawer=roadmap&section=mission")
    expect(
      resolveGlobalSearchResultHref({
        id: "doc:org-1:state-registration",
        label: "State registration",
        href: "/organization/documents",
        group: "Documents",
      })
    ).toBe("/workspace?drawer=documents&focus=state-registration")
  })
})
