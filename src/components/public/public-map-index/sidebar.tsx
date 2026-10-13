"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import SearchIcon from "lucide-react/dist/esm/icons/search"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHandle,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { cn } from "@/lib/utils"

import type { PublicMapGroupFilterKey } from "./category-filter"
import type { SidebarMode } from "./constants"
import {
  buildPublicMapDrawerSnapPoints,
  resolvePublicMapDrawerSnapPointIndex,
} from "./sidebar-snap-points"
import { PublicMapMemberRail, type PublicMapMemberTab } from "./member-rail"
import {
  PublicMapRailPanel,
  usePublicMapDrawerSelectionHandlers,
} from "./sidebar-member-panels"
import {
  PublicMapDrawerDetailPanel,
  PublicMapDrawerSearchPanel,
  PublicMapRailDetailPanel,
  PublicMapRailSearchPanel,
  PublicMapResourceDrawerDetailPanel,
  PublicMapResourceRailDetailPanel,
} from "./sidebar-panels"
import {
  noopPublicMapSidebarAction,
  type PublicMapSidebarProps,
} from "./sidebar-contract"
import {
  PUBLIC_MAP_OVERLAY_GLASS_CLASSNAME,
  PUBLIC_MAP_SIDEBAR_ACTION_SURFACE_CLASSNAME,
} from "./sidebar-theme"

export type { PublicMapSidebarSearchContext } from "./sidebar-panels"

function usePublicMapDrawerSearchHandlers({
  setActiveGroup,
  setActiveSnapIndex,
  setDrawerTab,
  setQuery,
  setSidebarMode,
}: {
  setActiveGroup: (group: PublicMapGroupFilterKey) => void
  setActiveSnapIndex: (
    value: 0 | 1 | 2 | ((current: 0 | 1 | 2) => 0 | 1 | 2)
  ) => void
  setDrawerTab: (tab: PublicMapMemberTab) => void
  setQuery: (value: string) => void
  setSidebarMode: (mode: SidebarMode) => void
}) {
  const engageSearch = useCallback(() => {
    setDrawerTab("directory")
    setSidebarMode("search")
    setActiveSnapIndex((current) => (current === 0 ? 1 : current))
  }, [setActiveSnapIndex, setDrawerTab, setSidebarMode])
  const changeQuery = useCallback(
    (value: string) => {
      setQuery(value)
      engageSearch()
    },
    [engageSearch, setQuery]
  )
  const changeGroup = useCallback(
    (group: PublicMapGroupFilterKey) => {
      setActiveGroup(group)
      engageSearch()
    },
    [engageSearch, setActiveGroup]
  )

  return { changeGroup, changeQuery, engageSearch }
}

