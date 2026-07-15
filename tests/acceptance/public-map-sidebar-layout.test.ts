import { readFileSync } from "node:fs"
import { join } from "node:path"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { PublicMapOrganizationList } from "@/components/public/public-map-index/organization-list"
import {
  PublicMapDirectoryRail,
  resolvePublicMapDirectoryRailMode,
  resolvePublicMapDirectoryStatusCount,
} from "@/components/public/public-map-index/directory-rail"
import {
  PublicMapDrawerDetailPanel,
  PublicMapDrawerSearchPanel,
  PublicMapResourceDrawerDetailPanel,
} from "@/components/public/public-map-index/sidebar-panels"
import { resolvePublicMapResourceCategoryIcon } from "@/components/public/public-map-index/resource-category-icon"
import {
  filterPublicMapSavedOrganizations,
  PublicMapMemberRail,
} from "@/components/public/public-map-index/member-rail"
import { PublicMapSavedRail } from "@/components/public/public-map-index/saved-rail"
import { PublicMapSidebar } from "@/components/public/public-map-index/sidebar"
import { PublicMapShellSidebarPanel } from "@/components/public/public-map-index/sidebar-shell-panel"
import { Sidebar, SidebarProvider } from "@/components/ui/sidebar"
import { buildPublicMapGroupFilterCounts } from "@/components/public/public-map-index/category-filter"
import type { PublicMapResourceGuide } from "@/components/public/public-map-index/resource-guides"
import { buildPlatformOrganizationMapItem } from "@/lib/public-map/resource-map-items"
import type { ExternalResourceMapItem } from "@/lib/public-map/resource-map-items"
import type {
  PublicMapOrganization,
  PublicMapProgramPreview,
} from "@/lib/queries/public-map-index"

function buildProgramPreview(
  overrides: Partial<PublicMapProgramPreview> = {}
): PublicMapProgramPreview {
  return {
    id: "program-1",
    title: "Community Kitchen",
    subtitle: "Weekly mutual-aid meals",
    description: "Weekly mutual-aid meals",
    activityKind: "Program",
    chips: ["Program", "Weekly"],
    ctaLabel: "Learn more",
    ctaUrl: "https://example.com/kitchen",
    durationLabel: "Weekly",
    imageUrl: "https://example.com/program.jpg",
    locationUrl: null,
    locationType: "in_person",
    startDate: null,
    ...overrides,
  }
}

