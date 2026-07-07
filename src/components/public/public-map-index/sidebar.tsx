"use client"

import { useEffect, useMemo, useState, type CSSProperties } from "react"
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
import { Sidebar, SidebarProvider } from "@/components/ui/sidebar"
import type { ExternalResourceMapItem } from "@/lib/public-map/resource-map-items"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"
import { cn } from "@/lib/utils"

import type {
  PublicMapGroupFilterCounts,
  PublicMapGroupFilterKey,
} from "./category-filter"
import type { SidebarMode } from "./constants"
import { PublicMapLiquidGlassShell } from "./liquid-glass-shell"
import { buildPublicMapDrawerSnapPoints } from "./sidebar-snap-points"
import type { PublicMapPanelPresentation } from "./map-view-helpers"
import {
  PublicMapDrawerDetailPanel,
  PublicMapDrawerSearchPanel,
  PublicMapRailDetailPanel,
  PublicMapRailSearchPanel,
  PublicMapResourceDrawerDetailPanel,
  PublicMapResourceRailDetailPanel,
  type PublicMapSidebarSearchContext,
} from "./sidebar-panels"
import type { PublicMapListItem } from "./map-items-state"
import type { PublicMapOrganizationCurationAction } from "./organization-detail-admin-actions"
import type { PublicMapResourceCurationAction } from "./resource-detail-admin-actions"
import {
  PUBLIC_MAP_SIDEBAR_ACTION_SURFACE_CLASSNAME,
  PUBLIC_MAP_SIDEBAR_RAIL_CLASSNAME,
} from "./sidebar-theme"

export type { PublicMapSidebarSearchContext } from "./sidebar-panels"

type OpenDetailsOptions = { preserveSearchContext?: boolean }
type OpenDetails = (orgId: string, options?: OpenDetailsOptions) => void

type PublicMapSidebarProps = {
  sidebarMode: SidebarMode
  sidebarWidth: number
  surfaceHeight: number
  panelPresentation: PublicMapPanelPresentation
  portalContainer: HTMLElement | null
  filteredItems: PublicMapListItem[]
  filteredOrganizations: PublicMapOrganization[]
  selectedItemId: string | null
  selectedOrganization: PublicMapOrganization | null
  selectedResourceItem?: ExternalResourceMapItem | null
  canManageResourceMap?: boolean
  organizationCurationAction?: PublicMapOrganizationCurationAction
  resourceMapCurationAction?: PublicMapResourceCurationAction
  favorites: string[]
  query: string
  activeGroup: PublicMapGroupFilterKey
  groupCounts: PublicMapGroupFilterCounts
  searchContext?: PublicMapSidebarSearchContext | null
  setQuery: (value: string) => void
  setActiveGroup: (group: PublicMapGroupFilterKey) => void
  toggleFavorite: (orgId: string) => void
  onSelectItem: (itemId: string) => void
  onOpenDetails: OpenDetails
  onBackToSearch: () => void
  setSidebarMode: (mode: SidebarMode) => void
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
  query,
  activeGroup,
  groupCounts,
  searchContext = null,
  setQuery,
  setActiveGroup,
  toggleFavorite,
  onSelectItem,
  onOpenDetails,
  onBackToSearch,
  setSidebarMode,
}: PublicMapSidebarProps) {
  const mapSidebarProviderStyle = { "--sidebar-width": "100%" } as CSSProperties
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
  const [activeSnapIndex, setActiveSnapIndex] = useState<0 | 1 | 2>(0)
  const activeSnapPoint = snapPoints[activeSnapIndex]
  const drawerBodyScrollable = activeSnapIndex === 2

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
    setSidebarMode("search")
  }
  const listItems = searchContext?.items ?? filteredItems

  const railPanel = (
    <SidebarProvider
      defaultOpen
      className="h-full min-h-0 w-full bg-transparent"
      style={mapSidebarProviderStyle}
    >
      <PublicMapLiquidGlassShell
        className={cn(
          "pointer-events-auto h-full w-full",
          PUBLIC_MAP_SIDEBAR_RAIL_CLASSNAME
        )}
      >
        <Sidebar
          collapsible="none"
          className="text-sidebar-foreground h-full w-full overflow-hidden bg-transparent"
        >
          {effectiveSidebarMode === "search" ? (
            <PublicMapRailSearchPanel
              query={query}
              searchContext={searchContext}
              favorites={favorites}
              items={listItems}
              organizations={filteredOrganizations}
              selectedItemId={selectedItemId}
              selectedOrgId={selectedOrganization?.id ?? null}
              constrainedLayout={constrainedRailLayout}
              activeGroup={activeGroup}
              groupCounts={groupCounts}
              onQueryChange={setQuery}
              onActiveGroupChange={setActiveGroup}
              onHidePanel={() => setSidebarMode("hidden")}
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
              item={selectedResourceItem}
              onBack={onBackToSearch}
              resourceMapCurationAction={resourceMapCurationAction}
            />
          ) : null}
        </Sidebar>
      </PublicMapLiquidGlassShell>
    </SidebarProvider>
  )

  const drawerPanel =
    effectiveSidebarMode === "search" ? (
      <PublicMapDrawerSearchPanel
        query={query}
        searchContext={searchContext}
        favorites={favorites}
        items={listItems}
        organizations={filteredOrganizations}
        selectedItemId={selectedItemId}
        selectedOrgId={selectedOrganization?.id ?? null}
        drawerBodyScrollable={drawerBodyScrollable}
        activeGroup={activeGroup}
        groupCounts={groupCounts}
        onQueryChange={setQuery}
        onActiveGroupChange={setActiveGroup}
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
        drawerBodyScrollable={drawerBodyScrollable}
        onBack={onBackToSearch}
        onToggleFavorite={toggleFavorite}
      />
    ) : selectedResourceItem ? (
      <PublicMapResourceDrawerDetailPanel
        canManageResourceMap={canManageResourceMap}
        item={selectedResourceItem}
        drawerBodyScrollable={drawerBodyScrollable}
        onBack={onBackToSearch}
        resourceMapCurationAction={resourceMapCurationAction}
      />
    ) : null

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
          fadeFromIndex={2}
          modal={false}
          noBodyStyles
          open={panelOpen}
          snapToSequentialPoint
          setActiveSnapPoint={(nextSnapPoint) => {
            if (nextSnapPoint == null) return
            const nextIndex = snapPoints.findIndex(
              (snapPoint) => snapPoint === nextSnapPoint
            )
            if (nextIndex < 0) return
            setActiveSnapIndex(nextIndex as 0 | 1 | 2)
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
            overlayClassName="pointer-events-none bg-background/10 backdrop-blur-[1.5px]"
            showHandle={false}
            className={cn(
              "text-foreground pointer-events-auto h-full gap-0 overflow-hidden p-0 shadow-[0_-32px_72px_-34px_hsl(var(--foreground)/0.46)]",
              "bg-background supports-[backdrop-filter]:bg-background/98 dark:bg-background dark:supports-[backdrop-filter]:bg-background/96 rounded-t-[2.15rem]",
              "data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:max-h-none data-[vaul-drawer-direction=bottom]:border-0",
              "touch-pan-y overscroll-contain"
            )}
            style={{
              height: `${Math.max(0, Math.round(surfaceHeight))}px`,
              maxHeight: `${Math.max(0, Math.round(surfaceHeight))}px`,
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
            <div className="flex min-h-0 flex-1 flex-col">{drawerPanel}</div>
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
