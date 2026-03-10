"use client"

import type { RefObject } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

import type { SidebarMode } from "./constants"
import { PublicMapAuthSheet } from "./auth-sheet"
import type { UserLocationFeedback } from "./user-location"
import { PublicMapSidebar } from "./sidebar"
import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

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
  onSelectOrg: (orgId: string) => void
  onSidebarModeChange: (mode: SidebarMode) => void
  onAuthSheetOpenChange: (nextOpen: boolean) => void
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
  onSelectOrg,
  onSidebarModeChange,
  onAuthSheetOpenChange,
}: PublicMapSurfaceProps) {
  return (
    <div className="relative h-full min-h-0 overflow-hidden bg-background">
      <PublicMapSidebar
        sidebarMode={sidebarMode}
        filteredOrganizations={filteredOrganizations}
        selectedOrganization={selectedOrganization}
        favorites={favorites}
        query={query}
        setQuery={onQueryChange}
        toggleFavorite={onToggleFavorite}
        setSelectedOrgId={onSelectOrg}
        setSidebarMode={onSidebarModeChange}
      />

      {!tokenAvailable ? (
        <div className="flex h-full min-h-[480px] items-center justify-center px-6">
          <Alert className="max-w-xl rounded-2xl border-border/70 bg-card/90">
            <AlertDescription>
              Map unavailable. Add `MAPBOX_TOKEN` or `NEXT_PUBLIC_MAPBOX_TOKEN` to enable the public organization map.
            </AlertDescription>
          </Alert>
        </div>
      ) : mapError ? (
        <div className="flex h-full min-h-[480px] items-center justify-center px-6">
          <Alert className="max-w-xl rounded-2xl border-destructive/30 bg-card/90">
            <AlertDescription>{mapError}</AlertDescription>
          </Alert>
        </div>
      ) : (
        <div className="relative h-full min-h-[520px]">
          <div
            ref={containerRef}
            className={cn(
              "absolute inset-y-0 right-0",
              sidebarMode === "hidden" ? "left-0" : "left-[min(390px,100%)]",
            )}
            aria-label="Public organization map"
          />

          <div className="pointer-events-none absolute right-4 top-4 z-20 flex max-w-[min(24rem,calc(100vw-2rem))] flex-col items-end gap-2">
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