export function PublicMapSidebar({
  sidebarMode,
  sidebarWidth,
  surfaceHeight,
  panelPresentation,
  portalContainer,
  filteredItems,
  filteredOrganizations,
  selectedItemId,
  selectedOrganization,
  selectedResourceItem = null,
  canManageResourceMap = false,
  organizationCurationAction,
  resourceMapCurationAction,
  favorites,
  collectedResourceIds = [],
  guides = [],
  savedOrganizations = [],
  savedResources = [],
  unresolvedCollectedResourceCount = 0,
  query,
  activeGroup,
  groupCounts,
  resourceItemsLoadStatus = "ready",
  resourceItemsLoadError = null,
  searchPending = false,
  searchContext = null,
  setQuery,
  setActiveGroup,
  retryResourceItems = noopPublicMapSidebarAction,
  toggleFavorite,
  toggleCollectedResource = noopPublicMapSidebarAction,
  onSelectItem,
  onGuideSelect,
  onSelectOrganization,
  onOpenDetails,
  onBackToSearch,
  setSidebarMode,
}: PublicMapSidebarProps) {
  const compact = panelPresentation === "drawer"
  const effectiveSidebarMode =
    compact && sidebarMode === "hidden"
      ? "search"
      : sidebarMode === "details" &&
          !selectedOrganization &&
          !selectedResourceItem
        ? "search"
        : sidebarMode
  const panelOpen = compact ? true : effectiveSidebarMode !== "hidden"
  const constrainedRailLayout =
    panelPresentation === "rail" && sidebarWidth < 376
  const snapPoints = useMemo(
    () => buildPublicMapDrawerSnapPoints(surfaceHeight),
    [surfaceHeight]
  )
  const [activeSnapIndex, setActiveSnapIndex] = useState<0 | 1 | 2>(0), [drawerTab, setDrawerTab] = useState<PublicMapMemberTab>("directory")
  const activeSnapPoint = snapPoints[activeSnapIndex]
  const drawerIsFullscreen = activeSnapIndex === 2
  const drawerViewportHeight = drawerIsFullscreen
    ? "calc(100% - 1.625rem)"
    : `calc(${activeSnapPoint} - 1.625rem)`
  useEffect(() => {
    if (compact && sidebarMode === "hidden") {
      setSidebarMode("search")
    }
  }, [compact, setSidebarMode, sidebarMode])
  useEffect(() => {
    if (panelPresentation !== "drawer") return
    if (!panelOpen) {
      setActiveSnapIndex(0)
      return
    }

    setActiveSnapIndex(effectiveSidebarMode === "details" ? 1 : 0)
  }, [effectiveSidebarMode, panelOpen, panelPresentation])

  function resetDrawerToSearch() {
    setActiveSnapIndex(0)
    setDrawerTab("directory")
    setSidebarMode("search")
  }
  const listItems = searchContext?.items ?? filteredItems
  const handleDrawerTabChange = useCallback(
    (nextTab: PublicMapMemberTab) => {
      setDrawerTab(nextTab)
      if (nextTab !== "directory") {
        setSidebarMode("search")
        setActiveSnapIndex(1)
      }
    },
    [setSidebarMode]
  )
  const {
    handleGuideSelect: handleDrawerGuideSelect,
    handleOrganizationSelect: handleDrawerOrganizationSelect,
    handleResourceSelect: handleDrawerResourceSelect,
  } = usePublicMapDrawerSelectionHandlers({
    onGuideSelect,
    onSelectItem,
    onSelectOrganization,
    setActiveSnapIndex,
    setDrawerTab,
  })
  const {
    changeGroup: handleDrawerGroupChange,
    changeQuery: handleDrawerQueryChange,
    engageSearch: handleDrawerSearchEngage,
  } = usePublicMapDrawerSearchHandlers({
    setActiveGroup,
    setActiveSnapIndex,
    setDrawerTab,
    setQuery,
    setSidebarMode,
  })

  const railDirectoryPanel =
    effectiveSidebarMode === "search" ? (
      <PublicMapRailSearchPanel
        query={query}
        searchContext={searchContext}
        items={listItems}
        organizations={filteredOrganizations}
        selectedItemId={selectedItemId}
        selectedOrgId={selectedOrganization?.id ?? null}
        constrainedLayout={constrainedRailLayout}
        activeGroup={activeGroup}
        groupCounts={groupCounts}
        resourceItemsLoadStatus={resourceItemsLoadStatus}
        resourceItemsLoadError={resourceItemsLoadError}
        searchPending={searchPending}
        onQueryChange={setQuery}
        onActiveGroupChange={setActiveGroup}
        onHidePanel={() => setSidebarMode("hidden")}
        onRetryResourceItems={retryResourceItems}
        onSelectItem={onSelectItem}
        onOpenDetails={(organizationId) =>
          onOpenDetails(organizationId, {
            preserveSearchContext: Boolean(searchContext),
          })
        }
      />
    ) : selectedOrganization ? (
      <PublicMapRailDetailPanel
        canManageResourceMap={canManageResourceMap}
        organizationCurationAction={organizationCurationAction}
        organization={selectedOrganization}
        favorites={favorites}
        onBack={onBackToSearch}
        onToggleFavorite={toggleFavorite}
      />
    ) : selectedResourceItem ? (
      <PublicMapResourceRailDetailPanel
        canManageResourceMap={canManageResourceMap}
        collected={collectedResourceIds.includes(selectedResourceItem.id)}
        item={selectedResourceItem}
        onBack={onBackToSearch}
        onToggleCollected={toggleCollectedResource}
        resourceMapCurationAction={resourceMapCurationAction}
      />
    ) : null

  const railPanel = (
    <PublicMapRailPanel
      directoryRail={railDirectoryPanel}
      directoryMode={effectiveSidebarMode === "details" ? "details" : "search"}
      guides={guides}
      savedOrganizations={savedOrganizations}
      savedResources={savedResources}
      unresolvedCollectedResourceCount={unresolvedCollectedResourceCount} onRetryResourceItems={retryResourceItems}
      resourceItemsLoadStatus={resourceItemsLoadStatus} resourceItemsLoadError={resourceItemsLoadError}
      onGuideSelect={onGuideSelect}
      onSelectOrganization={onSelectOrganization}
      onSelectResource={onSelectItem}
      onToggleFavorite={toggleFavorite}
      onToggleCollectedResource={toggleCollectedResource}
    />
  )

  const drawerDirectoryPanel =
    effectiveSidebarMode === "search" ? (
      <PublicMapDrawerSearchPanel
        query={query}
        searchContext={searchContext}
        items={listItems}
        organizations={filteredOrganizations}
        selectedItemId={selectedItemId}
        selectedOrgId={selectedOrganization?.id ?? null}
        activeGroup={activeGroup}
        groupCounts={groupCounts}
        resourceItemsLoadStatus={resourceItemsLoadStatus}
        resourceItemsLoadError={resourceItemsLoadError}
        searchPending={searchPending}
        onQueryChange={handleDrawerQueryChange}
        onSearchEngage={handleDrawerSearchEngage}
        onActiveGroupChange={handleDrawerGroupChange}
        onRetryResourceItems={retryResourceItems}
        onSelectItem={onSelectItem}
        onOpenDetails={(organizationId) =>
          onOpenDetails(organizationId, {
            preserveSearchContext: Boolean(searchContext),
          })
        }
      />
    ) : selectedOrganization ? (
      <PublicMapDrawerDetailPanel
        canManageResourceMap={canManageResourceMap}
        organizationCurationAction={organizationCurationAction}
        organization={selectedOrganization}
        favorites={favorites}
        onBack={onBackToSearch}
        onToggleFavorite={toggleFavorite}
      />
    ) : selectedResourceItem ? (
      <PublicMapResourceDrawerDetailPanel
        canManageResourceMap={canManageResourceMap}
        collected={collectedResourceIds.includes(selectedResourceItem.id)}
        item={selectedResourceItem}
        onBack={onBackToSearch}
        onToggleCollected={toggleCollectedResource}
        resourceMapCurationAction={resourceMapCurationAction}
      />
    ) : null

  const drawerPanel = (
    <PublicMapMemberRail
      activeTab={drawerTab}
      directoryRail={drawerDirectoryPanel}
      directoryMode={effectiveSidebarMode === "details" ? "details" : "search"}
      guides={guides}
      savedOrganizations={savedOrganizations}
      savedResources={savedResources}
      unresolvedCollectedResourceCount={unresolvedCollectedResourceCount} onRetryResourceItems={retryResourceItems}
      resourceItemsLoadStatus={resourceItemsLoadStatus} resourceItemsLoadError={resourceItemsLoadError}
      onActiveTabChange={handleDrawerTabChange}
      onGuideSelect={handleDrawerGuideSelect}
      onSelectOrganization={handleDrawerOrganizationSelect}
      onSelectResource={handleDrawerResourceSelect}
      onToggleFavorite={toggleFavorite}
      onToggleCollectedResource={toggleCollectedResource}
    />
  )

  return (
    <>
      <div
        className={cn(
          "absolute top-4 left-4 z-20 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          effectiveSidebarMode === "hidden"
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none -translate-x-1 opacity-0"
        )}
      >
        <Button
          type="button"
          variant="ghost"
          onClick={() => setSidebarMode("search")}
          className={cn(
            "h-10 rounded-full px-3 shadow-sm backdrop-blur-xl",
            PUBLIC_MAP_SIDEBAR_ACTION_SURFACE_CLASSNAME
          )}
        >
          <SearchIcon className="h-4 w-4" aria-hidden />
          <span className="sr-only">Open resource map panel</span>
        </Button>
      </div>

      {panelPresentation === "drawer" ? (
        <Drawer
          container={portalContainer}
          activeSnapPoint={activeSnapPoint}
          disablePreventScroll
          dismissible={false}
          fadeFromIndex={2}
          modal={false}
          noBodyStyles
          open={panelOpen}
          snapToSequentialPoint
          setActiveSnapPoint={(nextSnapPoint) => {
            const nextIndex = resolvePublicMapDrawerSnapPointIndex({
              snapPoint: nextSnapPoint,
              snapPoints,
              surfaceHeight,
            })
            if (nextIndex == null) return
            if (nextIndex === 0) {
              setDrawerTab("directory")
              setSidebarMode("search")
            }
            setActiveSnapIndex(nextIndex)
          }}
          snapPoints={[...snapPoints]}
          shouldScaleBackground={false}
          onOpenChange={(open) => {
            if (!open) {
              resetDrawerToSearch()
              return
            }
            if (effectiveSidebarMode === "hidden") {
              setActiveSnapIndex(0)
              setSidebarMode("search")
            }
          }}
        >
          <DrawerContent
            data-public-map-drawer-mode={
              drawerIsFullscreen ? "fullscreen" : "floating"
            }
            data-public-map-drawer-snap-index={activeSnapIndex}
            overlayClassName="pointer-events-none bg-background/10 backdrop-blur-[1.5px]"
            showHandle={false}
            className={cn(
              PUBLIC_MAP_OVERLAY_GLASS_CLASSNAME,
              "pointer-events-auto h-full gap-0 overflow-hidden border p-0 shadow-sm",
              "data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:max-h-none data-[vaul-drawer-direction=bottom]:rounded-t-[28px]",
              "touch-pan-y overscroll-contain"
            )}
            style={{
              height: "100%",
              maxHeight: "100%",
            }}
          >
            <div className="flex justify-center px-4 pt-3 pb-2">
              <DrawerHandle
                className="bg-foreground/18 mt-0 block h-1.5 w-12 rounded-full"
                preventCycle={false}
              />
            </div>
            <DrawerHeader className="sr-only">
              <DrawerTitle>Resource map panel</DrawerTitle>
              <DrawerDescription>
                Search organizations and view public organization details.
              </DrawerDescription>
            </DrawerHeader>
            <div
              data-public-map-drawer-content-viewport=""
              className="flex min-h-0 flex-none flex-col overflow-hidden"
              style={{ height: drawerViewportHeight }}
            >
              {drawerPanel}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <aside
          className={cn(
            "pointer-events-none absolute top-0 bottom-0 left-0 z-20 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            effectiveSidebarMode === "hidden"
              ? "-translate-x-[calc(100%+1rem)] opacity-0"
              : "translate-x-0 opacity-100"
          )}
          style={{ width: `${Math.max(0, Math.round(sidebarWidth))}px` }}
        >
          {railPanel}
        </aside>
      )}
    </>
  )
}