function buildOrganization(
  overrides: Partial<PublicMapOrganization> = {}
): PublicMapOrganization {
  return {
    id: "org-1",
    name: "Atlas Collective",
    tagline:
      "Neighborhood support and grassroots coordination across Chicago blocks.",
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
    activityLinks: [],
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

function buildResourceItem(
  overrides: Partial<ExternalResourceMapItem> = {}
): ExternalResourceMapItem {
  return {
    id: "seed-resource:food-access",
    itemType: "external_resource",
    title: "Seed Food Access",
    subtitle: "Food pantry and meal support",
    description: "A superadmin preview resource for meal and pantry access.",
    latitude: 41.8837,
    longitude: -87.6478,
    address: "123 Resource Ave, Chicago, IL",
    addressStreet: "123 Resource Ave",
    city: "Chicago",
    state: "IL",
    country: "United States",
    orgCategory: null,
    resourceCategories: ["food", "food_water"],
    primaryResourceCategory: "food",
    verificationStatus: "pending_review",
    sourceLabel: "Coach House seed data",
    sourceUrl: null,
    lastVerifiedAt: null,
    visibility: "superadmin_preview",
    markerImageUrl: null,
    ...overrides,
  }
}

function buildListItems(...organizations: PublicMapOrganization[]) {
  return organizations.map(buildPlatformOrganizationMapItem)
}

function extractClassNameByAttribute(
  markup: string,
  attribute: string,
  value: string
) {
  const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const tag =
    markup.match(
      new RegExp(`<[^>]*${attribute}="${escapedValue}"[^>]*>`)
    )?.[0] ?? ""
  return tag.match(/class="([^"]*)"/)?.[1] ?? ""
}

describe("public map sidebar layout", () => {
  it("suppresses duplicate resource subtitles in the result list", () => {
    const resource = buildResourceItem({
      title: "Neighborhood Library Cooling Center",
      subtitle: "  Neighborhood   Library Cooling Center  ",
    })
    const markup = renderToStaticMarkup(
      React.createElement(PublicMapOrganizationList, {
        items: [resource],
        organizations: [],
        selectedOrgId: null,
        query: "",
        constrainedLayout: true,
        onSelectItem: () => {},
        onSelectOrg: () => {},
      })
    )

    expect(markup).toContain("Neighborhood Library Cooling Center")
    expect(markup).not.toContain(
      'text-muted-foreground line-clamp-2 text-xs leading-relaxed">Neighborhood Library Cooling Center</p>'
    )
  })

  it("suppresses duplicate resource subtitles in the detail identity section", () => {
    const markup = renderToStaticMarkup(
      React.createElement(PublicMapResourceDrawerDetailPanel, {
        item: buildResourceItem({
          title: "Chopin (Frederic)",
          subtitle: "  Chopin   (Frederic)  ",
          primaryResourceCategory: "emergency_cooling_centers",
          resourceCategories: ["emergency_cooling_centers"],
          sourceLabel: "Chicago Data Portal - Cooling Centers",
          address: "3420 N Long Ave",
          city: "Chicago",
          state: "IL",
        }),
        drawerBodyScrollable: false,
        onBack: () => {},
      })
    )

    expect(markup.match(/Chopin \(Frederic\)/g)).toHaveLength(1)
    expect(markup).toContain(">Cooling Centers<")
    expect(markup).not.toContain(">Emergency<")
  })

  it("uses the liquid glass shell for the public map rail surface", () => {
    const organization = buildOrganization()
    const groupCounts = buildPublicMapGroupFilterCounts([organization])
    const shellSource = readFileSync(
      join(
        process.cwd(),
        "src/components/public/public-map-index/liquid-glass-shell.tsx"
      ),
      "utf8"
    )
    const sidebarSource = readFileSync(
      join(process.cwd(), "src/components/public/public-map-index/sidebar.tsx"),
      "utf8"
    )

    expect(shellSource).toContain('@samasante/liquid-glass"')
    expect(shellSource).toContain("PUBLIC_MAP_LIQUID_GLASS_OPTICS")
    expect(shellSource).toContain('height: "100%"')
    expect(shellSource).toContain('width: "100%"')
    expect(shellSource).not.toContain("filterResolution")
    expect(sidebarSource).toContain("PublicMapLiquidGlassShell")

    const markup = renderToStaticMarkup(
      React.createElement(
        SidebarProvider,
        { defaultOpen: true },
        React.createElement(PublicMapShellSidebarPanel, {
          sidebarMode: "search",
          items: buildListItems(organization),
          organizations: [organization],
          selectedItemId: organization.id,
          selectedOrganization: organization,
          favorites: [],
          query: "",
          activeGroup: "all",
          groupCounts,
          searchContext: null,
          onQueryChange: () => {},
          onActiveGroupChange: () => {},
          onToggleFavorite: () => {},
          onSelectItem: () => {},
          onOpenDetails: () => {},
          onBackToSearch: () => {},
          setSidebarMode: () => {},
        })
      )
    )

    expect(markup).toContain('data-liquid-glass="material"')
  })

  it("keeps the light-mode map canvas free of desaturation and haze overlays", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "src/components/public/public-map-index/map-surface.tsx"
      ),
      "utf8"
    )

    expect(source).toContain('className="h-full w-full"')
    expect(source).not.toContain("brightness-[1.02]")
    expect(source).not.toContain("contrast-[0.98]")
    expect(source).not.toContain("saturate-[0.92]")
    expect(source).not.toContain("rgba(248,250,252")
    expect(source).toContain("hidden dark:block")
  })

  it("gives the rail search layout one scroll owner and a shared horizontal inset", () => {
    const organization = buildOrganization()
    const groupCounts = buildPublicMapGroupFilterCounts([organization])
    const markup = renderToStaticMarkup(
      React.createElement(PublicMapSidebar, {
        sidebarMode: "search",
        sidebarWidth: 374,
        surfaceHeight: 720,
        panelPresentation: "rail",
        portalContainer: null,
        filteredItems: buildListItems(organization),
        filteredOrganizations: [organization],
        selectedItemId: organization.id,
        selectedOrganization: organization,
        favorites: [],
        query: "",
        activeGroup: "all",
        groupCounts,
        searchContext: null,
        setQuery: () => {},
        setActiveGroup: () => {},
        toggleFavorite: () => {},
        onSelectItem: () => {},
        onOpenDetails: () => {},
        onBackToSearch: () => {},
        setSidebarMode: () => {},
      })
    )

    const headerClassName = extractClassNameByAttribute(
      markup,
      "data-public-map-sidebar-section",
      "rail-search-header"
    )
    const shellClassName = extractClassNameByAttribute(
      markup,
      "data-public-map-sidebar-section",
      "rail-organizations-shell"
    )
    const scrollClassName = extractClassNameByAttribute(
      markup,
      "data-public-map-sidebar-section",
      "rail-organizations-scroll"
    )
    const viewportClassName = extractClassNameByAttribute(
      markup,
      "data-slot",
      "scroll-area-viewport"
    )
    const stackClassName = extractClassNameByAttribute(
      markup,
      "data-public-map-sidebar-section",
      "organization-stack"
    )
    const statusHeaderClassName = extractClassNameByAttribute(
      markup,
      "data-public-map-sidebar-section",
      "rail-status-header"
    )
    const categoryFilterClassName = extractClassNameByAttribute(
      markup,
      "aria-label",
      "Filter resources by category"
    )

    expect(headerClassName).toContain("px-3")
    expect(shellClassName).toContain("px-3")
    expect(shellClassName).toContain("overflow-hidden")
    expect(statusHeaderClassName).toContain("shrink-0")
    expect(categoryFilterClassName).toContain("overflow-x-auto")
    expect(categoryFilterClassName).toContain("scroll-fade-effect-x")
    expect(categoryFilterClassName).toContain("[--mask-width:1.25rem]")
    expect(categoryFilterClassName).toContain("[--scroll-buffer:1rem]")
    expect(categoryFilterClassName).toContain("[scrollbar-width:none]")
    expect(categoryFilterClassName).toContain(
      "[&amp;::-webkit-scrollbar]:hidden"
    )
    expect(scrollClassName).not.toContain("px-")
    expect(scrollClassName).toContain("pr-2.5")
    expect(scrollClassName).toContain("h-full")
    expect(scrollClassName).toContain("overflow-hidden")
    expect(viewportClassName).toContain("scroll-fade-effect-y")
    expect(viewportClassName).toContain("[--mask-height:1.5rem]")
    expect(viewportClassName).toContain("[--scroll-buffer:1rem]")
    expect(viewportClassName).toContain("[&amp;&gt;div]:!block")
    expect(viewportClassName).toContain("[&amp;&gt;div]:!w-full")
    expect(markup.match(/data-slot="scroll-area"/g)).toHaveLength(1)
    expect(markup).toContain('data-slot="scroll-area-content"')
    expect(markup).toContain('data-public-map-directory-status-header="true"')
    expect(markup).toContain(
      'class="box-border min-w-0 w-full max-w-full px-1 pt-1 pb-4"'
    )
    expect(markup).toContain('data-public-map-list-pagination="true"')
    expect(markup).toContain("Showing 1 of 1 resources")
    expect(stackClassName).toContain("w-full")
    expect(stackClassName).toContain("max-w-full")
    expect(stackClassName).not.toContain("px-")
    expect(markup).toContain("bg-sidebar/86")
    expect(markup).toContain("supports-[backdrop-filter]:bg-sidebar/76")
    expect(markup).toContain("text-sidebar-foreground")
    expect(markup).toContain("bg-transparent")
    expect(markup).toContain("Find organizations and resources")
    expect(markup).toContain('aria-label="Find organizations and resources"')
    expect(markup).toContain('aria-label="Filter resources by category"')
    expect(markup).toContain(">All<")
    expect(markup).toContain(">Community<")
    expect(markup).toContain('aria-pressed="true"')
    expect(
      markup.indexOf('data-public-map-sidebar-section="rail-status-header"')
    ).toBeLessThan(
      markup.indexOf(
        'data-public-map-sidebar-section="rail-organizations-scroll"'
      )
    )
    expect(
      markup.indexOf(
        'data-public-map-sidebar-section="rail-organizations-scroll"'
      )
    ).toBeLessThan(
      markup.indexOf('data-public-map-sidebar-section="organization-stack"')
    )
    expect(markup).not.toContain("Search organizations, locations, or programs")
    expect(markup).not.toContain(
      "Search organizations, activities, or resources"
    )
    expect(markup).not.toContain("border-white/30")
  })

  it("keeps search context outside the organization list scroll viewport and fades only the list", () => {
    const organization = buildOrganization()
    const searchContext = {
      title: "10 resources here",
      description: "Showing resources at this map point.",
      items: buildListItems(organization),
      onClear: () => {},
    }
    const groupCounts = buildPublicMapGroupFilterCounts([organization])
    const shellMarkup = renderToStaticMarkup(
      React.createElement(
        SidebarProvider,
        { defaultOpen: true },
        React.createElement(PublicMapShellSidebarPanel, {
          sidebarMode: "search",
          items: buildListItems(organization),
          organizations: [organization],
          selectedItemId: organization.id,
          selectedOrganization: organization,
          favorites: [],
          query: "",
          activeGroup: "all",
          groupCounts,
          searchContext,
          onQueryChange: () => {},
          onActiveGroupChange: () => {},
          onToggleFavorite: () => {},
          onSelectItem: () => {},
          onOpenDetails: () => {},
          onBackToSearch: () => {},
          setSidebarMode: () => {},
        })
      )
    )
    const directoryMarkup = renderToStaticMarkup(
      React.createElement(PublicMapDirectoryRail, {
        sidebarMode: "search",
        items: buildListItems(organization),
        organizations: [organization],
        selectedItemId: organization.id,
        selectedOrganization: null,
        favorites: [],
        query: "",
        activeGroup: "all",
        groupCounts,
        searchContext,
        onQueryChange: () => {},
        onActiveGroupChange: () => {},
        onToggleFavorite: () => {},
        onSelectItem: () => {},
        onOpenDetails: () => {},
        onBackToSearch: () => {},
        setSidebarMode: () => {},
      })
    )

    expect(shellMarkup).toContain(
      'data-public-map-sidebar-section="search-context-card"'
    )
    expect(shellMarkup).toContain("scroll-fade-effect-y")
    expect(shellMarkup.indexOf("10 resources here")).toBeLessThan(
      shellMarkup.indexOf(
        'data-public-map-sidebar-section="rail-organizations-scroll"'
      )
    )
    expect(shellMarkup.indexOf("10 resources here")).toBeLessThan(
      shellMarkup.indexOf(
        'data-public-map-sidebar-section="organization-stack"'
      )
    )

    expect(directoryMarkup).toContain(
      'data-public-map-right-rail-section="directory-search-context"'
    )
    expect(directoryMarkup).toContain(
      'data-public-map-right-rail-section="directory-status-header"'
    )
    expect(directoryMarkup).toContain(
      'data-public-map-directory-status-header="true"'
    )
    expect(directoryMarkup).toContain(
      'data-public-map-right-rail-section="directory-list-scroll"'
    )
    expect(directoryMarkup).toContain(
      "h-full min-h-0 flex-1 overflow-hidden pr-2"
    )
    expect(directoryMarkup).toContain("scroll-fade-effect-y")
    expect(
      directoryMarkup.indexOf(
        'data-public-map-right-rail-section="directory-status-header"'
      )
    ).toBeLessThan(
      directoryMarkup.indexOf(
        'data-public-map-right-rail-section="directory-list-scroll"'
      )
    )
    expect(directoryMarkup.indexOf("10 resources here")).toBeLessThan(
      directoryMarkup.indexOf(
        'data-public-map-right-rail-section="directory-list-scroll"'
      )
    )
  })

  it("keeps constrained rail cards compact without relying on a wider three-column preview grid", () => {
    const organization = buildOrganization()
    const markup = renderToStaticMarkup(
      React.createElement(PublicMapOrganizationList, {
        organizations: [organization],
        selectedOrgId: null,
        query: "",
        constrainedLayout: true,
        onSelectOrg: () => {},
        onOpenDetails: () => {},
      })
    )
    const listStackClassName = extractClassNameByAttribute(
      markup,
      "data-public-map-organization-list-section",
      "list-stack"
    )

    expect(listStackClassName.split(" ")).toContain("gap-2")
    expect(listStackClassName.split(" ")).not.toContain("gap-2.5")
    expect(markup).toContain("grid-cols-2")
    expect(markup).not.toContain("grid-cols-3")
    expect(markup).toContain("w-full max-w-full min-w-0")
    expect(markup).toContain("overflow-hidden")
    expect(markup).toContain("cursor-pointer")
    expect(markup).not.toContain(organization.tagline)
    expect(markup).not.toContain(organization.description ?? "")
    expect(markup).toContain("gap-x-1.5 gap-y-0.5")
    expect(markup).toContain("•")
    expect(markup).toContain(">View<")
    expect(markup).toContain("flex min-w-0 items-center")
    expect(markup).toContain(
      "ml-auto h-8 min-w-8 shrink-0 justify-end self-center"
    )
    expect(markup).toContain(">Program<")
    expect(markup).toContain(">Weekly<")
    expect(markup).toContain("Weekly mutual-aid meals")
    expect(markup).toContain("https://example.com/kitchen")
    expect(markup).not.toContain("Featured Programs")
    expect(markup).toContain("border-transparent bg-transparent shadow-none")
    expect(markup).toContain(
      "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50"
    )
    expect(markup).toContain(
      "focus-within:border-border/80 focus-within:bg-accent focus-within:text-accent-foreground dark:focus-within:bg-accent/50"
    )
    expect(markup).toContain(
      "focus-visible:border-border/80 focus-visible:bg-accent focus-visible:text-accent-foreground"
    )
    expect(markup).not.toContain("hover:bg-sidebar-accent/70")
    expect(markup).not.toContain("focus-within:bg-sidebar-accent/75")
    expect(markup).not.toContain("hover:shadow-sm")
    expect(markup).not.toContain("focus-within:shadow-sm")
    expect(markup).not.toContain("focus-visible:shadow-sm")
    expect(markup).not.toContain("bg-sidebar-accent/90 shadow-sm")
    expect(markup).not.toContain("box-shadow")
    expect(markup).toContain("text-[#06c]")
    expect(
      markup.indexOf('data-react-grab-surface-slot="view-button"')
    ).toBeGreaterThan(markup.indexOf('data-react-grab-surface-slot="location"'))
    expect(
      markup.indexOf('data-react-grab-surface-slot="view-button"')
    ).toBeLessThan(
      markup.indexOf('data-react-grab-surface-slot="featured-program"')
    )
    expect(markup).not.toContain(
      "rounded-full border border-transparent bg-transparent"
    )
    expect(markup).not.toContain("h-auto shrink-0 px-0")
    expect(markup).not.toContain("Add Atlas Collective to favorites")
    expect(markup).not.toContain("dark:border-white/30")
  })

  it("renders seed resources in the shared organization list card surface", () => {
    const organization = buildOrganization()
    const resource = buildResourceItem()
    const markup = renderToStaticMarkup(
      React.createElement(PublicMapOrganizationList, {
        items: [buildPlatformOrganizationMapItem(organization), resource],
        organizations: [organization],
        selectedItemId: resource.id,
        selectedOrgId: null,
        query: "food",
        constrainedLayout: true,
        onSelectItem: () => {},
        onSelectOrg: () => {},
        onOpenDetails: () => {},
      })
    )

    expect(markup).toContain("Seed Food Access")
    expect(markup).toContain("Food pantry and meal support")
    expect(markup).toContain(">Food<")
    expect(markup).toContain(">Chicago, IL<")
    expect(markup).not.toContain(">Food, Water<")
    expect(markup).not.toContain(">Pending review<")
    expect(markup).not.toContain(">Seed preview<")
    expect(markup).not.toContain(">External data<")
    expect(markup).toContain('aria-label="Open details for Seed Food Access"')
    expect(markup).toContain(
      "Clicking the non-action parts of the card opens the resource detail panel."
    )
    expect(markup).toContain("background-color:#e11d48")
    expect(markup).toContain('data-public-map-filled-icon="true"')
    expect(markup).toContain('data-public-map-resource-category-icon="food"')
    expect(markup).toContain("border-transparent bg-transparent shadow-none")
    expect(markup).not.toContain('aria-label="Resource marker preview"')
    expect(markup).not.toContain("PublicMapResourcePreviewPopover")
  })

  it("opens seed resources in the shared right-rail detail surface", () => {
    const resource = buildResourceItem({
      sourceUrl: "https://example.org/food-access",
      lastVerifiedAt: "2026-06-20T12:00:00.000Z",
      lastUpdatedAt: "2026-06-21T12:00:00.000Z",
      deliveryModes: ["in_person", "phone"],
      hoursLabel: "Monday through Friday, 9 AM to 5 PM",
      links: [
        {
          id: "seed-resource:food-access:link:intake",
          label: "Food pantry intake",
          url: "https://example.org/intake",
          type: "intake",
          domain: "example.org",
          isPrimary: true,
        },
      ],
      contacts: [
        {
          id: "seed-resource:food-access:contact:phone",
          label: "Intake phone",
          value: "(312) 555-0100",
          type: "phone",
          url: "tel:+13125550100",
          isPrimary: true,
        },
      ],
      services: [
        {
          id: "seed-resource:food-access:service:pantry",
          title: "Free groceries",
          description: "Weekly pantry pickup and meal support.",
          whoItHelps: "Families and individuals seeking food access.",
          eligibility: "Open to nearby residents.",
          cost: "Free",
          languages: ["English", "Spanish"],
          intakeUrl: "https://example.org/intake",
          appointmentInfo: "Walk-ins accepted before 4 PM.",
          documentsNeeded: ["Photo ID if available"],
          accessibilityNotes: "Wheelchair-accessible entrance.",
          urgentAvailability: "Same-day pantry support may be available.",
          ageRange: "All ages",
          serviceArea: ["Chicago, IL"],
          deliveryModes: ["in_person"],
        },
      ],
    })
    const groupCounts = buildPublicMapGroupFilterCounts([])

    expect(
      resolvePublicMapDirectoryRailMode({
        sidebarMode: "details",
        selectedOrganization: null,
        selectedResourceItem: resource,
      })
    ).toBe("details")

    const markup = renderToStaticMarkup(
      React.createElement(PublicMapDirectoryRail, {
        sidebarMode: "details",
        items: [resource],
        organizations: [],
        selectedItemId: resource.id,
        selectedOrganization: null,
        selectedResourceItem: resource,
        favorites: [],
        query: "",
        activeGroup: "all",
        groupCounts,
        searchContext: null,
        onQueryChange: () => {},
        onActiveGroupChange: () => {},
        onToggleFavorite: () => {},
        onSelectItem: () => {},
        onOpenDetails: () => {},
        onBackToSearch: () => {},
        setSidebarMode: () => {},
      })
    )

    expect(markup).toContain(
      'data-public-map-right-rail-section="directory-detail"'
    )
    expect(markup).toContain(
      "flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
    )
    expect(markup).toContain('data-slot="scroll-area"')
    expect(markup).toContain(">Resource<")
    expect(markup).toContain("Seed Food Access")
    expect(markup).toContain("Food pantry and meal support")
    expect(markup).toContain(">Food<")
    expect(markup).toContain(">Water<")
    expect(markup).toContain(">Pending review<")
    expect(markup).toContain(">Seed preview<")
    expect(markup).toContain(">Coach House seed data<")
    expect(markup).toContain("123 Resource Ave")
    expect(markup).toContain(">Links<")
    expect(markup).toContain("Food pantry intake")
    expect(markup).toContain("example.org")
    expect(markup).toContain(">Contact<")
    expect(markup).toContain("(312) 555-0100")
    expect(markup).toContain("Intake phone")
    expect(markup).toContain(">Services<")
    expect(markup).toContain("Free groceries")
    expect(markup).toContain("Families and individuals seeking food access.")
    expect(markup).toContain("Walk-ins accepted before 4 PM.")
    expect(markup).toContain("Photo ID if available")
    expect(markup).toContain(">Access<")
    expect(markup).toContain("In person, Phone")
    expect(markup).toContain("Monday through Friday, 9 AM to 5 PM")
    expect(markup).toContain('aria-label="Back to search"')
    expect(markup).toContain(">Data source<")
    expect(markup).toContain(">Open source<")
    expect(markup.indexOf(">Data source<")).toBeGreaterThan(
      markup.indexOf(">Address<")
    )
    expect(markup).toContain('data-public-map-filled-icon="true"')
    expect(markup).toContain('data-public-map-resource-category-icon="food"')
    expect(markup).toContain("text-white")
    expect(markup).not.toContain("raw_snapshot")
    expect(markup).not.toContain("field_confidence")
    expect(markup).not.toContain("PublicMapResourcePreviewPopover")
  })

  it("keeps resource websites primary and moves source links to the bottom", () => {
    const sourceUrl = "https://finder.example.org/resources"
    const markup = renderToStaticMarkup(
      React.createElement(PublicMapResourceDrawerDetailPanel, {
        item: buildResourceItem({
          sourceUrl,
          links: [
            {
              id: "resource-source",
              label: "Finder source",
              url: sourceUrl,
              type: "source",
              domain: "finder.example.org",
            },
            {
              id: "resource-intake",
              label: "Food pantry intake",
              url: "https://example.org/intake",
              type: "intake",
              domain: "example.org",
              isPrimary: true,
            },
            {
              id: "resource-website",
              label: "Official website",
              url: "https://example.org",
              type: "website",
              domain: "example.org",
            },
          ],
        }),
        drawerBodyScrollable: false,
        onBack: () => {},
      })
    )
    const linksIndex = markup.indexOf(">Links<")
    const websiteIndex = markup.indexOf("Official website")
    const intakeIndex = markup.indexOf("Food pantry intake")
    const addressIndex = markup.indexOf(">Address<")
    const sourceIndex = markup.indexOf(">Data source<")

    expect(linksIndex).toBeGreaterThan(-1)
    expect(websiteIndex).toBeGreaterThan(linksIndex)
    expect(websiteIndex).toBeLessThan(intakeIndex)
    expect(markup).not.toContain("Finder source")
    expect(addressIndex).toBeGreaterThan(-1)
    expect(sourceIndex).toBeGreaterThan(addressIndex)
    expect(
      markup.match(/https:\/\/finder\.example\.org\/resources/g)
    ).toHaveLength(1)
  })

  it("renders resource detail images when external resources provide one", () => {
    const resource = buildResourceItem({
      markerImageUrl: "https://example.org/resource-photo.jpg",
    })
    const groupCounts = buildPublicMapGroupFilterCounts([])

    const markup = renderToStaticMarkup(
      React.createElement(PublicMapDirectoryRail, {
        sidebarMode: "details",
        items: [resource],
        organizations: [],
        selectedItemId: resource.id,
        selectedOrganization: null,
        selectedResourceItem: resource,
        favorites: [],
        query: "",
        activeGroup: "all",
        groupCounts,
        searchContext: null,
        onQueryChange: () => {},
        onActiveGroupChange: () => {},
        onToggleFavorite: () => {},
        onSelectItem: () => {},
        onOpenDetails: () => {},
        onBackToSearch: () => {},
        setSidebarMode: () => {},
      })
    )

    expect(markup).toContain('src="https://example.org/resource-photo.jpg"')
    expect(markup).toContain('alt="Seed Food Access image"')
    expect(markup).toContain("absolute inset-0 h-full w-full object-cover")
    expect(markup).toContain('data-public-map-filled-icon="true"')
    expect(markup).toContain('data-public-map-resource-category-icon="food"')
    expect(markup).toContain("bg-muted/45")
  })

  it("maps resource detail category icons from the resource taxonomy", () => {
    expect(resolvePublicMapResourceCategoryIcon("food")).toEqual(
      expect.arrayContaining([expect.stringContaining("M200,40H48")])
    )
    expect(resolvePublicMapResourceCategoryIcon("health")).toEqual(
      expect.arrayContaining([expect.stringContaining("M240,102c0,70")])
    )
    expect(
      resolvePublicMapResourceCategoryIcon("community_transportation")
    ).toEqual(expect.arrayContaining([expect.stringContaining("M248,80v24")]))
  })

  it("prioritizes web-resource metadata inside the constrained inline strip without overflowing badge chrome", () => {
    const organization = buildOrganization({
      isOnlineOnly: true,
    })
    const markup = renderToStaticMarkup(
      React.createElement(PublicMapOrganizationList, {
        organizations: [organization],
        selectedOrgId: null,
        query: "",
        constrainedLayout: true,
        onSelectOrg: () => {},
        onOpenDetails: () => {},
      })
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
        query: "",
        constrainedLayout: true,
        onSelectOrg: () => {},
        onOpenDetails: () => {},
      })
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
        query: "",
        constrainedLayout: true,
        onSelectOrg: () => {},
        onOpenDetails: () => {},
      })
    )

    expect(markup).toContain(">Chicago, IL<")
    expect(markup).not.toContain("CHICAGO")
    expect(markup).not.toContain("UNITED STATES")
  })

  it("moves the internal organization directory into the member right rail tabs", () => {
    const organization = buildOrganization()
    const guideItems = buildListItems(organization)
    const guides = [
      {
        id: "nyc-cooling-centers",
        title: "NYC Cooling Centers",
        subtitle: "Cooling and heat relief locations across the five boroughs.",
        kicker: "New York",
        itemCount: guideItems.length,
        items: guideItems,
        primaryResourceCategory: "emergency_cooling_centers",
        visualVariant: "nyc",
      },
    ] satisfies PublicMapResourceGuide[]
    const groupCounts = buildPublicMapGroupFilterCounts([organization])
    const publicRightRailSource = readFileSync(
      join(
        process.cwd(),
        "src/components/public/public-map-index/right-rail.tsx"
      ),
      "utf8"
    )
    const directoryMarkup = renderToStaticMarkup(
      React.createElement(PublicMapDirectoryRail, {
        sidebarMode: "search",
        items: buildListItems(organization),
        organizations: [organization],
        selectedItemId: organization.id,
        selectedOrganization: null,
        favorites: [],
        query: "",
        activeGroup: "community",
        groupCounts,
        searchContext: null,
        onQueryChange: () => {},
        onActiveGroupChange: () => {},
        onToggleFavorite: () => {},
        onSelectItem: () => {},
        onOpenDetails: () => {},
        onBackToSearch: () => {},
        setSidebarMode: () => {},
      })
    )
    const memberRailMarkup = renderToStaticMarkup(
      React.createElement(PublicMapMemberRail, {
        directoryRail: React.createElement(
          "div",
          { "data-public-map-right-rail-section": "directory-search" },
          "Directory"
        ),
        directoryMode: "search",
        guides,
        savedOrganizations: [],
        onGuideSelect: () => {},
        onSelectOrganization: () => {},
        onToggleFavorite: () => {},
      })
    )
    const guidesRailMarkup = renderToStaticMarkup(
      React.createElement(PublicMapMemberRail, {
        directoryRail: null,
        directoryMode: null,
        guides,
        savedOrganizations: [],
        onGuideSelect: () => {},
        onSelectOrganization: () => {},
        onToggleFavorite: () => {},
      })
    )

    expect(directoryMarkup).toContain(
      'data-public-map-right-rail-section="directory-search"'
    )
    expect(directoryMarkup).toContain(
      'data-public-map-right-rail-section="directory-status-header"'
    )
    expect(directoryMarkup).toContain(
      'data-public-map-right-rail-section="directory-list-scroll"'
    )
    expect(
      directoryMarkup.indexOf(
        'data-public-map-right-rail-section="directory-status-header"'
      )
    ).toBeLessThan(
      directoryMarkup.indexOf(
        'data-public-map-right-rail-section="directory-list-scroll"'
      )
    )
    expect(directoryMarkup).not.toContain(">Resource map<")
    expect(directoryMarkup).toContain(
      'aria-label="Filter resources by category"'
    )
    expect(directoryMarkup).toContain('aria-pressed="true"')
    expect(directoryMarkup).toContain(organization.name)
    expect(resolvePublicMapDirectoryStatusCount(1)).toBe("1")
    expect(resolvePublicMapDirectoryStatusCount(1234)).toBe("1,234")
    expect(directoryMarkup).toContain(">Resources<")
    expect(directoryMarkup).toContain(">Active<")
    expect(directoryMarkup).toContain(">1<")
    expect(directoryMarkup).toContain(
      'aria-label="Resources directory status: active, 1"'
    )
    expect(directoryMarkup).toContain('aria-hidden="true"')
    expect(directoryMarkup).toContain(
      "flex shrink-0 items-center justify-between gap-2"
    )
    expect(directoryMarkup).toContain(
      "text-muted-foreground min-w-0 truncate text-xs font-medium tracking-[0.08em] uppercase"
    )
    expect(directoryMarkup).toContain("border-border/70 bg-card/92")
    expect(directoryMarkup).toContain("text-foreground")
    expect(directoryMarkup).toContain(
      "inline-flex h-7 shrink-0 items-center gap-2 rounded-full border px-2.5 text-xs"
    )
    expect(directoryMarkup).toContain(
      "dark:border-input dark:bg-input/30 dark:text-foreground"
    )
    expect(directoryMarkup).not.toContain("bg-zinc-900/88")
    expect(directoryMarkup).not.toContain(
      "text-xs font-medium shadow-sm backdrop-blur"
    )
    expect(directoryMarkup).not.toContain(
      "inline-flex h-8 shrink-0 items-center gap-3 rounded-full bg-zinc-900/88 px-3 text-sm"
    )
    expect(directoryMarkup).toContain("bg-green-500")
    expect(directoryMarkup).toContain("h-2 w-2")
    expect(directoryMarkup).toContain("motion-safe:animate-ping")
    expect(directoryMarkup).not.toContain("users online")
    expect(directoryMarkup).toContain('data-public-map-list-pagination="true"')
    expect(directoryMarkup).toContain("Showing 1 of 1 resources")
    expect(directoryMarkup).toContain("grid-cols-2")
    expect(directoryMarkup).not.toContain(
      'data-public-map-sidebar-section="resource-guides"'
    )
    expect(directoryMarkup).not.toContain("NYC Cooling Centers")
    expect(memberRailMarkup).toContain(">Find<")
    expect(memberRailMarkup).toContain(">Guides<")
    expect(memberRailMarkup).toContain(">Saved<")
    expect(memberRailMarkup).not.toContain(">Recent<")
    expect(memberRailMarkup).not.toContain(">Joined<")
    expect(memberRailMarkup).not.toContain(">Alerts<")
    expect(memberRailMarkup).toContain('data-variant="line"')
    expect(memberRailMarkup).toContain("gap-1 bg-transparent")
    expect(memberRailMarkup).toContain(
      "h-7 w-full min-w-0 justify-start self-start p-0 sm:w-auto"
    )
    expect(memberRailMarkup).not.toContain("self-end")
    expect(memberRailMarkup).not.toContain(
      "h-9 w-full items-center gap-1 rounded-full border border-border/70 bg-background/70 p-1"
    )
    expect(memberRailMarkup).not.toContain(
      "rounded-full border border-border/70 bg-background/70 p-1"
    )
    expect(memberRailMarkup).toContain(
      "flex h-full min-h-0 flex-col gap-3 overflow-hidden"
    )
    expect(directoryMarkup).toContain(
      "flex h-full min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden"
    )
    expect(memberRailMarkup).toContain(
      "mt-0 flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    )
    expect(memberRailMarkup).not.toContain("flex min-h-full flex-col gap-3")
    expect(publicRightRailSource).toContain(
      "flex h-full min-h-0 min-w-0 flex-col gap-4 overflow-hidden"
    )
    expect(publicRightRailSource).not.toContain(
      "flex min-h-full flex-col gap-4"
    )
    expect(memberRailMarkup).toContain(
      "h-7 min-w-0 flex-1 rounded-none bg-transparent px-2 py-1 text-left text-xs leading-none"
    )
    expect(memberRailMarkup).toContain("data-[state=active]:bg-transparent")
    expect(memberRailMarkup).toContain("data-[state=active]:shadow-none")
    expect(memberRailMarkup).not.toContain("data-[state=active]:bg-muted/55")
    expect(memberRailMarkup).not.toContain("h-6 min-h-0 min-w-0 rounded-full")

    const emptyGuidesMarkup = renderToStaticMarkup(
      React.createElement(PublicMapMemberRail, {
        directoryRail: React.createElement("div", null, "Directory"),
        directoryMode: "search",
        guides: [],
        savedOrganizations: [],
        onGuideSelect: () => {},
        onSelectOrganization: () => {},
        onToggleFavorite: () => {},
      })
    )
    expect(emptyGuidesMarkup).toContain(">Guides<")
    expect(guidesRailMarkup).toContain(
      'data-public-map-member-rail-section="guides-panel"'
    )
    expect(guidesRailMarkup).toContain(
      'data-public-map-member-rail-section="guides-header"'
    )
    expect(guidesRailMarkup).toContain(
      'data-public-map-member-rail-section="guides-scroll"'
    )
    expect(
      guidesRailMarkup.indexOf(
        'data-public-map-member-rail-section="guides-header"'
      )
    ).toBeLessThan(
      guidesRailMarkup.indexOf(
        'data-public-map-member-rail-section="guides-scroll"'
      )
    )
    expect(guidesRailMarkup).toContain(
      'data-public-map-sidebar-section="resource-guides"'
    )
    expect(guidesRailMarkup).toContain("NYC Cooling Centers")
    expect(guidesRailMarkup).toContain("rounded-xl border border-input")
    expect(guidesRailMarkup).toContain("bg-input/30")
    expect(guidesRailMarkup).toContain("shadow-sm backdrop-blur")
    expect(guidesRailMarkup).not.toContain("border-white/18")
    expect(guidesRailMarkup).not.toContain("bg-[radial-gradient")
    expect(guidesRailMarkup).not.toContain("data-public-map-filled-icon")
    expect(guidesRailMarkup).not.toContain(
      "inline-flex size-8 items-center justify-center rounded-full"
    )
    expect(memberRailMarkup).toContain("Directory")
  })

  it("lets the saved tab search and category-filter saved organizations", () => {
    const communityOrganization = buildOrganization({
      id: "community-org",
      name: "Atlas Collective",
      tagline: "Neighborhood meals and community support",
      groups: ["community"],
      primaryGroup: "community",
    })
    const healthOrganization = buildOrganization({
      id: "health-org",
      name: "Harbor Health",
      tagline: "Mobile clinic and dental referrals",
      groups: ["health"],
      primaryGroup: "health",
    })

    expect(
      filterPublicMapSavedOrganizations({
        activeGroup: "all",
        query: "dental",
        savedOrganizations: [communityOrganization, healthOrganization],
      }).map((organization) => organization.id)
    ).toEqual(["health-org"])
    expect(
      filterPublicMapSavedOrganizations({
        activeGroup: "community",
        query: "",
        savedOrganizations: [communityOrganization, healthOrganization],
      }).map((organization) => organization.id)
    ).toEqual(["community-org"])

    const markup = renderToStaticMarkup(
      React.createElement(PublicMapMemberRail, {
        directoryRail: null,
        directoryMode: null,
        savedOrganizations: [communityOrganization, healthOrganization],
        onSelectOrganization: () => {},
        onToggleFavorite: () => {},
      })
    )

    expect(markup).toContain(">Saved<")
    const savedRailMarkup = renderToStaticMarkup(
      React.createElement(PublicMapSavedRail, {
        savedOrganizations: [communityOrganization, healthOrganization],
        favoritesCount: 2,
        onSelectOrganization: () => {},
        onToggleFavorite: () => {},
      })
    )

    expect(savedRailMarkup).toContain(
      'data-public-map-right-rail-section="saved-organizations-scroll"'
    )
    expect(savedRailMarkup).toContain('data-slot="scroll-area"')
    expect(savedRailMarkup).toContain(
      "flex h-full min-h-0 min-w-0 flex-col gap-3 overflow-hidden"
    )
    expect(savedRailMarkup).toContain("h-full min-h-0 flex-1 overflow-hidden")
    expect(savedRailMarkup).toContain("scroll-fade-effect-y")
    expect(savedRailMarkup).not.toContain("max-h-[52vh]")
    expect(markup).toContain('data-variant="line"')
    expect(markup).toContain("gap-1 bg-transparent")
    expect(markup).toContain(
      "h-7 w-full min-w-0 justify-start self-start p-0 sm:w-auto"
    )
    expect(markup).not.toContain("self-end")
    expect(markup).not.toContain(
      "rounded-full border border-border/70 bg-background/70 p-1"
    )
    expect(markup).toContain(
      'data-public-map-member-rail-section="saved-panel"'
    )
    expect(markup).toContain(
      'data-public-map-member-rail-section="saved-search-controls"'
    )
    expect(markup).toContain('aria-label="Find organizations and resources"')
    expect(markup).toContain('aria-label="Filter resources by category"')
    expect(markup).toContain(">All<")
    expect(markup).toContain(">Community<")
    expect(markup).toContain(">Health<")
    expect(markup).toContain(">2<")
    expect(markup).toContain(">1<")
    expect(markup).toContain("Saved organizations")
    expect(markup).toContain("Atlas Collective")
    expect(markup).toContain("Harbor Health")
    expect(markup).toContain(
      'data-public-map-member-rail-section="saved-list-scroll"'
    )
    expect(markup).toContain('data-slot="scroll-area"')
    expect(markup).toContain("h-full min-h-0 flex-1 overflow-hidden")
    expect(markup).toContain("scroll-fade-effect-y")
    expect(markup).toContain("overscroll-contain")
    expect(markup).toContain("[--mask-height:1.5rem]")
    expect(markup).toContain("[--scroll-buffer:1rem]")
    expect(markup).toContain(
      "h-auto w-0 max-w-full min-w-0 flex-1 justify-start overflow-hidden"
    )
    expect(markup).toContain("text-left font-normal whitespace-normal")
    expect(markup).toContain("w-full min-w-0 overflow-hidden")
    expect(markup).not.toContain("max-h-[52vh]")
  })

  it("uses the right rail directory detail view when a map organization is selected", () => {
    const organization = buildOrganization()
    const groupCounts = buildPublicMapGroupFilterCounts([organization])
    expect(
      resolvePublicMapDirectoryRailMode({
        sidebarMode: "details",
        selectedOrganization: organization,
      })
    ).toBe("details")
    expect(
      resolvePublicMapDirectoryRailMode({
        sidebarMode: "details",
        selectedOrganization: null,
      })
    ).toBe("search")

    const markup = renderToStaticMarkup(
      React.createElement(PublicMapDirectoryRail, {
        sidebarMode: "details",
        items: buildListItems(organization),
        organizations: [organization],
        selectedItemId: organization.id,
        selectedOrganization: organization,
        favorites: [organization.id],
        query: "",
        activeGroup: "all",
        groupCounts,
        searchContext: null,
        onQueryChange: () => {},
        onActiveGroupChange: () => {},
        onToggleFavorite: () => {},
        onSelectItem: () => {},
        onOpenDetails: () => {},
        onBackToSearch: () => {},
        setSidebarMode: () => {},
      })
    )

    expect(markup).toContain(
      'data-public-map-right-rail-section="directory-detail"'
    )
    expect(markup).toContain(
      'data-public-map-right-rail-section="directory-detail-scroll"'
    )
    expect(markup).toContain(
      "flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
    )
    expect(markup).toContain("h-full min-h-0 flex-1 overflow-hidden pr-2")
    expect(markup).toContain("scroll-fade-effect-y")
    expect(markup).toContain('data-slot="scroll-area"')
    expect(markup).toContain(organization.name)
    expect(markup).toContain('aria-label="Back to search"')
    expect(markup).toContain(
      'aria-label="Remove Atlas Collective from favorites"'
    )
    expect(markup).toContain('aria-pressed="true"')
  })

  it("can mount the find search panel into the shell sidebar without the map overlay rail", () => {
    const organization = buildOrganization()
    const groupCounts = buildPublicMapGroupFilterCounts([organization])
    const markup = renderToStaticMarkup(
      React.createElement(
        SidebarProvider,
        { defaultOpen: true },
        React.createElement(
          Sidebar,
          { collapsible: "offcanvas", variant: "sidebar" },
          React.createElement(PublicMapShellSidebarPanel, {
            sidebarMode: "search",
            items: buildListItems(organization),
            organizations: [organization],
            selectedItemId: organization.id,
            selectedOrganization: organization,
            favorites: [],
            query: "",
            activeGroup: "all",
            groupCounts,
            searchContext: null,
            onQueryChange: () => {},
            onActiveGroupChange: () => {},
            onToggleFavorite: () => {},
            onSelectItem: () => {},
            onOpenDetails: () => {},
            onBackToSearch: () => {},
            setSidebarMode: () => {},
          })
        )
      )
    )

    expect(markup).not.toContain(">Resource map<")
    expect(markup).toContain('aria-label="Find organizations and resources"')
    expect(markup).toContain('aria-label="Filter resources by category"')
    expect(markup).toContain(
      'data-public-map-sidebar-section="rail-organizations-scroll"'
    )
    expect(markup).toContain(">Resources<")
    expect(markup).toContain(">Active<")
    expect(markup).toContain(">1<")
    expect(markup).toContain(
      'aria-label="Resources directory status: active, 1"'
    )
    expect(markup).toContain("border-border/70 bg-card/92")
    expect(markup).toContain("text-foreground")
    expect(markup).toContain(
      "inline-flex h-7 shrink-0 items-center gap-2 rounded-full border px-2.5 text-xs"
    )
    expect(markup).toContain(
      "dark:border-input dark:bg-input/30 dark:text-foreground"
    )
    expect(markup).not.toContain("bg-zinc-900/88")
    expect(markup).not.toContain("text-xs font-medium shadow-sm backdrop-blur")
    expect(markup).not.toContain(
      "inline-flex h-8 shrink-0 items-center gap-3 rounded-full bg-zinc-900/88 px-3 text-sm"
    )
    expect(markup).not.toContain("users online")
    expect(markup).not.toContain(
      'data-public-map-sidebar-section="rail-detail-scroll"'
    )
    expect(markup).not.toContain("Hide search panel")
  })

  it("shows organization details in the shell sidebar when the find panel is in detail mode", () => {
    const organization = buildOrganization({
      website: "https://atlas.example.org",
      locationUrl: "https://atlas.example.org/profile-location",
      programPreview: buildProgramPreview({
        id: "resource-1",
        title: "Atlas resource library",
        activityKind: "Web resource",
        chips: ["Web resource", "Digital"],
        ctaUrl: null,
        durationLabel: "Ongoing",
        locationUrl: "https://atlas.example.org/resources",
        locationType: "online",
      }),
      programs: [
        buildProgramPreview({
          id: "resource-1",
          title: "Atlas resource library",
          activityKind: "Web resource",
          chips: ["Web resource", "Digital"],
          ctaUrl: null,
          durationLabel: "Ongoing",
          locationUrl: "https://atlas.example.org/resources",
          locationType: "online",
        }),
      ],
      programCount: 1,
    })
    const groupCounts = buildPublicMapGroupFilterCounts([organization])
    const markup = renderToStaticMarkup(
      React.createElement(
        SidebarProvider,
        { defaultOpen: true },
        React.createElement(
          Sidebar,
          { collapsible: "offcanvas", variant: "sidebar" },
          React.createElement(PublicMapShellSidebarPanel, {
            sidebarMode: "details",
            items: buildListItems(organization),
            organizations: [organization],
            selectedItemId: organization.id,
            selectedOrganization: organization,
            favorites: [],
            query: "",
            activeGroup: "all",
            groupCounts,
            searchContext: null,
            onQueryChange: () => {},
            onActiveGroupChange: () => {},
            onToggleFavorite: () => {},
            onSelectItem: () => {},
            onOpenDetails: () => {},
            onBackToSearch: () => {},
            setSidebarMode: () => {},
          })
        )
      )
    )

    expect(markup).toContain(organization.name)
    expect(markup).toContain("Links from activities")
    expect(markup).toContain(
      "Links attached to published programs, events, services, and web resources from this organization."
    )
    expect(markup).toContain("Atlas resource library")
    expect(markup).toContain("Web resource · Ongoing")
    expect(markup).toContain("atlas.example.org")
    expect(markup).not.toContain("Provided by organization profile")
    expect(markup).not.toContain("Needs review")
    expect(markup).not.toContain("Reviewed source")
    expect(markup).not.toContain("Verified source")
    const addressIndex = markup.indexOf(">Address<")
    const linksIndex = markup.indexOf(">Links from activities<")
    const activityIndex = markup.indexOf(">Activity<")
    expect(addressIndex).toBeGreaterThan(-1)
    expect(linksIndex).toBeGreaterThan(addressIndex)
    expect(activityIndex).toBeGreaterThan(linksIndex)
    expect(markup).toContain(
      'data-public-map-sidebar-section="rail-detail-scroll"'
    )
    expect(markup).toContain(
      "h-full min-h-0 flex-1 overflow-hidden px-1 pr-3.5"
    )
    expect(markup).toContain("scroll-fade-effect-y")
    expect(markup).toContain('aria-label="Share"')
    expect(markup).toContain('aria-label="Add Atlas Collective to favorites"')
    expect(
      markup.indexOf('aria-label="Add Atlas Collective to favorites"')
    ).toBeGreaterThan(markup.indexOf('aria-label="Share"'))
    expect(markup).not.toContain('aria-label="Search public organizations"')
    expect(markup).not.toContain('aria-label="Hide organization panel"')
  })

  it("keeps drawer search and detail bodies scrollable at every snap point", () => {
    const organization = buildOrganization()
    const resource = buildResourceItem()
    const items = [buildPlatformOrganizationMapItem(organization), resource]
    const groupCounts = buildPublicMapGroupFilterCounts(items)
    const searchMarkup = renderToStaticMarkup(
      React.createElement(PublicMapDrawerSearchPanel, {
        query: "",
        items,
        organizations: [organization],
        selectedItemId: null,
        selectedOrgId: null,
        drawerBodyScrollable: false,
        activeGroup: "all",
        groupCounts,
        onQueryChange: () => {},
        onActiveGroupChange: () => {},
        onSelectItem: () => {},
        onOpenDetails: () => {},
      })
    )
    const organizationDetailMarkup = renderToStaticMarkup(
      React.createElement(PublicMapDrawerDetailPanel, {
        organization,
        favorites: [],
        drawerBodyScrollable: false,
        onBack: () => {},
        onToggleFavorite: () => {},
      })
    )
    const resourceDetailMarkup = renderToStaticMarkup(
      React.createElement(PublicMapResourceDrawerDetailPanel, {
        item: resource,
        drawerBodyScrollable: false,
        onBack: () => {},
      })
    )

    expect(searchMarkup).toContain(
      'data-public-map-sidebar-section="drawer-organizations-scroll"'
    )
    expect(searchMarkup).toContain("overflow-y-auto")
    expect(searchMarkup).toContain("overscroll-contain")
    expect(searchMarkup).toContain("[-webkit-overflow-scrolling:touch]")
    expect(organizationDetailMarkup).toContain(
      'data-public-map-sidebar-section="drawer-detail-scroll"'
    )
    expect(organizationDetailMarkup).toContain('data-slot="scroll-area"')
    expect(organizationDetailMarkup).toContain(
      "h-full min-h-0 flex-1 overflow-hidden px-1"
    )
    expect(organizationDetailMarkup).toContain("overscroll-contain")
    expect(resourceDetailMarkup).toContain(
      'data-public-map-sidebar-section="drawer-detail-scroll"'
    )
    expect(resourceDetailMarkup).toContain('data-slot="scroll-area"')
    expect(resourceDetailMarkup).toContain(
      "h-full min-h-0 flex-1 overflow-hidden px-1"
    )
    expect(resourceDetailMarkup).toContain("overscroll-contain")
  })

  it("hides raw data API endpoints from public resource detail links", () => {
    const rawArcgisUrl =
      "https://services2.arcgis.com/w657bnjzrjguNyOy/arcgis/rest/services/Warming_and_Cooling_Centers/FeatureServer/0/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=json"
    const rawOverpassUrl =
      "https://overpass-api.de/api/interpreter?data=%5Bout%3Ajson%5D%3Bout%3B"
    const rawSocrataUrl =
      "https://data.cityofchicago.org/resource/msrk-w9ih.json?$limit=500"
    const markup = renderToStaticMarkup(
      React.createElement(PublicMapResourceDrawerDetailPanel, {
        item: buildResourceItem({
          sourceLabel: "County open data",
          sourceUrl: rawArcgisUrl,
          links: [
            {
              id: "raw-source",
              label: "Raw data endpoint",
              url: rawArcgisUrl,
              type: "source",
              domain: "services2.arcgis.com",
            },
            {
              id: "raw-overpass-source",
              label: "Overpass endpoint",
              url: rawOverpassUrl,
              type: "source",
              domain: "overpass-api.de",
            },
            {
              id: "raw-socrata-source",
              label: "Socrata endpoint",
              url: rawSocrataUrl,
              type: "source",
              domain: "data.cityofchicago.org",
            },
            {
              id: "public-page",
              label: "Cooling center information",
              url: "https://cooling.example.org/info",
              type: "website",
              domain: "cooling.example.org",
            },
          ],
        }),
        drawerBodyScrollable: false,
        onBack: () => {},
      })
    )

    expect(markup).toContain("Cooling center information")
    expect(markup).toContain("cooling.example.org")
    expect(markup).not.toContain("services2.arcgis.com")
    expect(markup).not.toContain("overpass-api.de")
    expect(markup).not.toContain("data.cityofchicago.org")
    expect(markup).not.toContain("Raw data endpoint")
    expect(markup).not.toContain("Overpass endpoint")
    expect(markup).not.toContain("Socrata endpoint")
    expect(markup).not.toContain("Open source")
  })
})
