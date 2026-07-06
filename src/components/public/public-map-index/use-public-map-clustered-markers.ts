"use client"

import { useEffect, useRef, type RefObject } from "react"
import type mapboxgl from "mapbox-gl"

import type { PublicMapOrganization } from "@/lib/queries/public-map-index"
import type { PublicMapItem } from "@/lib/public-map/resource-map-items"
import type { PublicMapTheme } from "@/lib/public-map/public-map-theme"
import {
  buildPublicMapDataVersion,
  buildPublicMapItemDataVersion,
  buildPublicMapItemPointFeatures,
  createPublicMapClusterViewportQueryState,
  preparePublicMapClusterViewportQuery,
  resolvePublicMapClusterBbox,
  resolvePublicMapClusterZoom,
  buildPublicMapPointFeatures,
  createPublicMapClusterClient,
  createPublicMapClusterSpriteCache,
  enrichPublicMapClusterSourceDataWithSprites,
  ensurePublicMapFallbackMarkerImages,
  ensurePublicMapMarkerImages,
  registerPublicMapStyleImageMissingHandler,
  type PublicMapClusterClient,
  type PublicMapClusterSpriteCache,
  type PublicMapFeatureCollection,
  type PublicMapSameLocationSelection,
} from "@/lib/public-map/public-map-layer-api"
import { shouldUsePublicMapClusterResult } from "@/lib/public-map/public-map-cluster-client"

import { executeClusterSelection } from "./cluster-click-handlers"
import {
  ensurePublicMapClusterLayers,
  setPublicMapClusterSourceData,
  syncSelectedOrganizationLayers,
} from "./map-layer-sync"
import { resolveFeatureCoordinatesForMap } from "./map-coordinate-normalization"
import {
  PUBLIC_MAP_CLUSTER_SOURCE_CLUSTER_LAYER_ID,
  PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID,
  PUBLIC_MAP_ORGANIZATION_SOURCE_ID,
  PUBLIC_MAP_SAME_LOCATION_COUNT_LAYER_ID,
  PUBLIC_MAP_SELECTED_POINT_BADGE_LAYER_ID,
  PUBLIC_MAP_SELECTED_POINT_CORE_LAYER_ID,
  PUBLIC_MAP_SELECTED_POINT_SHADOW_LAYER_ID,
  PUBLIC_MAP_UNCLUSTERED_SHADOW_LAYER_ID,
} from "./map-view-helpers"
import {
  bindPublicMapPointerCursor,
  resolveClusterId,
  resolvePublicMapPointClickAction,
  resolvePointCount,
} from "./public-map-cluster-runtime"

const PUBLIC_MAP_FULL_WORLD_BBOX: [number, number, number, number] = [
  -180, -85, 180, 85,
]

declare global {
  interface Window {
    __MAP_DEBUG__?: {
      getFeatures: () => mapboxgl.MapboxGeoJSONFeature[]
      getLayers: () => Array<ReturnType<mapboxgl.Map["getLayer"]>>
      getSource: () => ReturnType<mapboxgl.Map["getSource"]>
    }
  }
}

function resolveFeatureProperties(event: mapboxgl.MapLayerMouseEvent) {
  return (event.features?.[0]?.properties ?? {}) as Record<string, unknown>
}

function installPublicMapDebugProbe(map: mapboxgl.Map) {
  if (process.env.NODE_ENV === "production" || typeof window === "undefined") {
    return () => {}
  }

  const debug = {
    getSource: () => map.getSource(PUBLIC_MAP_ORGANIZATION_SOURCE_ID),
    getLayers: () => [
      map.getLayer(PUBLIC_MAP_CLUSTER_SOURCE_CLUSTER_LAYER_ID),
      map.getLayer(PUBLIC_MAP_UNCLUSTERED_SHADOW_LAYER_ID),
      map.getLayer(PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID),
      map.getLayer(PUBLIC_MAP_SELECTED_POINT_SHADOW_LAYER_ID),
      map.getLayer(PUBLIC_MAP_SELECTED_POINT_CORE_LAYER_ID),
    ],
    getFeatures: () =>
      map.queryRenderedFeatures({
        layers: [
          PUBLIC_MAP_CLUSTER_SOURCE_CLUSTER_LAYER_ID,
          PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID,
        ],
      }),
  } satisfies NonNullable<Window["__MAP_DEBUG__"]>

  window.__MAP_DEBUG__ = debug
  return () => {
    if (window.__MAP_DEBUG__ === debug) {
      delete window.__MAP_DEBUG__
    }
  }
}

