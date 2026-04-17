import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { PublicMapOrganizationList } from "@/components/public/public-map-index/organization-list"
import {
  PublicMapShellSidebarPanel,
  PublicMapSidebar,
} from "@/components/public/public-map-index/sidebar"
import { Sidebar, SidebarProvider } from "@/components/ui/sidebar"
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
    expect(scrollClassName).toContain("pr-2.5")
    expect(viewportClassName).toContain("[&amp;&gt;div]:!block")
    expect(viewportClassName).toContain("[&amp;&gt;div]:!w-full")
    expect(markup.match(/data-slot="scroll-area"/g)).toHaveLength(1)
    expect(markup).toContain('data-slot="scroll-area-content"')
    expect(markup).toContain('class="box-border min-w-0 w-full max-w-full px-1 pb-4"')
    expect(stackClassName).toContain("w-full")
    expect(stackClassName).toContain("max-w-full")
    expect(stackClassName).not.toContain("px-")
    expect(markup).toContain("bg-sidebar/95")
    expect(markup).not.toContain("border-white/30")
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
    expect(markup).toContain("w-full min-w-0 max-w-full")
    expect(markup).toContain("overflow-hidden")
    expect(markup).toContain("cursor-pointer")
    expect(markup).not.toContain(organization.tagline)
    expect(markup).not.toContain(organization.description ?? "")
    expect(markup).toContain("gap-x-1.5 gap-y-0.5")
    expect(markup).toContain("•")
    expect(markup).toContain(">View<")
    expect(markup).toContain("rounded-2xl border shadow-sm")
    expect(markup).toContain("text-[#06c]")
    expect(markup).not.toContain("rounded-full border border-transparent bg-transparent")
    expect(markup).not.toContain("dark:border-white/30")
  })

  it("prioritizes web-resource metadata inside the constrained inline strip without overflowing badge chrome", () => {
    const organization = buildOrganization({
      isOnlineOnly: true,
    })
    const markup = renderToStaticMarkup(
      React.createElement(PublicMapOrganizationList, {
        organizations: [organization],
        selectedOrgId: null,
        favorites: [],
        query: "",
        constrainedLayout: true,
        onSelectOrg: () => {},
        onToggleFavorite: () => {},
        onOpenDetails: () => {},
      }),
    )

    expect(markup).toContain(">Chicago, IL<")
    expect(markup).toContain(">Web resource<")
    expect(markup).not.toContain(">Community<")
    expect(markup).not.toContain("rounded-md border-border/70 bg-background/85")
  })

  it("renders logo avatars on a white contained surface so transparent logos stay visible", () => {
    const organization = buildOrganization({
      logoUrl: "https://example.com/logo.png",
    })
    const markup = renderToStaticMarkup(
      React.createElement(PublicMapOrganizationList, {
        organizations: [organization],
        selectedOrgId: null,
        favorites: [],
        query: "",
        constrainedLayout: true,
        onSelectOrg: () => {},
        onToggleFavorite: () => {},
        onOpenDetails: () => {},
      }),
    )

    expect(markup).toContain("bg-white")
    expect(markup).toContain('data-slot="avatar"')
  })

  it("shortens all-caps location labels to a readable city-and-state-code format on list cards", () => {
    const organization = buildOrganization({
      city: "CHICAGO",
      state: "IL",
      country: "UNITED STATES",
    })
    const markup = renderToStaticMarkup(
      React.createElement(PublicMapOrganizationList, {
        organizations: [organization],
        selectedOrgId: null,
        favorites: [],
        query: "",
        constrainedLayout: true,
        onSelectOrg: () => {},
        onToggleFavorite: () => {},
        onOpenDetails: () => {},
      }),
    )

    expect(markup).toContain(">Chicago, IL<")
    expect(markup).not.toContain("CHICAGO")
    expect(markup).not.toContain("UNITED STATES")
  })

  it("can mount the find search panel into the shell sidebar without the map overlay rail", () => {
    const organization = buildOrganization()
    const markup = renderToStaticMarkup(
      React.createElement(
        SidebarProvider,
        { defaultOpen: true },
        React.createElement(
          Sidebar,
          { collapsible: "offcanvas", variant: "sidebar" },
          React.createElement(PublicMapShellSidebarPanel, {
            sidebarMode: "search",
            organizations: [organization],
            selectedOrganization: organization,
            favorites: [],
            query: "",
            searchContext: null,
            onQueryChange: () => {},
            onToggleFavorite: () => {},
            onOpenDetails: () => {},
            setSidebarMode: () => {},
          }),
        ),
      ),
    )

    expect(markup).toContain("Resource map")
    expect(markup).toContain('aria-label="Search public organizations"')
    expect(markup).toContain('data-public-map-sidebar-section="rail-organizations-scroll"')
    expect(markup).not.toContain('data-public-map-sidebar-section="rail-detail-scroll"')
    expect(markup).not.toContain("Hide search panel")
  })

  it("shows organization details in the shell sidebar when the find panel is in detail mode", () => {
    const organization = buildOrganization()
    const markup = renderToStaticMarkup(
      React.createElement(
        SidebarProvider,
        { defaultOpen: true },
        React.createElement(
          Sidebar,
          { collapsible: "offcanvas", variant: "sidebar" },
          React.createElement(PublicMapShellSidebarPanel, {
            sidebarMode: "details",
            organizations: [organization],
            selectedOrganization: organization,
            favorites: [],
            query: "",
            searchContext: null,
            onQueryChange: () => {},
            onToggleFavorite: () => {},
            onOpenDetails: () => {},
            setSidebarMode: () => {},
          }),
        ),
      ),
    )

    expect(markup).toContain(organization.name)
    expect(markup).toContain('data-public-map-sidebar-section="rail-detail-scroll"')
    expect(markup).not.toContain('aria-label="Search public organizations"')
  })
})
