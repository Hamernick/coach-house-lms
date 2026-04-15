import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { PublicMapOrganizationList } from "@/components/public/public-map-index/organization-list"
import { PublicMapSidebar } from "@/components/public/public-map-index/sidebar"
import type {
  PublicMapOrganization,
  PublicMapProgramPreview,
} from "@/lib/queries/public-map-index"

function buildProgramPreview(
  overrides: Partial<PublicMapProgramPreview> = {},
): PublicMapProgramPreview {
  return {
    id: "program-1",
    title: "Community Kitchen",
    subtitle: "Weekly mutual-aid meals",
    imageUrl: "https://example.com/program.jpg",
    locationType: "in_person",
    ...overrides,
  }
}

function buildOrganization(
  overrides: Partial<PublicMapOrganization> = {},
): PublicMapOrganization {
  return {
    id: "org-1",
    name: "Atlas Collective",
    tagline: "Neighborhood support and grassroots coordination across Chicago blocks.",
    description: "Atlas supports local families through civic programming.",
    boilerplate: null,
    vision: null,
    mission: null,
    values: null,
    needStatement: null,
    originStory: null,
    theoryOfChange: null,
    formationStatus: null,
    contactName: null,
    logoUrl: null,
    brandMarkUrl: null,
    headerUrl: null,
    website: null,
    email: null,
    phone: null,
    twitter: null,
    facebook: null,
    linkedin: null,
    instagram: null,
    brandPrimary: null,
    brandColors: [],
    brandThemePresetId: null,
    brandAccentPresetId: null,
    brandTypographyPresetId: null,
    brandTypography: null,
    brandKitAvailable: false,
    latitude: 41.8781,
    longitude: -87.6298,
    address: null,
    addressStreet: null,
    addressPostal: null,
    city: "Chicago",
    state: "IL",
    country: "United States",
    locationUrl: null,
    publicSlug: "atlas-collective",
    programPreview: buildProgramPreview(),
    programs: [
      buildProgramPreview(),
      buildProgramPreview({
        id: "program-2",
        title: "Youth Studio",
        subtitle: "Arts and tutoring",
      }),
      buildProgramPreview({
        id: "program-3",
        title: "Wellness Table",
        subtitle: "Community care",
      }),
    ],
    programCount: 3,
    groups: ["community"],
    primaryGroup: "community",
    isOnlineOnly: false,
    ...overrides,
  }
}

function extractClassNameByAttribute(markup: string, attribute: string, value: string) {
  const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const tag = markup.match(new RegExp(`<[^>]*${attribute}="${escapedValue}"[^>]*>`))?.[0] ?? ""
  return tag.match(/class="([^"]*)"/)?.[1] ?? ""
}

describe("public map sidebar layout", () => {
  it("gives the rail search layout one scroll owner and a shared horizontal inset", () => {
    const organization = buildOrganization()
    const markup = renderToStaticMarkup(
      React.createElement(PublicMapSidebar, {
        sidebarMode: "search",
        sidebarWidth: 374,
        surfaceHeight: 720,
        panelPresentation: "rail",
        portalContainer: null,
        filteredOrganizations: [organization],
        selectedOrganization: organization,
        favorites: [],
        query: "",
        searchContext: null,
        setQuery: () => {},
        toggleFavorite: () => {},
        onOpenDetails: () => {},
        setSidebarMode: () => {},
      }),
    )

    const headerClassName = extractClassNameByAttribute(
      markup,
      "data-public-map-sidebar-section",
      "rail-search-header",
    )
    const shellClassName = extractClassNameByAttribute(
      markup,
      "data-public-map-sidebar-section",
      "rail-organizations-shell",
    )
    const scrollClassName = extractClassNameByAttribute(
      markup,
      "data-public-map-sidebar-section",
      "rail-organizations-scroll",
    )
    const viewportClassName = extractClassNameByAttribute(
      markup,
      "data-slot",
      "scroll-area-viewport",
    )
    const stackClassName = extractClassNameByAttribute(
      markup,
      "data-public-map-sidebar-section",
      "organization-stack",
    )

    expect(headerClassName).toContain("px-3")
    expect(shellClassName).toContain("px-3")
    expect(scrollClassName).not.toContain("px-")
    expect(viewportClassName).toContain("[&amp;&gt;div]:!block")
    expect(viewportClassName).toContain("[&amp;&gt;div]:!w-full")
    expect(markup.match(/data-slot="scroll-area"/g)).toHaveLength(1)
    expect(markup).toContain('data-slot="scroll-area-content"')
    expect(markup).toContain('class="box-border min-w-0 w-full max-w-full px-1 pb-4"')
    expect(stackClassName).toContain("w-full")
    expect(stackClassName).toContain("max-w-full")
    expect(stackClassName).not.toContain("px-")
  })

  it("keeps constrained rail cards compact without relying on a wider three-column preview grid", () => {
    const organization = buildOrganization()
    const markup = renderToStaticMarkup(
      React.createElement(PublicMapOrganizationList, {
        organizations: [organization],
        selectedOrgId: organization.id,
        favorites: [],
        query: "",
        constrainedLayout: true,
        onSelectOrg: () => {},
        onToggleFavorite: () => {},
        onOpenDetails: () => {},
      }),
    )

    expect(markup).toContain("grid-cols-2")
    expect(markup).not.toContain("grid-cols-3")
    expect(markup).toContain("w-full min-w-0 max-w-full overflow-hidden")
  })
})
