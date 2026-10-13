"use client"

import { useEffect, useState } from "react"
import type { PublicMapSurfaceProps } from "./map-surface"

export function hasPublicMapScreenLocation(item: {
  latitude: number | null
  longitude: number | null
  isOnlineOnly?: boolean | null
} | null) {
  return Boolean(item && !item.isOnlineOnly &&
    Number.isFinite(item.latitude) && Number.isFinite(item.longitude) &&
    item.latitude !== null && item.longitude !== null &&
    Math.abs(item.latitude) <= 90 && Math.abs(item.longitude) <= 180)
}

export function resolvePublicMapScreenMode({
  embedded, detailsOpen, hasLocation, collectionKey, mapKey,
}: {
  embedded: boolean
  detailsOpen: boolean
  hasLocation: boolean
  collectionKey: string | null
  mapKey: string | null
}): "map" | "collection" | "detail" {
  if (!embedded) return "map"
  if (detailsOpen) return hasLocation ? "map" : "detail"
  return collectionKey && collectionKey !== mapKey ? "collection" : "map"
}

export function usePublicMapEmbeddedScreen(surface: PublicMapSurfaceProps) {
  const [mapKey, setMapKey] = useState<string | null>(null)
  const collectionKey = surface.searchContext
    ? `context:${surface.searchContext.guideId ?? surface.searchContext.title}`
    : null
  useEffect(() => { setMapKey(null) }, [collectionKey])
  const selected = surface.selectedOrganization ?? surface.selectedResourceItem ?? null
  const detailsOpen = surface.sidebarMode === "details" && Boolean(selected)
  const mode = resolvePublicMapScreenMode({
    embedded: Boolean(surface.embedded), detailsOpen,
    hasLocation: hasPublicMapScreenLocation(selected), collectionKey, mapKey,
  })
  return {
    mode,
    collectionKey,
    detailsOpen,
    mapHidden: mode !== "map",
    showMap: () => setMapKey(collectionKey),
    showResults: () => setMapKey(null),
  }
}

export type PublicMapEmbeddedScreenState = ReturnType<typeof usePublicMapEmbeddedScreen>
