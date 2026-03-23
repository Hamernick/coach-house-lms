import { describe, expect, it } from "vitest"

import {
  buildWorkspaceMapLocationLabel,
  buildWorkspaceMapStaticPreviewUrl,
  normalizeWorkspaceMapCardInput,
  resolveWorkspaceMapChecklist,
  resolveWorkspaceMapCompletionSummary,
} from "@/features/workspace-map-card"

const COMPLETE_PROFILE = {
  name: "Atlas Org",
  tagline: "Public story",
  address: "",
  addressStreet: "123 Main St",
  addressCity: "Atlanta",
  addressState: "GA",
  addressPostal: "30303",
  addressCountry: "USA",
  vision: "A thriving civil society.",
  mission: "Help organizations build durable systems.",
  values: "Clarity, rigor, stewardship.",
  logoUrl: "https://example.com/logo.png",
} as const

describe("workspace-map-card feature contract", () => {
  it("normalizes missing title, company href, and tutorial step id", () => {
    expect(
      normalizeWorkspaceMapCardInput({
        orgId: "org_123",
        title: "   ",
        profile: COMPLETE_PROFILE as never,
        companyHref: "   ",
        presentationMode: false,
      }),
    ).toEqual({
      orgId: "org_123",
      title: "Map",
      profile: COMPLETE_PROFILE,
      companyHref: "/workspace?view=editor&tab=company",
      presentationMode: false,
      tutorialStepId: null,
    })
  })

  it("builds a static preview URL with a pinned organization location", () => {
    expect(
      buildWorkspaceMapStaticPreviewUrl({
        token: "pk.test-token",
        location: {
          lat: 33.749,
          lng: -84.388,
          label: "Atlanta, GA",
          source: "organization",
        },
        width: 96,
        height: 96,
      }),
    ).toBe(
      "https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+0f172a(-84.38800,33.74900)/-84.38800,33.74900,4.2,0/96x96?access_token=pk.test-token&logo=false&attribution=false",
    )
  })

  it("derives a readable location label from structured profile address fields", () => {
    expect(buildWorkspaceMapLocationLabel(COMPLETE_PROFILE as never, "Fallback")).toBe(
      "123 Main St, Atlanta, GA, 30303, USA",
    )
  })

  it("builds checklist items and completion summary from company profile readiness", () => {
    const checklist = resolveWorkspaceMapChecklist({
      companyHref: "/workspace?view=editor&tab=company",
      profile: COMPLETE_PROFILE as never,
    })

    expect(checklist.map((item) => [item.id, item.complete])).toEqual([
      ["story", true],
      ["identity", true],
      ["logo", true],
    ])
    expect(resolveWorkspaceMapCompletionSummary(checklist)).toEqual({
      completedCount: 3,
      totalCount: 3,
      allComplete: true,
    })
  })

  it("keeps incomplete checklist items pointed at the company editor", () => {
    const checklist = resolveWorkspaceMapChecklist({
      companyHref: "/workspace?view=editor&tab=company",
      profile: {
        ...COMPLETE_PROFILE,
        vision: "",
        mission: "",
        values: "",
        tagline: "",
        logoUrl: "",
      } as never,
    })

    expect(checklist.map((item) => [item.id, item.complete, item.href])).toEqual([
      ["story", false, "/workspace?view=editor&tab=company"],
      ["identity", false, "/workspace?view=editor&tab=company"],
      ["logo", false, "/workspace?view=editor&tab=company"],
    ])
  })
})
