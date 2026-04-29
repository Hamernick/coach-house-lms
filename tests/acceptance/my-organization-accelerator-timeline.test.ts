import { describe, expect, it } from "vitest"

import {
  isOrganizationSetupTimelineModule,
  resolveWorkspaceAcceleratorSupplementalResources,
} from "@/app/(dashboard)/my-organization/_lib/my-organization-accelerator-timeline"

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

  it("adds community resource links to the Introduction module", () => {
    expect(
      resolveWorkspaceAcceleratorSupplementalResources({
        slug: "intro-idea-to-impact-accelerator",
        title: "Introduction: Idea to Impact Accelerator",
      }).map((resource) => resource.title),
    ).toEqual([
      "WhatsApp community",
      "Discord community",
      "Find organizations",
    ])
  })

  it("adds Bizee and IRS resources to the relevant Formation modules", () => {
    expect(
      resolveWorkspaceAcceleratorSupplementalResources({
        slug: "nfp-registration",
      }),
    ).toEqual([
      expect.objectContaining({
        title: "Bizee EIN registration support",
        url: "https://bizee.com",
      }),
    ])

    expect(
      resolveWorkspaceAcceleratorSupplementalResources({
        slug: "filing-1023",
      }).map((resource) => resource.url),
    ).toEqual([
      "https://www.irs.gov/uac/about-form-1023",
      "https://www.irs.gov/forms-pubs/about-form-1023-ez",
    ])
  })
})
