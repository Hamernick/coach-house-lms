import type { RefObject } from "react"
import type mapboxgl from "mapbox-gl"

import { PUBLIC_MAP_ORGANIZATION_SOURCE_ID } from "./map-view-helpers"
import {
  resolveClusterClickTarget,
} from "./public-map-cluster-runtime"
import { getMapSourceSafely, isMapStyleAccessError } from "./map-style-guards"

const CLUSTER_CLICK_FALLBACK_ZOOM_DELTA = 1.2
const CLUSTER_CLICK_MIN_VISIBLE_ZOOM_DELTA = 0.65
const CLUSTER_CLICK_MAX_ZOOM = 15.5

function resolveVisibleClusterZoomTarget({
  map,
  requestedZoom,
}: {
  map: mapboxgl.Map
  requestedZoom: number
}) {
  const liveZoom = map.getZoom()
  const normalized = Number.isFinite(requestedZoom) ? requestedZoom : liveZoom
  const minVisible = liveZoom + CLUSTER_CLICK_MIN_VISIBLE_ZOOM_DELTA
  return Math.min(CLUSTER_CLICK_MAX_ZOOM, Math.max(minVisible, normalized))
}

function animateToClusterTarget({
  map,
  targetCoordinates,
  targetClusterId,
  zoom,
  duration,
  reason,
}: {
  map: mapboxgl.Map
  targetCoordinates: [number, number]
  targetClusterId: number
  zoom: number
  duration: number
  reason: string
}) {
  const nextZoom = resolveVisibleClusterZoomTarget({
    map,
    requestedZoom: zoom,
  })
  map.easeTo({
    center: targetCoordinates,
    zoom: nextZoom,
    duration,
    essential: true,
  })
  if (process.env.NODE_ENV !== "production") {
    console.debug("[public-map] cluster click camera transition", {
      clusterId: targetClusterId,
      reason,
      nextZoom,
    })
  }
}

export function executeClusterSelection({
  clusterId,
  coordinates,
  mapRef,
  mapLoadedRef,
}: {
  clusterId: number
  coordinates: [number, number]
  mapRef: RefObject<mapboxgl.Map | null>
  mapLoadedRef: RefObject<boolean>
}) {
  const clickMap = mapRef.current
  if (!clickMap || !mapLoadedRef.current) return
  const target = resolveClusterClickTarget({
    map: clickMap,
    clusterId,
    fallbackCoordinates: coordinates,
  })
  const source = getMapSourceSafely<mapboxgl.GeoJSONSource>(
    clickMap,
    PUBLIC_MAP_ORGANIZATION_SOURCE_ID,
  )
  if (isMapStyleAccessError(source)) return
  const fallbackZoomTarget = Math.min(
    clickMap.getZoom() + CLUSTER_CLICK_FALLBACK_ZOOM_DELTA,
    CLUSTER_CLICK_MAX_ZOOM,
  )

  if (!source || typeof source.getClusterExpansionZoom !== "function") {
    animateToClusterTarget({
      map: clickMap,
      targetCoordinates: target.coordinates,
      targetClusterId: target.clusterId,
      zoom: fallbackZoomTarget,
      duration: 420,
      reason: "fallback:no-expansion-source",
    })
    return
  }

  source.getClusterExpansionZoom(target.clusterId, (error, zoom) => {
    const callbackMap = mapRef.current
    if (!callbackMap || !mapLoadedRef.current) return
    const expansionZoom = typeof zoom === "number" && Number.isFinite(zoom) ? zoom : null
    const requestedZoom =
      error || expansionZoom === null ? fallbackZoomTarget : expansionZoom + 0.35
    animateToClusterTarget({
      map: callbackMap,
      targetCoordinates: target.coordinates,
      targetClusterId: target.clusterId,
      zoom: requestedZoom,
      duration: error || expansionZoom === null ? 420 : 460,
      reason: error || expansionZoom === null ? "fallback:expansion-error" : "expansion",
    })
  })
}
