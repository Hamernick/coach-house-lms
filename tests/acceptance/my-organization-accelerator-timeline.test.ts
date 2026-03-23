import { describe, expect, it } from "vitest"

import { isOrganizationSetupTimelineModule } from "@/app/(dashboard)/my-organization/_lib/my-organization-accelerator-timeline"

describe("my-organization accelerator timeline helpers", () => {
  it("detects the canonical organization setup module id", () => {
    expect(
      isOrganizationSetupTimelineModule({
        roadmapModule: {
          id: "workspace-onboarding-organization-setup",
          slug: "organization-setup",
          title: "Organization setup",
          href: "/accelerator/class/formation/module/1",
        },
      }),
    ).toBe(true)
  })

  it("detects organization setup modules even when ids are UUID-backed", () => {
    expect(
      isOrganizationSetupTimelineModule({
        roadmapModule: {
          id: "ded5d852-1444-40c4-a62f-d2f83a93ce69",
          slug: "workspace-setup",
          title: "Workspace setup",
          href: "/accelerator/class/formation/module/0",
        },
      }),
    ).toBe(true)
  })

  it("does not classify regular Formation modules as organization setup", () => {
    expect(
      isOrganizationSetupTimelineModule({
        roadmapModule: {
          id: "a-module-id",
          slug: "naming-your-nfp",
          title: "Naming your NFP",
          href: "/accelerator/class/formation/module/1",
        },
      }),
    ).toBe(false)
  })
})
