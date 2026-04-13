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
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarProvider,
} from "@/components/ui/sidebar"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

import type { SidebarMode } from "./constants"
import { PublicMapOrganizationDetail } from "./organization-detail"
import { PublicMapOrganizationList } from "./organization-list"
import { PublicMapSearchCard } from "./search-card"
import { buildPublicMapDrawerSnapPoints } from "./sidebar-snap-points"
import type { PublicMapPanelPresentation } from "./map-view-helpers"

export type PublicMapSidebarSearchContext = {
  title: string
  description?: string | null
  organizations: PublicMapOrganization[]
  onClear: () => void
}

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

function PublicMapSearchContextCard({
  context,
}: {
  context: PublicMapSidebarSearchContext
}) {
  return (
    <div className="mb-2 rounded-2xl border border-border/70 bg-background/82 px-3 py-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{context.title}</p>
          {context.description ? (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {context.description}
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 rounded-full px-3 text-xs"
          onClick={context.onClear}
        >
          Show all
        </Button>
      </div>
    </div>
  )
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
  const constrainedRailLayout = panelPresentation === "rail" && sidebarWidth < 352
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
          <SidebarContent className="h-full min-h-0 gap-2 overflow-hidden bg-background/38 pt-0 pb-2 pl-1 pr-2 dark:bg-black/28">
            <SidebarGroup className="px-0 pt-0 pb-0">
              <SidebarGroupContent>
                <PublicMapSearchCard
                  query={query}
                  onQueryChange={setQuery}
                  onHidePanel={() => setSidebarMode("hidden")}
                />
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup className="min-h-0 flex-1 overflow-hidden px-2 py-0">
              <SidebarGroupContent className="h-full min-h-0 pl-0">
                <ScrollArea className="h-full min-h-0">
                  <div className="pt-1 pb-1 pl-1 pr-3">
                    {searchContext ? (
                      <PublicMapSearchContextCard context={searchContext} />
                    ) : null}
                    <PublicMapOrganizationList
                      organizations={listOrganizations}
                      selectedOrgId={selectedOrganization?.id ?? null}
                      favorites={favorites}
                      query={query}
                      constrainedLayout={constrainedRailLayout}
                      onSelectOrg={() => undefined}
                      onToggleFavorite={toggleFavorite}
                      onOpenDetails={(organizationId) =>
                        onOpenDetails(organizationId, {
                          preserveSearchContext: Boolean(searchContext),
                        })
                      }
                    />
                  </div>
                </ScrollArea>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        ) : selectedOrganization ? (
          <SidebarContent className="h-full min-h-0 overflow-hidden bg-background/38 pt-0 pb-2 pl-0 pr-1 dark:bg-black/28">
            <SidebarGroup className="h-full min-h-0 px-1 py-0">
              <SidebarGroupContent className="h-full min-h-0 overflow-y-auto pl-0 pr-0 [scrollbar-width:thin]">
                <PublicMapOrganizationDetail
                  organization={selectedOrganization}
                  onBack={() => setSidebarMode("search")}
                  onHidePanel={() => setSidebarMode("hidden")}
                />
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        ) : null}
      </Sidebar>
    </SidebarProvider>
  )

  const drawerPanel =
    effectiveSidebarMode === "search" ? (
      <div className="flex min-h-0 flex-1 flex-col bg-transparent">
        <div className="shrink-0 px-2.5">
          <PublicMapSearchCard
            query={query}
            onQueryChange={setQuery}
            compact
          />
        </div>
        <div
          className={cn(
            "min-h-0 flex-1 px-2 pb-[max(env(safe-area-inset-bottom),0.75rem)]",
            drawerBodyScrollable
              ? "overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]"
              : "overflow-hidden",
          )}
        >
          <div className="pb-1 pt-2">
            {searchContext ? (
              <PublicMapSearchContextCard context={searchContext} />
            ) : null}
            <PublicMapOrganizationList
              organizations={listOrganizations}
              selectedOrgId={selectedOrganization?.id ?? null}
              favorites={favorites}
              query={query}
              onSelectOrg={() => undefined}
              onToggleFavorite={toggleFavorite}
              onOpenDetails={(organizationId) =>
                onOpenDetails(organizationId, {
                  preserveSearchContext: Boolean(searchContext),
                })
              }
            />
          </div>
        </div>
      </div>
    ) : selectedOrganization ? (
      <div
        className={cn(
          "min-h-0 flex-1 px-1 pb-[max(env(safe-area-inset-bottom),0.75rem)]",
          drawerBodyScrollable
            ? "overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]"
            : "overflow-hidden",
        )}
      >
        <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-200">
          <PublicMapOrganizationDetail
            organization={selectedOrganization}
            onBack={() => setSidebarMode("search")}
            onHidePanel={resetDrawerToSearch}
            compact
          />
        </div>
      </div>
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
