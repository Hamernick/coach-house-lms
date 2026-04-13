"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

import type { SidebarMode } from "./constants"
import { PublicMapAuthSheet } from "./auth-sheet"
import { resolvePublicMapSurfacePanelState } from "./map-surface-helpers"
import type { UserLocationFeedback } from "./user-location"
import { PublicMapSidebar } from "./sidebar"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"
import type { PublicMapSidebarSearchContext } from "./sidebar"

type PublicMapSurfaceProps = {
  containerRef: RefObject<HTMLDivElement | null>
  sidebarMode: SidebarMode
  filteredOrganizations: PublicMapOrganization[]
  selectedOrganization: PublicMapOrganization | null
  favorites: string[]
  query: string
  tokenAvailable: boolean
  mapError: string | null
  locationFeedback: UserLocationFeedback
  preferencesSaveError: string | null
  isSavingPreferences: boolean
  authSheetOpen: boolean
  authRedirectTo: string
  onQueryChange: (value: string) => void
  onToggleFavorite: (orgId: string) => void
  onOpenOrgDetails: (orgId: string, options?: { preserveSearchContext?: boolean }) => void
  onSidebarModeChange: (mode: SidebarMode) => void
  onAuthSheetOpenChange: (nextOpen: boolean) => void
  onSidebarInsetChange?: (value: number) => void
  searchContext?: PublicMapSidebarSearchContext | null
  mapOverlay?: ReactNode
}

export function PublicMapSurface({
  containerRef,
  sidebarMode,
  filteredOrganizations,
  selectedOrganization,
  favorites,
  query,
  tokenAvailable,
  mapError,
  locationFeedback,
  preferencesSaveError,
  isSavingPreferences,
  authSheetOpen,
  authRedirectTo,
  onQueryChange,
  onToggleFavorite,
  onOpenOrgDetails,
  onSidebarModeChange,
  onAuthSheetOpenChange,
  onSidebarInsetChange,
  searchContext = null,
  mapOverlay = null,
}: PublicMapSurfaceProps) {
  const surfaceRef = useRef<HTMLDivElement | null>(null)
  const [panelPortalContainer, setPanelPortalContainer] = useState<HTMLDivElement | null>(null)
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
    [panelPortalContainer, sidebarMode, surfaceHeight, surfaceWidth],
  )

  useEffect(() => {
    onSidebarInsetChange?.(sidebarWidth)
  }, [onSidebarInsetChange, sidebarWidth])

  return (
    <div ref={surfaceRef} className="relative h-full min-h-0 overflow-hidden bg-background">
      <div
        ref={setPanelPortalContainer}
        className="pointer-events-none absolute inset-0 z-30 overflow-hidden transform-gpu"
      />
      {panelReady && panelPresentation ? (
        <PublicMapSidebar
          sidebarMode={sidebarMode}
          sidebarWidth={sidebarWidth}
          surfaceHeight={surfaceHeight}
          panelPresentation={panelPresentation}
          portalContainer={panelPortalContainer}
          filteredOrganizations={filteredOrganizations}
          selectedOrganization={selectedOrganization}
          favorites={favorites}
          query={query}
          searchContext={searchContext}
          setQuery={onQueryChange}
          toggleFavorite={onToggleFavorite}
          onOpenDetails={onOpenOrgDetails}
          setSidebarMode={onSidebarModeChange}
        />
      ) : null}

      {!tokenAvailable ? (
        <div className="flex h-full min-h-[480px] items-center justify-center px-6">
          <Alert className="max-w-xl rounded-2xl border-border/70 bg-card/90">
            <AlertDescription>
              Map unavailable. Add `MAPBOX_TOKEN` or `NEXT_PUBLIC_MAPBOX_TOKEN` to enable the public organization map.
            </AlertDescription>
          </Alert>
        </div>
      ) : (
        <div className="relative h-full min-h-[520px]">
          <div className="absolute inset-0">
            <div
              ref={containerRef}
              className="h-full w-full saturate-[0.82] brightness-[1.03] contrast-[0.94]"
              aria-label="Public organization map"
            />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(248,250,252,0.22),rgba(248,250,252,0.1)_28%,rgba(241,245,249,0.08)_58%,rgba(248,250,252,0.18))]" />
          {mapOverlay}

          <div className="pointer-events-none absolute right-4 top-4 z-20 flex max-w-[min(24rem,calc(100vw-2rem))] flex-col items-end gap-2">
            {mapError ? (
              <Alert className="pointer-events-auto rounded-2xl border-destructive/30 bg-background/92 text-xs shadow-sm backdrop-blur">
                <AlertDescription>{mapError}</AlertDescription>
              </Alert>
            ) : null}
            {locationFeedback ? (
              <Alert
                className={cn(
                  "pointer-events-auto w-fit rounded-full border bg-background/92 px-3 py-1.5 text-xs shadow-sm backdrop-blur",
                  locationFeedback.tone === "error"
                    ? "border-destructive/30 text-destructive"
                    : "border-border/70 text-foreground",
                )}
              >
                <AlertDescription className="text-xs">
                  {locationFeedback.message}
                </AlertDescription>
              </Alert>
            ) : null}
            {preferencesSaveError ? (
              <Alert className="pointer-events-auto rounded-2xl border-destructive/30 bg-background/92 text-xs shadow-sm backdrop-blur">
                <AlertDescription>{preferencesSaveError}</AlertDescription>
              </Alert>
            ) : null}
            {isSavingPreferences ? (
              <Alert className="pointer-events-auto rounded-full border-border/70 bg-background/92 px-3 py-1.5 text-xs shadow-sm backdrop-blur">
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
