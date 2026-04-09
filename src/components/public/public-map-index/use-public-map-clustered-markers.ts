"use client"

import { useEffect, useRef, type RefObject } from "react"
import type mapboxgl from "mapbox-gl"

import type { PublicMapOrganization } from "@/lib/queries/public-map-index"

import { executeClusterSelection } from "./cluster-click-handlers"
import {
  clearSpiderfyOverlay,
  type SpiderfyOverlayState,
} from "./overlap-expansion"
import {
  clearOrganizationMarkers,
  type OrganizationMarkerEntry,
  reconcileOrganizationMarkers,
} from "./organization-marker-overlay"
import {
  PUBLIC_MAP_CLUSTER_SOURCE_CLUSTER_LAYER_ID,
  PUBLIC_MAP_CLUSTER_SOURCE_COUNT_LAYER_ID,
} from "./map-view-helpers"
import {
  syncClusterSourceAndLayers,
  syncSelectedOrganizationLayers,
} from "./map-layer-sync"
import { resolveFeatureCoordinatesForMap } from "./map-coordinate-normalization"
import {
  resolveClusterId,
  resolvePointCount,
} from "./public-map-cluster-runtime"

type MapboxApi = typeof import("mapbox-gl")["default"]

function useSyncPublicMapMarkerRefs({
  onSelectOrganization,
  selectedOrganizationId,
  organizationById,
  onSelectOrganizationRef,
  selectedOrganizationIdRef,
  organizationByIdRef,
}: {
  onSelectOrganization: (organizationId: string) => void
  selectedOrganizationId: string | null
  organizationById: Map<string, PublicMapOrganization>
  onSelectOrganizationRef: RefObject<(organizationId: string) => void>
  selectedOrganizationIdRef: RefObject<string | null>
  organizationByIdRef: RefObject<Map<string, PublicMapOrganization>>
}) {
  useEffect(() => {
    onSelectOrganizationRef.current = onSelectOrganization
  }, [onSelectOrganization, onSelectOrganizationRef])

  useEffect(() => {
    selectedOrganizationIdRef.current = selectedOrganizationId
  }, [selectedOrganizationId, selectedOrganizationIdRef])

  useEffect(() => {
    organizationByIdRef.current = organizationById
  }, [organizationById, organizationByIdRef])
}

function useSyncOrganizationMarkerOverlay({
  mapRef,
  mapboxRef,
  mapLoadedRef,
  mapLoadVersion,
  organizationByIdRef,
  selectedOrganizationId,
  onSelectOrganizationRef,
  spiderfyOverlayStateRef,
  spiderfyRequestIdRef,
}: {
  mapRef: RefObject<mapboxgl.Map | null>
  mapboxRef: RefObject<MapboxApi | null>
  mapLoadedRef: RefObject<boolean>
  mapLoadVersion: number
  organizationByIdRef: RefObject<Map<string, PublicMapOrganization>>
  selectedOrganizationId: string | null
  onSelectOrganizationRef: RefObject<(organizationId: string) => void>
  spiderfyOverlayStateRef: RefObject<SpiderfyOverlayState>
  spiderfyRequestIdRef: RefObject<number>
}) {
  const organizationMarkersRef = useRef<Map<string, OrganizationMarkerEntry>>(new Map())

  useEffect(() => {
    const map = mapRef.current
    const mapbox = mapboxRef.current
    if (!map || !mapbox || !mapLoadedRef.current) return

    const markersByKey = organizationMarkersRef.current
    let renderTimeout: number | null = null
    let animationFrame = 0
    let lastRenderAt = 0

    const renderMarkers = () => {
      const activeMap = mapRef.current
      const activeMapbox = mapboxRef.current
      if (!activeMap || !activeMapbox || !mapLoadedRef.current) return

      reconcileOrganizationMarkers({
        map: activeMap,
        mapbox: activeMapbox,
        markersByKey,
        organizationById: organizationByIdRef.current,
        selectedOrganizationId,
        onSelectOrganization: onSelectOrganizationRef.current,
        spiderfyOverlayState: spiderfyOverlayStateRef.current,
        spiderfyRequestIdRef,
      })
    }

    const flushRender = () => {
      cancelAnimationFrame(animationFrame)
      animationFrame = requestAnimationFrame(() => {
        lastRenderAt = performance.now()
        renderMarkers()
      })
    }

    const scheduleRender = () => {
      const elapsed = performance.now() - lastRenderAt
      if (elapsed >= 48) {
        if (renderTimeout !== null) {
          window.clearTimeout(renderTimeout)
          renderTimeout = null
        }
        flushRender()
        return
      }

      if (renderTimeout !== null) return
      renderTimeout = window.setTimeout(() => {
        renderTimeout = null
        flushRender()
      }, Math.max(0, 48 - elapsed))
    }

    scheduleRender()
    map.on("idle", scheduleRender)

    return () => {
      cancelAnimationFrame(animationFrame)
      if (renderTimeout !== null) {
        window.clearTimeout(renderTimeout)
      }
      map.off("idle", scheduleRender)
      clearOrganizationMarkers(markersByKey)
    }
  }, [
    mapLoadVersion,
    mapLoadedRef,
    mapRef,
    mapboxRef,
    onSelectOrganizationRef,
    organizationByIdRef,
    selectedOrganizationId,
    spiderfyOverlayStateRef,
    spiderfyRequestIdRef,
  ])
}

