"use client"

import { useEffect, useRef, type RefObject } from "react"
import ListIcon from "lucide-react/dist/esm/icons/list"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { PublicMapEmbeddedDetailsDrawer } from "./embedded-details-drawer"
import { PublicMapEmbeddedScreenCollection } from "./embedded-screen-collection"
import type { PublicMapEmbeddedScreenState } from "./embedded-screen-state"
import type { PublicMapSurfaceProps } from "./map-surface"
import { PublicMapDrawerDetailPanel, PublicMapResourceDrawerDetailPanel } from "./sidebar-detail-panels"

export function PublicMapEmbeddedScreenLayer({ surface, screen, surfaceRef, surfaceHeight, portalContainer }: {
  surface: PublicMapSurfaceProps
  screen: PublicMapEmbeddedScreenState
  surfaceRef: RefObject<HTMLDivElement | null>
  surfaceHeight: number
  portalContainer: HTMLElement | null
}) {
  const contentRef = useRef<HTMLElement>(null)
  const contentKey = screen.mode === "detail"
    ? `detail:${surface.selectedOrganization?.id ?? surface.selectedResourceItem?.id}`
    : screen.mode === "collection" ? screen.collectionKey : null

  useEffect(() => {
    if (!contentKey) return
    const returnTarget = document.activeElement instanceof HTMLElement ? document.activeElement : null
    contentRef.current?.focus({ preventScroll: true })
    surfaceRef.current?.scrollIntoView({
      block: "nearest",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    })
    return () => {
      if (returnTarget?.isConnected && !returnTarget.closest("[inert]")) returnTarget.focus({ preventScroll: true })
    }
  }, [contentKey, surfaceRef])

  return <>
    <PublicMapEmbeddedDetailsDrawer
      surfaceHeight={surfaceHeight}
      portalContainer={portalContainer}
      open={screen.detailsOpen && !screen.mapHidden}
      selectedOrganization={surface.selectedOrganization}
      selectedResourceItem={surface.selectedResourceItem}
      canManageResourceMap={surface.canManageResourceMap}
      organizationCurationAction={surface.organizationCurationAction}
      resourceMapCurationAction={surface.resourceMapCurationAction}
      favorites={surface.favorites}
      collectedResourceIds={surface.collectedResourceIds}
      toggleFavorite={surface.onToggleFavorite}
      toggleCollectedResource={surface.onToggleCollectedResource}
      onBackToSearch={surface.onBackToSearch}
    />
    <section
      ref={contentRef}
      data-public-map-screen-content={screen.mode}
      data-lenis-prevent=""
      aria-label={screen.mode === "detail" ? "Resource details" : "Selected resources"}
      aria-hidden={!screen.mapHidden}
      inert={!screen.mapHidden}
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return
        event.stopPropagation()
        if (screen.mode === "detail") surface.onBackToSearch()
        else screen.showMap()
      }}
      className={cn(
        "bg-background absolute inset-0 z-40 overflow-hidden rounded-[inherit] transition-[opacity,visibility] duration-200 ease-out motion-reduce:transition-none focus-visible:outline-none",
        screen.mapHidden ? "pointer-events-auto visible opacity-100" : "pointer-events-none invisible opacity-0"
      )}
    >
      {screen.mode === "detail" ? (
        <div className="mx-auto h-full min-h-0 w-full max-w-xl py-3">
          {surface.selectedOrganization ? (
            <PublicMapDrawerDetailPanel
              organization={surface.selectedOrganization}
              favorites={surface.favorites}
              onBack={surface.onBackToSearch}
              onToggleFavorite={surface.onToggleFavorite}
              canManageResourceMap={surface.canManageResourceMap}
              organizationCurationAction={surface.organizationCurationAction}
            />
          ) : surface.selectedResourceItem ? (
            <PublicMapResourceDrawerDetailPanel
              item={surface.selectedResourceItem}
              collected={surface.collectedResourceIds?.includes(surface.selectedResourceItem.id)}
              onBack={surface.onBackToSearch}
              onToggleCollected={surface.onToggleCollectedResource}
              canManageResourceMap={surface.canManageResourceMap}
              resourceMapCurationAction={surface.resourceMapCurationAction}
            />
          ) : null}
        </div>
      ) : screen.collectionKey ? <PublicMapEmbeddedScreenCollection surface={surface} onShowMap={screen.showMap} /> : null}
    </section>
    {screen.collectionKey && !screen.mapHidden && !screen.detailsOpen ? (
      <Button variant="secondary" size="sm" onClick={screen.showResults} className="pointer-events-auto absolute top-3 right-3 z-30 h-11 rounded-full px-3 shadow-sm sm:h-9">
        <ListIcon aria-hidden /> Results
      </Button>
    ) : null}
  </>
}
