import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import {
  MAP_STYLE,
  PUBLIC_MAP_SATELLITE_STYLE,
  PUBLIC_MAP_SPACE_FOG,
  resolvePublicMapStyleForTheme,
} from "@/components/public/public-map-index/constants"

const ROOT = process.cwd()

function readRoute(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("public find routes", () => {
  it("uses the satellite Mapbox style for every public map theme", () => {
    expect(PUBLIC_MAP_SATELLITE_STYLE).toBe(
      "mapbox://styles/mapbox/satellite-v9"
    )
    expect(MAP_STYLE).toBe(PUBLIC_MAP_SATELLITE_STYLE)
    expect(resolvePublicMapStyleForTheme("light")).toBe(
      PUBLIC_MAP_SATELLITE_STYLE
    )
    expect(resolvePublicMapStyleForTheme("dark")).toBe(
      PUBLIC_MAP_SATELLITE_STYLE
    )
    expect(PUBLIC_MAP_SPACE_FOG["space-color"]).toBe("#05070d")
    expect(PUBLIC_MAP_SPACE_FOG["star-intensity"]).toBeGreaterThan(0)
    expect(PUBLIC_MAP_SPACE_FOG.range).toEqual([0.8, 8])

    const constantsSource = readRoute(
      "src/components/public/public-map-index/constants.ts"
    )
    const runtimeSource = readRoute(
      "src/components/public/public-map-index/public-map-index-runtime.ts"
    )
    expect(constantsSource).not.toContain("cmm8y8rq600o201s5ctyi8y27")
    expect(constantsSource).not.toContain("dark-v11")
    expect(constantsSource).not.toContain("standard-satellite")
    expect(constantsSource).not.toContain("PUBLIC_MAP_DARK_BASEMAP_CONFIG")
    expect(constantsSource).toContain("PUBLIC_MAP_SPACE_FOG")
    expect(constantsSource).toContain("map.setFog(PUBLIC_MAP_SPACE_FOG)")
    expect(runtimeSource).toContain("applyPublicMapSpaceFog(map)")
    expect(runtimeSource).toContain("applyPublicMapGlobePresentation(map)")
    expect(runtimeSource).not.toContain("setStyle(")
    expect(runtimeSource).not.toContain("setConfigProperty")
  })

  it("does not render the workspace onboarding card on the map", () => {
    const routeFiles = [
      "src/app/(public)/find/page.tsx",
      "src/app/(public)/find/[slug]/page.tsx",
    ]

    for (const routeFile of routeFiles) {
      const source = readRoute(routeFile)
      expect(source).not.toContain("OnboardingWorkspaceCard")
      expect(source).not.toContain("completeOnboardingAction")
    }
  })

  it("wires onboarding-locked free/member users into the map-native intro", () => {
    const routeFiles = [
      "src/app/(public)/find/page.tsx",
      "src/app/(public)/find/[slug]/page.tsx",
    ]
    const publicMapSource = readRoute(
      "src/components/public/public-map-index.tsx"
    )
    const previewControlsSource = readRoute(
      "src/components/public/public-map-index/member-onboarding-preview-controls.tsx"
    )
    const overlaySource = readRoute(
      "src/components/public/public-map-index/member-onboarding-overlay.tsx"
    )

    for (const routeFile of routeFiles) {
      const source = readRoute(routeFile)
      expect(source).toContain("completeMemberMapOnboardingAction")
      expect(source).toContain("memberOnboarding={")
      expect(source).toContain("memberMapOnboarding.hasOrganizationSwitcher")
    }

    expect(publicMapSource).toContain("usePublicMapMemberOnboardingMapOverlay")
    expect(publicMapSource).toContain("mapOverlay={memberOnboardingMapOverlay}")
    expect(previewControlsSource).toContain("PublicMapMemberOnboardingOverlay")
    expect(overlaySource).not.toContain("OnboardingWorkspaceCard")
    expect(overlaySource).toContain("Welcome to Find")
    expect(overlaySource).toContain("Search the directory")
    expect(overlaySource).toContain("Save locations")
    expect(overlaySource).toContain("Notifications")
  })

  it("lets platform admins preview the map intro from authenticated find", () => {
    const routeFiles = [
      "src/app/(public)/find/page.tsx",
      "src/app/(public)/find/[slug]/page.tsx",
    ]
    const publicMapSource = readRoute(
      "src/components/public/public-map-index.tsx"
    )
    const previewControlsSource = readRoute(
      "src/components/public/public-map-index/member-onboarding-preview-controls.tsx"
    )
    const previewSource = readRoute(
      "src/components/public/public-map-index/member-onboarding-preview.ts"
    )

    for (const routeFile of routeFiles) {
      const source = readRoute(routeFile)
      expect(source).toContain("adminOnboardingPreview={")
      expect(source).toContain("shellState.isAdmin")
      expect(source).toContain("canToggle: true")
      expect(source).toContain("memberMapOnboarding.hasOrganizationSwitcher")
    }

    expect(publicMapSource).toContain("usePublicMapMemberOnboardingMapOverlay")
    expect(publicMapSource).toContain("mapOverlay={memberOnboardingMapOverlay}")
    expect(previewControlsSource).toContain(
      "PublicMapMemberOnboardingPreviewToggle"
    )
    expect(previewControlsSource).toContain("Welcome")
    expect(previewControlsSource).toContain("Hide welcome")
    expect(previewControlsSource).toContain(
      "onDismiss={() => handleToggleAdminOnboardingPreview(false)}"
    )
    expect(previewSource).toContain(
      'PUBLIC_MAP_MEMBER_ONBOARDING_PREVIEW_SOURCE = "admin_preview"'
    )
    expect(previewSource).toContain(
      'PUBLIC_MAP_MEMBER_ONBOARDING_QUERY_KEY = "member_onboarding"'
    )
  })

  it("renders authenticated users inside the app shell without moving find under workspace", () => {
    const source = readRoute("src/app/(public)/find/page.tsx")
    expect(source).toContain("AuthenticatedFindShell")
    expect(source).toContain('presentationMode="app-shell"')
    expect(source).not.toContain("/workspace/find")
  })

  it("preserves selected organization detail wiring on slug routes", () => {
    const source = readRoute("src/app/(public)/find/[slug]/page.tsx")
    const authenticatedBranchIndex = source.indexOf("<AuthenticatedFindShell")
    const publicBranchIndex = source.indexOf("<HomeCanvasPreview")
    const firstInitialSlugIndex = source.indexOf(
      "initialPublicSlug={matched.publicSlug}"
    )
    const secondInitialSlugIndex = source.indexOf(
      "initialPublicSlug={matched.publicSlug}",
      firstInitialSlugIndex + 1
    )

    expect(authenticatedBranchIndex).toBeGreaterThan(-1)
    expect(publicBranchIndex).toBeGreaterThan(-1)
    expect(source).toContain("organizationDetail")
    expect(firstInitialSlugIndex).toBeGreaterThan(authenticatedBranchIndex)
    expect(firstInitialSlugIndex).toBeLessThan(publicBranchIndex)
    expect(secondInitialSlugIndex).toBeGreaterThan(publicBranchIndex)
  })

  it("clears selected organization state when returning from detail to search", () => {
    const publicMapSource = readRoute(
      "src/components/public/public-map-index.tsx"
    )
    const publicMapSelectionSource = readRoute(
      "src/components/public/public-map-index/public-map-index-selection.ts"
    )
    const mapSurfaceSource = readRoute(
      "src/components/public/public-map-index/map-surface.tsx"
    )
    const sidebarSource = readRoute(
      "src/components/public/public-map-index/sidebar.tsx"
    )
    const chromeSource = readRoute(
      "src/components/public/public-map-index/public-map-index-chrome.tsx"
    )
    const directoryRailSource = readRoute(
      "src/components/public/public-map-index/directory-rail.tsx"
    )

    expect(publicMapSelectionSource).toContain(
      "const handleBackToSearch = useCallback"
    )
    expect(publicMapSelectionSource).toContain("setSelectedOrgId(null)")
    expect(publicMapSource).toContain("onBackToSearch={handleBackToSearch}")
    expect(mapSurfaceSource).toContain("onBackToSearch")
    expect(chromeSource).toContain("onBackToSearch={onBackToSearch}")
    expect(sidebarSource).toContain("onBack={onBackToSearch}")
    expect(directoryRailSource).toContain("onBack={onBackToSearch}")
  })

  it("restores the saved sidebar preference in authenticated find", () => {
    const routeFiles = [
      "src/app/(public)/find/page.tsx",
      "src/app/(public)/find/[slug]/page.tsx",
    ]
    const shellSource = readRoute(
      "src/features/find-map/components/authenticated-find-shell.tsx"
    )
    const appShellInnerSource = readRoute(
      "src/components/app-shell/app-shell-inner.tsx"
    )
    const appShellTypesSource = readRoute("src/components/app-shell/types.ts")

    for (const routeFile of routeFiles) {
      const source = readRoute(routeFile)
      expect(source).toContain("readAppSidebarDefaultOpen")
      expect(source).toContain("defaultSidebarOpen")
      expect(source).toContain("defaultSidebarOpen={defaultSidebarOpen}")
    }

    expect(appShellInnerSource).toContain("defaultSidebarOpen = false")
    expect(appShellTypesSource).toContain("defaultSidebarOpen?: boolean")
    expect(appShellInnerSource).toContain("defaultOpen={defaultSidebarOpen}")
    expect(shellSource).toContain('contentPresentation="full-bleed"')
  })

  it("lets authenticated find use the full app-shell canvas instead of a bordered map frame", () => {
    const routeFiles = [
      "src/app/(public)/find/page.tsx",
      "src/app/(public)/find/[slug]/page.tsx",
    ]
    const shellSource = readRoute(
      "src/features/find-map/components/authenticated-find-shell.tsx"
    )
    const mapSurfaceSource = readRoute(
      "src/components/public/public-map-index/map-surface.tsx"
    )
    const publicMapSource = readRoute(
      "src/components/public/public-map-index.tsx"
    )
    const publicMapSelectionSource = readRoute(
      "src/components/public/public-map-index/public-map-index-selection.ts"
    )
    const publicMapChromeSource = readRoute(
      "src/components/public/public-map-index/public-map-index-chrome.tsx"
    )
    const appShellSource = readRoute(
      "src/components/app-shell/app-shell-inner.tsx"
    )
    const shellMainContentSource = readRoute(
      "src/components/app-shell/components/shell-main-content.tsx"
    )

    for (const routeFile of routeFiles) {
      const source = readRoute(routeFile)
      expect(source).not.toContain("FindMapFrame")
      expect(source).not.toContain("rounded-lg border border-border/70")
    }

    expect(shellSource).toContain('contentPresentation="full-bleed"')
    expect(mapSurfaceSource).toContain("h-full min-h-0 w-full min-w-0 flex-1")
    expect(publicMapSource).toContain("resolvePublicMapPresentationFlags")
    expect(publicMapSelectionSource).toContain(
      'const useAppShellRightRailDirectory = presentationMode === "app-shell"'
    )
    expect(publicMapSelectionSource).toContain("renderMapOverlaySidebar:")
    expect(publicMapSelectionSource).toContain(
      "renderDesktopSidebar && !useAppShellRightRailDirectory"
    )
    expect(publicMapChromeSource).toContain("PublicMapDirectoryRail")
    expect(publicMapChromeSource).toContain("directoryRail={directoryRail}")
    expect(publicMapChromeSource).toContain("useAppShellRightRailDirectory ?")
    expect(publicMapChromeSource).not.toContain(
      "useAppShellRightRailDirectory && panelPresentation"
    )
    expect(publicMapChromeSource).not.toContain(
      'useAppShellRightRailDirectory && panelPresentation === "rail"'
    )
    expect(shellSource).toContain("resizableRightRail")
    expect(appShellSource).toContain(
      "!isMobile && hasRightRail && resizableRightRail"
    )
    expect(appShellSource).not.toContain(
      "!isMobile && hasRightRail && rightOpen && resizableRightRail"
    )
    expect(appShellSource).not.toContain('derivedContext !== "public"')
    expect(publicMapSource).toContain(
      "renderDesktopSidebar={flags.renderMapOverlaySidebar}"
    )
    expect(publicMapSource).toContain(
      "renderMobileDrawer={!flags.useHomeCanvasSidebarSlot || isMobile}"
    )
    expect(publicMapSource).not.toContain("w-[23rem]")
    expect(publicMapSource).not.toContain("manageShellSidebarOpen={false}")
    expect(shellMainContentSource).toContain("data-shell-mode={")
    expect(shellMainContentSource).toContain(
      'useFullBleedContent ? "full-bleed" : "default"'
    )
    expect(appShellSource).toContain(
      "md:[--shell-right-rail-width:min(22rem,36vw)]"
    )
    expect(shellSource).toContain(
      "showWorkspaceHome={state.showMemberWorkspace}"
    )
    expect(shellSource).toContain(
      "showMemberWorkspace={state.showMemberWorkspace}"
    )
    expect(shellSource).toContain("sidebarHeaderContent={")
    expect(shellSource).toContain("MemberWorkspaceOrgSwitcher")
    expect(shellSource).toContain("state.memberWorkspaceHeader")
    expect(appShellSource).toContain("isMobile")
    expect(shellMainContentSource).toContain('? "rounded-none border-0"')
    expect(shellMainContentSource).toContain(
      ': "rounded-[28px] border border-[color:var(--shell-border)]"'
    )
    expect(appShellSource).not.toContain("useFullBleedContent || isMobile")
  })

  it("uses the same Find, Guides, and Saved rail for public and authenticated find", () => {
    const chromeSource = readRoute(
      "src/components/public/public-map-index/public-map-index-chrome.tsx"
    )
    const memberRailSource = readRoute(
      "src/components/public/public-map-index/member-rail.tsx"
    )
    const rightRailSource = readRoute(
      "src/components/public/public-map-index/right-rail.tsx"
    )

    expect(chromeSource).toContain(
      "useAppShellRightRailDirectory || useHomeCanvasSidebarSlot"
    )
    expect(chromeSource).toContain(
      'data-public-map-tabbed-rail-placement="home-canvas"'
    )
    expect(chromeSource).toContain("<PublicMapMemberRail")
    expect(chromeSource).toContain("directoryRail={directoryRail}")
    expect(chromeSource).not.toContain("PublicMapShellSidebarPanel")
    expect(chromeSource).toContain("{useHomeCanvasSidebarSlot ? (")
    expect(chromeSource).toContain("{useAppShellRightRailDirectory ? (")
    expect(rightRailSource).toContain("<PublicMapMemberRail")
    expect(memberRailSource).toContain('data-public-map-tabbed-rail=""')
    expect(memberRailSource).toContain('data-public-map-tab-list=""')
    expect(memberRailSource).toContain(
      "const hasGuides = Boolean(onGuideSelect)"
    )
    expect(memberRailSource).toContain(">Find</span>")
    expect(memberRailSource).toContain(">Guides</span>")
    expect(memberRailSource).toContain(">Saved</span>")
  })

  it("wires category filtering through the search rail and map markers", () => {
    const publicMapSource = readRoute(
      "src/components/public/public-map-index.tsx"
    )
    const searchCardSource = readRoute(
      "src/components/public/public-map-index/search-card.tsx"
    )
    const categoryFilterSource = readRoute(
      "src/components/public/public-map-index/category-filter.tsx"
    )
    const resourceCategoryIconSource = readRoute(
      "src/components/public/public-map-index/resource-category-icon.tsx"
    )
    const markerIconSource = readRoute(
      "src/lib/public-map/public-map-marker-icons.ts"
    )
    const filterUrlStateSource = readRoute(
      "src/components/public/public-map-index/filter-url-state.ts"
    )
    const filterUrlHookSource = readRoute(
      "src/components/public/public-map-index/use-filter-url-state.ts"
    )
    const filterStateSource = readRoute(
      "src/components/public/public-map-index/public-map-index-filter-state.ts"
    )

    expect(publicMapSource).toContain("usePublicMapFilterUrlState")
    expect(publicMapSource).toContain(
      "onFilterChange: clearMapTransientSelection"
    )
    expect(publicMapSource).toContain(
      "const deferredQuery = useDeferredValue(query)"
    )
    expect(filterUrlHookSource).toContain("resolvePublicMapFilterUrlState")
    expect(filterUrlHookSource).toContain("buildPublicMapFilterHref")
    expect(filterUrlHookSource).toContain("const pathname = usePathname()")
    expect(filterUrlHookSource).toContain("filterStateRef")
    expect(filterUrlHookSource).toContain(
      "router.replace(nextHref, { scroll: false })"
    )
    expect(filterUrlHookSource).toContain(
      "const [query, setQuery] = useState(initialFilterState.query)"
    )
    expect(filterUrlHookSource).toContain("initialFilterState.activeGroup")
    expect(filterStateSource).toContain("buildPublicMapGroupFilterCounts")
    expect(filterStateSource).toContain("buildPublicMapItems")
    expect(publicMapSource).toContain("organizations: filteredOrganizations")
    expect(searchCardSource).toContain("PublicMapCategoryFilter")
    expect(categoryFilterSource).toContain(
      'aria-label="Filter resources by category"'
    )
    expect(categoryFilterSource).toContain("PUBLIC_MAP_RESOURCE_CATEGORY_ORDER")
    expect(categoryFilterSource).toContain("PublicMapResourceCategoryIcon")
    expect(categoryFilterSource).toContain("PublicMapAllCategoryIcon")
    expect(categoryFilterSource).toContain("aria-pressed={selected}")
    expect(categoryFilterSource).toContain("resolvePublicMapGroupFilterParam")
    expect(categoryFilterSource).toContain("border-input bg-input/30")
    expect(categoryFilterSource).toContain("rounded-full border px-2.5")
    expect(categoryFilterSource).toContain("shadow-sm backdrop-blur")
    expect(categoryFilterSource).toContain("!bg-input/50 text-foreground")
    expect(categoryFilterSource).toContain('selected ? "text-foreground"')
    expect(categoryFilterSource).not.toContain("hover:text-white")
    expect(categoryFilterSource).toContain("hover:!bg-input/50")
    expect(categoryFilterSource).toContain("focus-visible:!bg-input/50")
    expect(categoryFilterSource).toContain(
      "transition-[background-color,border-color,color,opacity]"
    )
    expect(categoryFilterSource).not.toContain("dark:bg-foreground")
    expect(categoryFilterSource).not.toContain(
      "bg-foreground text-background hover:bg-foreground"
    )
    expect(categoryFilterSource).not.toContain(
      "text-muted-foreground dark:text-background/72"
    )
    expect(categoryFilterSource).not.toContain("dark:hover:!bg-muted/50")
    expect(categoryFilterSource).not.toContain("dark:hover:bg-accent/50")
    expect(categoryFilterSource).not.toContain("lucide-react")
    expect(resourceCategoryIconSource).toContain("resource-category-icon-paths")
    expect(markerIconSource).toContain("resource-category-icon-paths")
    expect(resourceCategoryIconSource).not.toContain("lucide-react")
    expect(filterUrlStateSource).toContain('PUBLIC_MAP_QUERY_PARAM = "q"')
    expect(filterUrlStateSource).toContain(
      'PUBLIC_MAP_CATEGORY_PARAM = "category"'
    )
    expect(filterUrlStateSource).toContain("buildPublicMapFilterHref")
  })

  it("wires resource marker selection into the shared list and detail surfaces", () => {
    const publicMapSource = readRoute(
      "src/components/public/public-map-index.tsx"
    )
    const publicMapSelectionSource = readRoute(
      "src/components/public/public-map-index/public-map-index-selection.ts"
    )
    const mapSurfaceSource = readRoute(
      "src/components/public/public-map-index/map-surface.tsx"
    )
    const resourceDetailSource = readRoute(
      "src/components/public/public-map-index/resource-detail.tsx"
    )
    const resourceDetailChromeSource = readRoute(
      "src/components/public/public-map-index/resource-detail-primary-sections.tsx"
    )
    const mapItemsStateSource = readRoute(
      "src/components/public/public-map-index/map-items-state.ts"
    )

    expect(publicMapSource).toContain("selectedListItemId")
    expect(publicMapSource).toContain("handleSelectMapMarker")
    expect(publicMapSource).toContain("handleSelectListItem")
    expect(publicMapSource).toContain(
      "preferNationalFallback: includeSeedResources && !initialPublicSlug"
    )
    expect(publicMapSource).toContain("directoryItems={directoryListItems}")
    expect(publicMapSource).toContain("selectedItemId={selectedListItemId}")
    expect(publicMapSource).toContain(
      "selectedResourceItem={selectedResourceItem}"
    )
    expect(publicMapSelectionSource).toContain('setSidebarMode("details")')
    expect(mapSurfaceSource).toContain("filteredItems")
    expect(mapSurfaceSource).toContain("onSelectItem")
    expect(resourceDetailSource).toContain("PublicMapResourceDetail")
    expect(resourceDetailSource).toContain("PublicMapResourceDetailChrome")
    expect(resourceDetailChromeSource).toContain("Back to search")
    expect(mapSurfaceSource).not.toContain("PublicMapResourcePreviewPopover")
    expect(mapItemsStateSource).toContain("resolvePublicMapItemSelectableId")
    expect(mapItemsStateSource).toContain("buildPublicMapListItems")
    expect(mapItemsStateSource).toContain(
      "resolvePublicMapListItemsFromSelectableIds"
    )
    expect(mapItemsStateSource).not.toContain("PreviewPopover")
  })

  it("falls back to organization markers when the resource map adapter is empty", () => {
    const clusteredMarkersSource = readRoute(
      "src/components/public/public-map-index/use-public-map-clustered-markers.ts"
    )

    expect(clusteredMarkersSource).toContain(
      "const resolvedMapItems = mapItems ?? []"
    )
    expect(clusteredMarkersSource).toContain(
      "const shouldUseMapItems = resolvedMapItems.length > 0"
    )
    expect(clusteredMarkersSource).toContain("currentMapItems.length > 0")
    expect(clusteredMarkersSource).toContain(
      "buildPublicMapPointFeatures(organizationsRef.current, {"
    )
    expect(clusteredMarkersSource).toContain("markerTheme,")
    expect(clusteredMarkersSource).toContain("PUBLIC_MAP_FULL_WORLD_BBOX")
    expect(clusteredMarkersSource).toContain("let clusterIndexReady = false")
    expect(clusteredMarkersSource).toContain("if (!clusterIndexReady) return")
    expect(clusteredMarkersSource).toContain("clusterIndexReady = true")
    expect(clusteredMarkersSource).toContain(
      'viewportQueryState.lastViewportKey = ""'
    )
  })

  it("does not render the member profile card in public or authenticated find rails", () => {
    const routeFiles = [
      "src/app/(public)/find/page.tsx",
      "src/app/(public)/find/[slug]/page.tsx",
    ]
    const publicMapSource = readRoute(
      "src/components/public/public-map-index.tsx"
    )
    const rightRailSource = readRoute(
      "src/components/public/public-map-index/right-rail.tsx"
    )

    for (const routeFile of routeFiles) {
      expect(readRoute(routeFile)).not.toContain(
        "memberProfile={viewerState.memberProfile}"
      )
    }

    expect(publicMapSource).not.toContain("memberProfile")
    expect(rightRailSource).not.toContain("PublicMapMemberProfileCard")
    expect(rightRailSource).not.toContain("flex flex-col gap-3 p-4")
  })

  it("keeps authenticated find viewer detection lightweight", () => {
    const viewerStateSource = readRoute(
      "src/features/find-map/server/viewer-state.ts"
    )

    expect(viewerStateSource).toContain("supabase.auth.getUser()")
    expect(viewerStateSource).not.toContain('.from("profiles")')
    expect(viewerStateSource).not.toContain("buildOnboardingFlowDefaults")
    expect(viewerStateSource).not.toContain("memberProfile")
  })
})
