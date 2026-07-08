"use client"

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

import type { SidebarMode } from "./constants"
import { PublicMapAuthSheet } from "./auth-sheet"
import { resolvePublicMapSurfacePanelState } from "./map-surface-helpers"
import type { UserLocationFeedback } from "./user-location"
import { PublicMapSidebar } from "./sidebar"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"
import type { PublicMapSidebarSearchContext } from "./sidebar"
import type { PublicMapPanelPresentation } from "./map-view-helpers"
import type { PublicMapListItem } from "./map-items-state"
import type { ExternalResourceMapItem } from "@/lib/public-map/resource-map-items"
import type { PublicMapOrganizationCurationAction } from "./organization-detail-admin-actions"
import type { PublicMapResourceCurationAction } from "./resource-detail-admin-actions"
import type {
  PublicMapGroupFilterCounts,
  PublicMapGroupFilterKey,
} from "./category-filter"

type PublicMapSurfaceProps = {
  containerRef: RefObject<HTMLDivElement | null>
  sidebarMode: SidebarMode
  filteredItems: PublicMapListItem[]
  filteredOrganizations: PublicMapOrganization[]
  selectedItemId: string | null
  selectedOrganization: PublicMapOrganization | null
  selectedResourceItem: ExternalResourceMapItem | null
  canManageResourceMap?: boolean
  organizationCurationAction?: PublicMapOrganizationCurationAction
  resourceMapCurationAction?: PublicMapResourceCurationAction
  favorites: string[]
  query: string
  activeGroup: PublicMapGroupFilterKey
  groupCounts: PublicMapGroupFilterCounts
  tokenAvailable: boolean
  mapError: string | null
  locationFeedback: UserLocationFeedback
  preferencesSaveError: string | null
  isSavingPreferences: boolean
  authSheetOpen: boolean
  authRedirectTo: string
  onQueryChange: (value: string) => void
  onActiveGroupChange: (group: PublicMapGroupFilterKey) => void
  onToggleFavorite: (orgId: string) => void
  onSelectItem: (itemId: string) => void
  onOpenOrgDetails: (
    orgId: string,
    options?: { preserveSearchContext?: boolean }
  ) => void
  onBackToSearch: () => void
  onSidebarModeChange: (mode: SidebarMode) => void
  onAuthSheetOpenChange: (nextOpen: boolean) => void
  onSidebarInsetChange?: (value: number) => void
  searchContext?: PublicMapSidebarSearchContext | null
  mapOverlay?: ReactNode
  renderDesktopSidebar?: boolean
  onPanelPresentationChange?: (
    presentation: PublicMapPanelPresentation | null
  ) => void
}