export function usePublicMapClusteredMarkers({
  mapRef,
  mapLoadedRef,
  mapItems,
  organizations,
  mapLoadVersion,
  markerTheme = "light",
  selectedOrganizationId,
  activeSameLocationGroupKey,
  onSelectOrganization,
  onOpenSameLocationGroup,
}: {
  mapRef: RefObject<mapboxgl.Map | null>
  mapLoadedRef: RefObject<boolean>
  organizations: PublicMapOrganization[]
  mapItems?: PublicMapItem[]
  mapLoadVersion: number
  markerTheme?: PublicMapTheme
  selectedOrganizationId: string | null
  activeSameLocationGroupKey: string | null
  onSelectOrganization: (organizationId: string) => void
  onOpenSameLocationGroup: (group: PublicMapSameLocationSelection) => void
}) {
  const resolvedMapItems = mapItems ?? []
  const clusterClientRef = useRef<PublicMapClusterClient | null>(null)
  const organizationsRef = useRef(organizations)
  const mapItemsRef = useRef(resolvedMapItems)
  const onSelectOrganizationRef = useRef(onSelectOrganization)
  const onOpenSameLocationGroupRef = useRef(onOpenSameLocationGroup)
  const selectedOrganizationIdRef = useRef<string | null>(
    selectedOrganizationId
  )
  const activeSameLocationGroupKeyRef = useRef<string | null>(
    activeSameLocationGroupKey
  )
  const latestSourceDataRef = useRef<PublicMapFeatureCollection | null>(null)
  const clusterSpriteCacheRef = useRef<PublicMapClusterSpriteCache | null>(null)
  const shouldUseMapItems = resolvedMapItems.length > 0
  const clusterDataVersion = shouldUseMapItems
    ? buildPublicMapItemDataVersion(resolvedMapItems, { markerTheme })
    : buildPublicMapDataVersion(organizations, { markerTheme })
  if (!clusterSpriteCacheRef.current) {
    clusterSpriteCacheRef.current = createPublicMapClusterSpriteCache()
  }
  organizationsRef.current = organizations
  mapItemsRef.current = resolvedMapItems
  onSelectOrganizationRef.current = onSelectOrganization
  onOpenSameLocationGroupRef.current = onOpenSameLocationGroup

  useEffect(() => {
    selectedOrganizationIdRef.current = selectedOrganizationId
    activeSameLocationGroupKeyRef.current = activeSameLocationGroupKey

    const map = mapRef.current
    if (!map || !mapLoadedRef.current) return

    syncSelectedOrganizationLayers({
      map,
      selectedOrganizationId,
      activeSameLocationGroupKey,
    })
  }, [activeSameLocationGroupKey, mapLoadedRef, mapRef, selectedOrganizationId])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoadedRef.current) return

    const dataVersion = clusterDataVersion
    const currentMapItems = mapItemsRef.current
    const pointFeatures =
      currentMapItems && currentMapItems.length > 0
        ? buildPublicMapItemPointFeatures(currentMapItems, { markerTheme })
        : buildPublicMapPointFeatures(organizationsRef.current, {
            markerTheme,
          })
    const client = createPublicMapClusterClient()
    const clusterSpriteCache =
      clusterSpriteCacheRef.current ?? createPublicMapClusterSpriteCache()
    clusterSpriteCacheRef.current = clusterSpriteCache
    clusterClientRef.current?.destroy()
    clusterClientRef.current = client

    let cancelled = false
    let frameId: number | null = null
    let clusterIndexReady = false
    const viewportQueryState = createPublicMapClusterViewportQueryState()

    const cacheLatestSourceData = (sourceData: PublicMapFeatureCollection) => {
      if (sourceData.features.length > 0 || !latestSourceDataRef.current) {
        latestSourceDataRef.current = sourceData
      }
    }

    const syncVisibleClusters = () => {
      if (cancelled || !mapLoadedRef.current || mapRef.current !== map) return
      if (!clusterIndexReady) return

      const bbox = resolvePublicMapClusterBbox(map)
      const zoom = resolvePublicMapClusterZoom(map)
      const viewportQuery = preparePublicMapClusterViewportQuery({
        state: viewportQueryState,
        bbox,
        zoom,
        dataVersion,
      })
      if (!viewportQuery.shouldQuery) return

      void client
        .getClusters({
          bbox,
          zoom,
          dataVersion,
          querySeq: viewportQuery.querySeq,
        })
        .then(async (result) => {
          if (
            cancelled ||
            !shouldUsePublicMapClusterResult(result, {
              dataVersion,
              querySeq: viewportQueryState.querySeq,
            }) ||
            mapRef.current !== map
          ) {
            return
          }
          let resolvedSourceData = result.sourceData
          if (
            resolvedSourceData.features.length === 0 &&
            pointFeatures.length > 0 &&
            (latestSourceDataRef.current?.features.length ?? 0) === 0
          ) {
            const fallbackResult = await client.getClusters({
              bbox: PUBLIC_MAP_FULL_WORLD_BBOX,
              zoom,
              dataVersion,
              querySeq: viewportQuery.querySeq,
            })
            if (
              shouldUsePublicMapClusterResult(fallbackResult, {
                dataVersion,
                querySeq: viewportQueryState.querySeq,
              }) &&
              fallbackResult.sourceData.features.length > 0
            ) {
              resolvedSourceData = fallbackResult.sourceData
            }
          }
          const sourceData = await enrichPublicMapClusterSourceDataWithSprites({
            clusterClient: client,
            dataVersion,
            map,
            markerTheme,
            sourceData: resolvedSourceData,
            spriteCache: clusterSpriteCache,
            zoom,
          })
          if (
            cancelled ||
            !shouldUsePublicMapClusterResult(result, {
              dataVersion,
              querySeq: viewportQueryState.querySeq,
            }) ||
            mapRef.current !== map
          ) {
            return
          }
          cacheLatestSourceData(sourceData)
          const markerImageLoads = ensurePublicMapMarkerImages({
            map,
            features: sourceData.features,
            theme: markerTheme,
          })
          const updated = setPublicMapClusterSourceData({
            map,
            sourceData,
          })
          if (!updated) return
          void Promise.all(markerImageLoads)
          syncSelectedOrganizationLayers({
            map,
            selectedOrganizationId: selectedOrganizationIdRef.current,
            activeSameLocationGroupKey: activeSameLocationGroupKeyRef.current,
          })
        })
    }

    const scheduleClusterSync = () => {
      if (frameId !== null) return
      frameId = window.requestAnimationFrame(() => {
        frameId = null
        syncVisibleClusters()
      })
    }

    const handleStyleLoad = () => {
      ensurePublicMapClusterLayers(
        map,
        latestSourceDataRef.current,
        markerTheme
      )
      ensurePublicMapFallbackMarkerImages(map, markerTheme)
      scheduleClusterSync()
    }

    const handleStableViewport = () => scheduleClusterSync()

    const handleClusterClick = (event: mapboxgl.MapLayerMouseEvent) => {
      const feature = event.features?.[0]
      if (!feature) return
      const properties = resolveFeatureProperties(event)
      const clusterId = resolveClusterId(properties.cluster_id)
      const pointCount = resolvePointCount(properties.point_count)
      const coordinates = resolveFeatureCoordinatesForMap({
        map,
        feature,
      })
      if (clusterId === null || pointCount < 2 || !coordinates) return

      executeClusterSelection({
        clusterId,
        coordinates,
        mapRef,
        mapLoadedRef,
        getExpansionZoom: (id) => client.getExpansionZoom(id, dataVersion),
      })
    }

    const handlePointClick = (event: mapboxgl.MapLayerMouseEvent) => {
      const properties = resolveFeatureProperties(event)
      const action = resolvePublicMapPointClickAction(properties)
      if (!action) return

      if (action.type === "same-location") {
        onOpenSameLocationGroupRef.current(action.group)
        return
      }

      onSelectOrganizationRef.current(action.organizationId)
    }

    ensurePublicMapClusterLayers(map, latestSourceDataRef.current, markerTheme)
    ensurePublicMapFallbackMarkerImages(map, markerTheme)
    const uninstallDebugProbe = installPublicMapDebugProbe(map)
    const stopStyleImageMissing = registerPublicMapStyleImageMissingHandler(
      map,
      markerTheme
    )
    const stopPointerCursor = bindPublicMapPointerCursor(map)

    void client.build(pointFeatures, dataVersion).then(() => {
      if (cancelled || mapRef.current !== map) return
      clusterIndexReady = true
      viewportQueryState.lastViewportKey = ""
      scheduleClusterSync()
    })

    map.on("moveend", handleStableViewport)
    map.on("zoomend", handleStableViewport)
    map.on("idle", handleStableViewport)
    map.on("style.load", handleStyleLoad)
    map.on(
      "click",
      PUBLIC_MAP_CLUSTER_SOURCE_CLUSTER_LAYER_ID,
      handleClusterClick
    )
    map.on("click", PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID, handlePointClick)
    map.on("click", PUBLIC_MAP_SAME_LOCATION_COUNT_LAYER_ID, handlePointClick)
    map.on("click", PUBLIC_MAP_SELECTED_POINT_CORE_LAYER_ID, handlePointClick)
    map.on("click", PUBLIC_MAP_SELECTED_POINT_BADGE_LAYER_ID, handlePointClick)

    return () => {
      cancelled = true
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId)
      }
      map.off("moveend", handleStableViewport)
      map.off("zoomend", handleStableViewport)
      map.off("idle", handleStableViewport)
      map.off("style.load", handleStyleLoad)
      map.off(
        "click",
        PUBLIC_MAP_CLUSTER_SOURCE_CLUSTER_LAYER_ID,
        handleClusterClick
      )
      map.off(
        "click",
        PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID,
        handlePointClick
      )
      map.off(
        "click",
        PUBLIC_MAP_SAME_LOCATION_COUNT_LAYER_ID,
        handlePointClick
      )
      map.off(
        "click",
        PUBLIC_MAP_SELECTED_POINT_CORE_LAYER_ID,
        handlePointClick
      )
      map.off(
        "click",
        PUBLIC_MAP_SELECTED_POINT_BADGE_LAYER_ID,
        handlePointClick
      )
      uninstallDebugProbe()
      stopStyleImageMissing()
      stopPointerCursor()
      if (clusterClientRef.current === client) {
        clusterClientRef.current = null
      }
      client.destroy()
    }
  }, [mapLoadVersion, mapLoadedRef, mapRef, clusterDataVersion, markerTheme])
}
