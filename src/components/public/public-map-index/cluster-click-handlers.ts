import type { RefObject } from "react"
import type mapboxgl from "mapbox-gl"

import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

import { PUBLIC_MAP_ORGANIZATION_SOURCE_ID } from "./map-view-helpers"
import {
  clearSpiderfyOverlay,
  openSpiderfyOverlay,
  resolveSpiderfyCandidateBuckets,
  type SpiderfyOverlayState,
} from "./overlap-expansion"
import { fetchAllClusterLeaves } from "./cluster-leaf-helpers"
import { resolveFeatureCoordinates } from "./map-coordinate-normalization"
import {
  resolveClusterClickTarget,
  resolveOrganizationId,
} from "./public-map-cluster-runtime"
import { getMapSourceSafely, isMapStyleAccessError } from "./map-style-guards"

type MapboxApi = typeof import("mapbox-gl")["default"]

const CLUSTER_CLICK_FALLBACK_ZOOM_DELTA = 1.2
const CLUSTER_CLICK_MIN_VISIBLE_ZOOM_DELTA = 0.65
const CLUSTER_CLICK_MAX_ZOOM = 15.5
const CLUSTER_LEAF_FETCH_TIMEOUT_MS = 1800

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

async function fetchClusterLeavesWithTimeout({
  source,
  clusterId,
  pointCount,
}: {
  source: mapboxgl.GeoJSONSource
  clusterId: number
  pointCount: number
}) {
  const timeoutPromise = new Promise<mapboxgl.MapboxGeoJSONFeature[]>((resolve) => {
    window.setTimeout(() => {
      resolve([])
    }, CLUSTER_LEAF_FETCH_TIMEOUT_MS)
  })
  return Promise.race([
    fetchAllClusterLeaves({
      source,
      clusterId,
      pointCount,
    }),
    timeoutPromise,
  ])
}

function runClusterSpiderfyOverlayFlow({
  source,
  target,
  pointCount,
  clickRequestId,
  mapRef,
  mapboxRef,
  mapLoadedRef,
  spiderfyRequestIdRef,
  organizationByIdRef,
  selectedOrganizationIdRef,
  onSelectOrganizationRef,
  overlayState,
}: {
  source: mapboxgl.GeoJSONSource | undefined
  target: { clusterId: number; coordinates: [number, number] }
  pointCount: number
  clickRequestId: number
  mapRef: RefObject<mapboxgl.Map | null>
  mapboxRef: RefObject<MapboxApi | null>
  mapLoadedRef: RefObject<boolean>
  spiderfyRequestIdRef: RefObject<number>
  organizationByIdRef: RefObject<Map<string, PublicMapOrganization>>
  selectedOrganizationIdRef: RefObject<string | null>
  onSelectOrganizationRef: RefObject<(organizationId: string) => void>
  overlayState: SpiderfyOverlayState
}) {
  if (!source || typeof source.getClusterLeaves !== "function") return
  void (async () => {
    let leaves: mapboxgl.MapboxGeoJSONFeature[] = []
    try {
      leaves = await fetchClusterLeavesWithTimeout({
        source,
        clusterId: target.clusterId,
        pointCount,
      })
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[public-map] failed to fetch cluster leaves", {
          clusterId: target.clusterId,
          pointCount,
          error,
        })
      }
      return
    }
    if (leaves.length < 2) return
    if (spiderfyRequestIdRef.current !== clickRequestId) return
    if (process.env.NODE_ENV !== "production" && leaves.length < pointCount) {
      console.warn("[public-map] cluster leaves partial fetch", {
        clusterId: target.clusterId,
        pointCount,
        leavesLength: leaves.length,
      })
    }
    const activeMap = mapRef.current
    const activeMapbox = mapboxRef.current
    if (!activeMap || !activeMapbox || !mapLoadedRef.current) return
    const candidateBuckets = resolveSpiderfyCandidateBuckets({
      map: activeMap,
      leaves,
      organizationById: organizationByIdRef.current,
      targetCoordinates: target.coordinates,
      resolveOrganizationId,
      resolveFeatureCoordinates,
    })
    if (candidateBuckets.length === 0) return
    const openOverlay = () => {
      if (spiderfyRequestIdRef.current !== clickRequestId) return
      const latestMap = mapRef.current
      const latestMapbox = mapboxRef.current
      if (!latestMap || !latestMapbox || !mapLoadedRef.current) return

      openSpiderfyOverlay({
        map: latestMap,
        mapbox: latestMapbox,
        state: overlayState,
        buckets: candidateBuckets,
        selectedOrganizationId: selectedOrganizationIdRef.current,
        onSelectOrganization: onSelectOrganizationRef.current,
      })
    }
    const shouldWaitForIdle =
      typeof activeMap.isMoving === "function" ? activeMap.isMoving() : true
    if (shouldWaitForIdle) {
      activeMap.once("idle", openOverlay)
    } else {
      openOverlay()
    }
  })()
}