export function PublicMapSurface({
  containerRef,
  sidebarMode,
  filteredItems,
  filteredOrganizations,
  selectedItemId,
  selectedOrganization,
  selectedResourceItem,
  canManageResourceMap = false,
  organizationCurationAction,
  resourceMapCurationAction,
  favorites,
  query,
  activeGroup,
  groupCounts,
  tokenAvailable,
  mapError,
  locationFeedback,
  preferencesSaveError,
  isSavingPreferences,
  authSheetOpen,
  authRedirectTo,
  onQueryChange,
  onActiveGroupChange,
  onToggleFavorite,
  onSelectItem,
  onOpenOrgDetails,
  onBackToSearch,
  onSidebarModeChange,
  onAuthSheetOpenChange,
  onSidebarInsetChange,
  searchContext = null,
  mapOverlay = null,
  renderDesktopSidebar = true,
  onPanelPresentationChange,
}: PublicMapSurfaceProps) {
  const surfaceRef = useRef<HTMLDivElement | null>(null)
  const [panelPortalContainer, setPanelPortalContainer] =
    useState<HTMLDivElement | null>(null)
  const [surfaceWidth, setSurfaceWidth] = useState(0)
  const [surfaceHeight, setSurfaceHeight] = useState(0)

  useLayoutEffect(() => {
    const element = surfaceRef.current
    if (!element) return

    const updateSize = () => {
      setSurfaceWidth(element.clientWidth)
      setSurfaceHeight(element.clientHeight)
    }
    updateSize()

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateSize)
      return () => window.removeEventListener("resize", updateSize)
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      setSurfaceWidth(entry.contentRect.width)
      setSurfaceHeight(entry.contentRect.height)
    })

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const { panelPresentation, panelReady, sidebarWidth } = useMemo(
    () =>
      resolvePublicMapSurfacePanelState({
        surfaceWidth,
        surfaceHeight,
        sidebarMode,
        portalContainerReady: panelPortalContainer !== null,
      }),
    [panelPortalContainer, sidebarMode, surfaceHeight, surfaceWidth]
  )

  const sidebarInset =
    panelPresentation === "rail" && renderDesktopSidebar ? sidebarWidth : 0

  useEffect(() => {
    onSidebarInsetChange?.(sidebarInset)
  }, [onSidebarInsetChange, sidebarInset])

  useLayoutEffect(() => {
    onPanelPresentationChange?.(panelReady ? panelPresentation : null)
  }, [onPanelPresentationChange, panelPresentation, panelReady])

  return (
    <div
      ref={surfaceRef}
      className="bg-background relative h-full min-h-0 w-full min-w-0 flex-1 overflow-hidden"
    >
      <div
        ref={setPanelPortalContainer}
        className="pointer-events-none absolute inset-0 z-30 transform-gpu overflow-hidden"
      />
      {panelReady &&
      panelPresentation &&
      (panelPresentation === "drawer" || renderDesktopSidebar) ? (
        <PublicMapSidebar
          sidebarMode={sidebarMode}
          sidebarWidth={sidebarWidth}
          surfaceHeight={surfaceHeight}
          panelPresentation={panelPresentation}
          portalContainer={panelPortalContainer}
          filteredItems={filteredItems}
          filteredOrganizations={filteredOrganizations}
          selectedItemId={selectedItemId}
          selectedOrganization={selectedOrganization}
          selectedResourceItem={selectedResourceItem}
          canManageResourceMap={canManageResourceMap}
          organizationCurationAction={organizationCurationAction}
          resourceMapCurationAction={resourceMapCurationAction}
          favorites={favorites}
          query={query}
          activeGroup={activeGroup}
          groupCounts={groupCounts}
          searchContext={searchContext}
          setQuery={onQueryChange}
          setActiveGroup={onActiveGroupChange}
          toggleFavorite={onToggleFavorite}
          onSelectItem={onSelectItem}
          onOpenDetails={onOpenOrgDetails}
          onBackToSearch={onBackToSearch}
          setSidebarMode={onSidebarModeChange}
        />
      ) : null}

      {!tokenAvailable ? (
        <div className="flex h-full min-h-[480px] items-center justify-center px-6">
          <Alert className="border-border/70 bg-card/90 max-w-xl rounded-2xl">
            <AlertDescription>
              Map unavailable. Add `MAPBOX_TOKEN` or `NEXT_PUBLIC_MAPBOX_TOKEN`
              to enable the public organization map.
            </AlertDescription>
          </Alert>
        </div>
      ) : (
        <div className="relative h-full min-h-[520px]">
          <div className="absolute inset-0">
            <div
              ref={containerRef}
              className="h-full w-full"
              aria-label="Public organization map"
            />
          </div>
          <div className="pointer-events-none absolute inset-0 hidden dark:block dark:bg-[linear-gradient(180deg,rgba(250,250,250,0.08),rgba(250,250,250,0.025)_28%,rgba(24,24,27,0.015)_58%,rgba(9,9,11,0.06))]" />
          {mapOverlay}

          <div className="pointer-events-none absolute top-4 right-4 z-20 flex max-w-[min(24rem,calc(100vw-2rem))] flex-col items-end gap-2">
            {mapError ? (
              <Alert className="border-destructive/30 bg-background/92 pointer-events-auto rounded-2xl text-xs shadow-sm backdrop-blur">
                <AlertDescription>{mapError}</AlertDescription>
              </Alert>
            ) : null}
            {locationFeedback ? (
              <Alert
                className={cn(
                  "bg-background/92 pointer-events-auto w-fit rounded-full border px-3 py-1.5 text-xs shadow-sm backdrop-blur",
                  locationFeedback.tone === "error"
                    ? "border-destructive/30 text-destructive"
                    : "border-border/70 text-foreground"
                )}
              >
                <AlertDescription className="text-xs">
                  {locationFeedback.message}
                </AlertDescription>
              </Alert>
            ) : null}
            {preferencesSaveError ? (
              <Alert className="border-destructive/30 bg-background/92 pointer-events-auto rounded-2xl text-xs shadow-sm backdrop-blur">
                <AlertDescription>{preferencesSaveError}</AlertDescription>
              </Alert>
            ) : null}
            {isSavingPreferences ? (
              <Alert className="border-border/70 bg-background/92 pointer-events-auto rounded-full px-3 py-1.5 text-xs shadow-sm backdrop-blur">
                <AlertDescription>Saving map activity…</AlertDescription>
              </Alert>
            ) : null}
          </div>
        </div>
      )}

      <PublicMapAuthSheet
        open={authSheetOpen}
        onOpenChange={onAuthSheetOpenChange}
        redirectTo={authRedirectTo}
      />
    </div>
  )
}