function createDismissSpiderfyOverlayHandler({
  mapRef,
  overlayState,
  spiderfyRequestIdRef,
}: {
  mapRef: RefObject<mapboxgl.Map | null>
  overlayState: SpiderfyOverlayState
  spiderfyRequestIdRef: RefObject<number>
}) {
  return () => {
    const activeMap = mapRef.current
    if (!activeMap) return
    clearSpiderfyOverlay({
      map: activeMap,
      state: overlayState,
    })
    spiderfyRequestIdRef.current += 1
  }
}

function useSyncClusterSourceData({
  mapRef,
  mapLoadedRef,
  mapLoadVersion,
  organizations,
  selectedOrganizationIdRef,
}: {
  mapRef: RefObject<mapboxgl.Map | null>
  mapLoadedRef: RefObject<boolean>
  mapLoadVersion: number
  organizations: PublicMapOrganization[]
  selectedOrganizationIdRef: RefObject<string | null>
}) {
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoadedRef.current) return

    const syncLayers = () => {
      if (!mapLoadedRef.current) return
      syncClusterSourceAndLayers({ map, organizations })
      syncSelectedOrganizationLayers({
        map,
        selectedOrganizationId: selectedOrganizationIdRef.current,
      })
    }

    syncLayers()
    map.on("style.load", syncLayers)
    return () => {
      map.off("style.load", syncLayers)
    }
  }, [mapLoadVersion, mapLoadedRef, mapRef, organizations, selectedOrganizationIdRef])
}

function useSyncSelectedOrganizationLayers({
  mapRef,
  mapLoadedRef,
  mapLoadVersion,
  selectedOrganizationId,
  spiderfyOverlayStateRef,
  spiderfyRequestIdRef,
}: {
  mapRef: RefObject<mapboxgl.Map | null>
  mapLoadedRef: RefObject<boolean>
  mapLoadVersion: number
  selectedOrganizationId: string | null
  spiderfyOverlayStateRef: RefObject<SpiderfyOverlayState>
  spiderfyRequestIdRef: RefObject<number>
}) {
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoadedRef.current) return

    syncSelectedOrganizationLayers({
      map,
      selectedOrganizationId,
    })

    clearSpiderfyOverlay({
      map,
      state: spiderfyOverlayStateRef.current,
    })
    spiderfyRequestIdRef.current += 1
  }, [
    mapLoadVersion,
    mapLoadedRef,
    mapRef,
    selectedOrganizationId,
    spiderfyOverlayStateRef,
    spiderfyRequestIdRef,
  ])
}

