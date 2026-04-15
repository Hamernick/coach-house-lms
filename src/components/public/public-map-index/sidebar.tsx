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
import { cn } from "@/lib/utils"
import { Sidebar, SidebarProvider } from "@/components/ui/sidebar"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

import type { SidebarMode } from "./constants"
import { buildPublicMapDrawerSnapPoints } from "./sidebar-snap-points"
import type { PublicMapPanelPresentation } from "./map-view-helpers"
import {
  PublicMapDrawerDetailPanel,
  PublicMapDrawerSearchPanel,
  PublicMapRailDetailPanel,
  PublicMapRailSearchPanel,
  type PublicMapSidebarSearchContext,
} from "./sidebar-panels"

export type { PublicMapSidebarSearchContext } from "./sidebar-panels"

type PublicMapSidebarProps = {
  sidebarMode: SidebarMode
  sidebarWidth: number
  surfaceHeight: number
  panelPresentation: PublicMapPanelPresentation
  portalContainer: HTMLElement | null
  filteredOrganizations: PublicMapOrganization[]
  selectedOrganization: PublicMapOrganization | null
  favorites: string[]
  query: string
  searchContext?: PublicMapSidebarSearchContext | null
  setQuery: (value: string) => void
  toggleFavorite: (orgId: string) => void
  onOpenDetails: (orgId: string, options?: { preserveSearchContext?: boolean }) => void
  setSidebarMode: (mode: SidebarMode) => void
}

export function PublicMapSidebar({
  sidebarMode,
  sidebarWidth,
  surfaceHeight,
  panelPresentation,
  portalContainer,
  filteredOrganizations,
  selectedOrganization,
  favorites,
  query,
  searchContext = null,
  setQuery,
  toggleFavorite,
  onOpenDetails,
  setSidebarMode,
}: PublicMapSidebarProps) {
  const mapSidebarProviderStyle = {
    "--sidebar-width": "100%",
  } as CSSProperties
  const compact = panelPresentation === "drawer"
  const effectiveSidebarMode =
    compact && sidebarMode === "hidden" ? "search" : sidebarMode
  const panelOpen = compact ? true : effectiveSidebarMode !== "hidden"
  const constrainedRailLayout = panelPresentation === "rail" && sidebarWidth < 376
  const snapPoints = useMemo(
    () => buildPublicMapDrawerSnapPoints(surfaceHeight),
    [surfaceHeight],
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
  const listOrganizations = searchContext?.organizations ?? filteredOrganizations

  const railPanel = (
    <SidebarProvider
      defaultOpen
      className="h-full min-h-0 w-full bg-transparent"
      style={mapSidebarProviderStyle}
    >
      <Sidebar
        collapsible="none"
        className="pointer-events-auto h-full w-full overflow-hidden border-r border-white/30 bg-background/40 shadow-[0_20px_45px_-28px_hsl(var(--foreground)/0.6)] backdrop-blur-2xl supports-[backdrop-filter]:bg-background/34 dark:bg-black/28"
      >
        {effectiveSidebarMode === "search" ? (
          <PublicMapRailSearchPanel
            query={query}
            searchContext={searchContext}
            organizations={listOrganizations}
            selectedOrgId={selectedOrganization?.id ?? null}
            favorites={favorites}
            constrainedLayout={constrainedRailLayout}
            onQueryChange={setQuery}
            onHidePanel={() => setSidebarMode("hidden")}
            onToggleFavorite={toggleFavorite}
            onOpenDetails={(organizationId) =>
              onOpenDetails(organizationId, {
                preserveSearchContext: Boolean(searchContext),
              })
            }
          />
        ) : selectedOrganization ? (
          <PublicMapRailDetailPanel
            organization={selectedOrganization}
            onBack={() => setSidebarMode("search")}
            onHidePanel={() => setSidebarMode("hidden")}
          />
        ) : null}
      </Sidebar>
    </SidebarProvider>
  )

  const drawerPanel =
    effectiveSidebarMode === "search" ? (
      <PublicMapDrawerSearchPanel
        query={query}
        searchContext={searchContext}
        organizations={listOrganizations}
        selectedOrgId={selectedOrganization?.id ?? null}
        favorites={favorites}
        drawerBodyScrollable={drawerBodyScrollable}
        onQueryChange={setQuery}
        onToggleFavorite={toggleFavorite}
        onOpenDetails={(organizationId) =>
          onOpenDetails(organizationId, {
            preserveSearchContext: Boolean(searchContext),
          })
        }
      />
    ) : selectedOrganization ? (
      <PublicMapDrawerDetailPanel
        organization={selectedOrganization}
        drawerBodyScrollable={drawerBodyScrollable}
        onBack={() => setSidebarMode("search")}
        onHidePanel={resetDrawerToSearch}
      />
    ) : null

  return (
    <>
      <div
        className={cn(
          "absolute left-4 top-4 z-20 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          effectiveSidebarMode === "hidden"
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none -translate-x-1 opacity-0",
        )}
      >
        <Button
          type="button"
          variant="ghost"
          onClick={() => setSidebarMode("search")}
          className="h-10 rounded-full border border-white/35 bg-background/60 px-3 text-foreground shadow-sm backdrop-blur-xl hover:bg-background/75"
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
            const nextIndex = snapPoints.findIndex((snapPoint) => snapPoint === nextSnapPoint)
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
              "pointer-events-auto h-full gap-0 overflow-hidden p-0 text-foreground shadow-[0_-32px_72px_-34px_hsl(var(--foreground)/0.46)]",
              "rounded-t-[2.15rem] bg-background supports-[backdrop-filter]:bg-background/98 dark:bg-background dark:supports-[backdrop-filter]:bg-background/96",
              "data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:max-h-none data-[vaul-drawer-direction=bottom]:border-0",
              "overscroll-contain touch-pan-y",
            )}
            style={{
              height: `${Math.max(0, Math.round(surfaceHeight))}px`,
              maxHeight: `${Math.max(0, Math.round(surfaceHeight))}px`,
            }}
          >
            <div className="flex justify-center px-4 pb-2 pt-3">
              <DrawerHandle
                className="mt-0 block h-1.5 w-12 rounded-full bg-foreground/18"
                preventCycle={false}
              />
            </div>
            <DrawerHeader className="sr-only">
              <DrawerTitle>Resource map panel</DrawerTitle>
              <DrawerDescription>Search organizations and view public organization details.</DrawerDescription>
            </DrawerHeader>
            <div className="flex min-h-0 flex-1 flex-col">
              {drawerPanel}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <aside
          className={cn(
            "pointer-events-none absolute bottom-0 left-0 top-0 z-20 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            effectiveSidebarMode === "hidden"
              ? "-translate-x-[calc(100%+1rem)] opacity-0"
              : "translate-x-0 opacity-100",
          )}
          style={{ width: `${Math.max(0, Math.round(sidebarWidth))}px` }}
        >
          {railPanel}
        </aside>
      )}
    </>
  )
}