export function executeClusterSelection({
  clusterId,
  coordinates,
  pointCount,
  mapRef,
  mapLoadedRef,
  mapboxRef,
  spiderfyRequestIdRef,
  organizationByIdRef,
  selectedOrganizationIdRef,
  onSelectOrganizationRef,
  overlayState,
}: {
  clusterId: number
  coordinates: [number, number]
  pointCount: number
  mapRef: RefObject<mapboxgl.Map | null>
  mapLoadedRef: RefObject<boolean>
  mapboxRef: RefObject<MapboxApi | null>
  spiderfyRequestIdRef: RefObject<number>
  organizationByIdRef: RefObject<Map<string, PublicMapOrganization>>
  selectedOrganizationIdRef: RefObject<string | null>
  onSelectOrganizationRef: RefObject<(organizationId: string) => void>
  overlayState: SpiderfyOverlayState
}) {
  const clickMap = mapRef.current
  if (!clickMap || !mapLoadedRef.current) return
  clearSpiderfyOverlay({
    map: clickMap,
    state: overlayState,
  })
  const clickRequestId = spiderfyRequestIdRef.current + 1
  spiderfyRequestIdRef.current = clickRequestId
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
    runClusterSpiderfyOverlayFlow({
      source,
      target,
      pointCount,
      clickRequestId,
      mapRef,
      mapboxRef,
      mapLoadedRef,
      spiderfyRequestIdRef,
      organizationByIdRef,
      selectedOrganizationIdRef,
      onSelectOrganizationRef,
      overlayState,
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
    runClusterSpiderfyOverlayFlow({
      source,
      target,
      pointCount,
      clickRequestId,
      mapRef,
      mapboxRef,
      mapLoadedRef,
      spiderfyRequestIdRef,
      organizationByIdRef,
      selectedOrganizationIdRef,
      onSelectOrganizationRef,
      overlayState,
    })
  })
}

export function createClusterSelectHandler({
  clusterId,
  coordinates,
  pointCount,
  mapRef,
  mapLoadedRef,
  mapboxRef,
  spiderfyRequestIdRef,
  organizationByIdRef,
  selectedOrganizationIdRef,
  onSelectOrganizationRef,
  overlayState,
}: {
  clusterId: number
  coordinates: [number, number]
  pointCount: number
  mapRef: RefObject<mapboxgl.Map | null>
  mapLoadedRef: RefObject<boolean>
  mapboxRef: RefObject<MapboxApi | null>
  spiderfyRequestIdRef: RefObject<number>
  organizationByIdRef: RefObject<Map<string, PublicMapOrganization>>
  selectedOrganizationIdRef: RefObject<string | null>
  onSelectOrganizationRef: RefObject<(organizationId: string) => void>
  overlayState: SpiderfyOverlayState
}) {
  return () =>
    executeClusterSelection({
      clusterId,
      coordinates,
      pointCount,
      mapRef,
      mapLoadedRef,
      mapboxRef,
      spiderfyRequestIdRef,
      organizationByIdRef,
      selectedOrganizationIdRef,
      onSelectOrganizationRef,
      overlayState,
    })
}