function useBindPublicMapLayerInteractions({
  mapRef,
  mapboxRef,
  mapLoadedRef,
  mapLoadVersion,
  onSelectOrganizationRef,
  selectedOrganizationIdRef,
  organizationByIdRef,
  spiderfyOverlayStateRef,
  spiderfyRequestIdRef,
}: {
  mapRef: RefObject<mapboxgl.Map | null>
  mapboxRef: RefObject<MapboxApi | null>
  mapLoadedRef: RefObject<boolean>
  mapLoadVersion: number
  onSelectOrganizationRef: RefObject<(organizationId: string) => void>
  selectedOrganizationIdRef: RefObject<string | null>
  organizationByIdRef: RefObject<Map<string, PublicMapOrganization>>
  spiderfyOverlayStateRef: RefObject<SpiderfyOverlayState>
  spiderfyRequestIdRef: RefObject<number>
}) {
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoadedRef.current) return

    const overlayState = spiderfyOverlayStateRef.current
    const dismissSpiderfyOverlay = createDismissSpiderfyOverlayHandler({
      mapRef,
      overlayState,
      spiderfyRequestIdRef,
    })
    const enablePointerCursor = () => {
      const canvas = map.getCanvas()
      if (!canvas) return
      canvas.style.cursor = "pointer"
    }
    const disablePointerCursor = () => {
      const canvas = map.getCanvas()
      if (!canvas) return
      canvas.style.cursor = ""
    }

    const handleClusterClick = (event: mapboxgl.MapLayerMouseEvent) => {
      const feature = event.features?.[0]
      if (!feature) return
      const properties = (feature.properties ?? {}) as Record<string, unknown>
      const clusterId = resolveClusterId(properties.cluster_id)
      const pointCount = resolvePointCount(properties.point_count)
      const coordinates = resolveFeatureCoordinatesForMap({
        map,
        feature,
      })
      if (clusterId === null || !coordinates) return

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

    const clusterLayerIds = [
      PUBLIC_MAP_CLUSTER_SOURCE_CLUSTER_LAYER_ID,
      PUBLIC_MAP_CLUSTER_SOURCE_COUNT_LAYER_ID,
    ] as const

    clusterLayerIds.forEach((layerId) => {
      map.on("click", layerId, handleClusterClick)
      map.on("mouseenter", layerId, enablePointerCursor)
      map.on("mouseleave", layerId, disablePointerCursor)
    })

    map.on("movestart", dismissSpiderfyOverlay)
    map.on("zoomstart", dismissSpiderfyOverlay)
    map.on("dragstart", dismissSpiderfyOverlay)

    return () => {
      clusterLayerIds.forEach((layerId) => {
        map.off("click", layerId, handleClusterClick)
        map.off("mouseenter", layerId, enablePointerCursor)
        map.off("mouseleave", layerId, disablePointerCursor)
      })
      map.off("movestart", dismissSpiderfyOverlay)
      map.off("zoomstart", dismissSpiderfyOverlay)
      map.off("dragstart", dismissSpiderfyOverlay)
      disablePointerCursor()
      clearSpiderfyOverlay({
        map,
        state: overlayState,
      })
      spiderfyRequestIdRef.current += 1
    }
  }, [
    mapLoadVersion,
    mapLoadedRef,
    mapRef,
    mapboxRef,
    onSelectOrganizationRef,
    organizationByIdRef,
    selectedOrganizationIdRef,
    spiderfyOverlayStateRef,
    spiderfyRequestIdRef,
  ])
}

export function usePublicMapClusteredMarkers({
  mapRef,
  mapboxRef,
  mapLoadedRef,
  organizations,
  organizationById,
  mapLoadVersion,
  selectedOrganizationId,
  onSelectOrganization,
}: {
  mapRef: RefObject<mapboxgl.Map | null>
  mapboxRef: RefObject<MapboxApi | null>
  mapLoadedRef: RefObject<boolean>
  organizations: PublicMapOrganization[]
  organizationById: Map<string, PublicMapOrganization>
  mapLoadVersion: number
  selectedOrganizationId: string | null
  onSelectOrganization: (organizationId: string) => void
}) {
  const onSelectOrganizationRef = useRef(onSelectOrganization)
  const selectedOrganizationIdRef = useRef<string | null>(selectedOrganizationId)
  const organizationByIdRef = useRef(organizationById)
  const spiderfyOverlayStateRef = useRef<SpiderfyOverlayState>({
    markers: [],
  })
  const spiderfyRequestIdRef = useRef(0)

  useSyncPublicMapMarkerRefs({
    onSelectOrganization,
    selectedOrganizationId,
    organizationById,
    onSelectOrganizationRef,
    selectedOrganizationIdRef,
    organizationByIdRef,
  })
  useSyncClusterSourceData({
    mapRef,
    mapLoadedRef,
    mapLoadVersion,
    organizations,
    selectedOrganizationIdRef,
  })
  useSyncSelectedOrganizationLayers({
    mapRef,
    mapLoadedRef,
    mapLoadVersion,
    selectedOrganizationId,
    spiderfyOverlayStateRef,
    spiderfyRequestIdRef,
  })
  useSyncOrganizationMarkerOverlay({
    mapRef,
    mapboxRef,
    mapLoadedRef,
    mapLoadVersion,
    organizationByIdRef,
    selectedOrganizationId,
    onSelectOrganizationRef,
    spiderfyOverlayStateRef,
    spiderfyRequestIdRef,
  })
  useBindPublicMapLayerInteractions({
    mapRef,
    mapboxRef,
    mapLoadedRef,
    mapLoadVersion,
    onSelectOrganizationRef,
    selectedOrganizationIdRef,
    organizationByIdRef,
    spiderfyOverlayStateRef,
    spiderfyRequestIdRef,
  })
}
