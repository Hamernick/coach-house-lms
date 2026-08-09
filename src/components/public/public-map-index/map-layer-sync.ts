import type mapboxgl from "mapbox-gl"
import type { PublicMapTheme } from "@/lib/public-map/public-map-theme"

import {
  buildEmptyPublicMapFeatureCollection,
  PUBLIC_MAP_MARKER_REDUCED_MOTION_TRANSITION,
  PUBLIC_MAP_MARKER_SELECTION_TRANSITION,
  resolvePublicMapSelectedPointShadowOpacity,
  type PublicMapFeatureCollection,
} from "@/lib/public-map/public-map-layer-api"

import {
  PUBLIC_MAP_CLUSTER_SOURCE_CLUSTER_LAYER_ID,
  PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID,
  PUBLIC_MAP_ORGANIZATION_SOURCE_ID,
  PUBLIC_MAP_POINT_LABEL_LAYER_ID,
  PUBLIC_MAP_SELECTED_POINT_BADGE_LAYER_ID,
  PUBLIC_MAP_SELECTED_POINT_CORE_LAYER_ID,
  PUBLIC_MAP_SELECTED_POINT_HALO_LAYER_ID,
  PUBLIC_MAP_SELECTED_POINT_LABEL_LAYER_ID,
  PUBLIC_MAP_SELECTED_POINT_SHADOW_LAYER_ID,
  PUBLIC_MAP_UNCLUSTERED_SHADOW_LAYER_ID,
} from "./map-view-helpers"
import {
  addMapSourceSafely,
  getMapLayerSafely,
  getMapSourceSafely,
  isMapStyleAccessError,
  setMapFilterSafely,
  setMapPaintPropertySafely,
} from "./map-style-guards"
import {
  resolveSelectedPointFilter,
  resolveSelectedSameLocationBadgeFilter,
  resolveUnselectedPointFilter,
} from "./map-layer-filters"
import {
  assertPublicMapLayerContract,
  ensureClusterLayers,
  ensurePointLayers,
  ensureSelectedLayers,
  refreshLayerContracts,
} from "./map-layer-contracts"

const selectedMarkerAnimationKeysByMap = new WeakMap<mapboxgl.Map, string>()

function resolveSelectedMarkerAnimationKey({
  activeSameLocationGroupKey,
  selectedOrganizationId,
}: {
  activeSameLocationGroupKey: string | null
  selectedOrganizationId: string | null
}) {
  return selectedOrganizationId ?? activeSameLocationGroupKey ?? ""
}

function prefersReducedMotion() {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return false
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function restoreSelectedMarkerPaint(map: mapboxgl.Map) {
  setMapPaintPropertySafely(
    map,
    PUBLIC_MAP_SELECTED_POINT_CORE_LAYER_ID,
    "icon-opacity",
    1
  )
  setMapPaintPropertySafely(
    map,
    PUBLIC_MAP_SELECTED_POINT_SHADOW_LAYER_ID,
    "icon-opacity",
    resolvePublicMapSelectedPointShadowOpacity()
  )
  setMapPaintPropertySafely(
    map,
    PUBLIC_MAP_SELECTED_POINT_LABEL_LAYER_ID,
    "text-opacity",
    1
  )
}

function prepareSelectedMarkerPaintTransition(map: mapboxgl.Map) {
  const transition = prefersReducedMotion()
    ? PUBLIC_MAP_MARKER_REDUCED_MOTION_TRANSITION
    : PUBLIC_MAP_MARKER_SELECTION_TRANSITION

  setMapPaintPropertySafely(
    map,
    PUBLIC_MAP_SELECTED_POINT_CORE_LAYER_ID,
    "icon-opacity-transition",
    transition
  )
  setMapPaintPropertySafely(
    map,
    PUBLIC_MAP_SELECTED_POINT_SHADOW_LAYER_ID,
    "icon-opacity-transition",
    transition
  )
  setMapPaintPropertySafely(
    map,
    PUBLIC_MAP_SELECTED_POINT_LABEL_LAYER_ID,
    "text-opacity-transition",
    transition
  )

  if (transition.duration === 0) {
    restoreSelectedMarkerPaint(map)
    return false
  }

  setMapPaintPropertySafely(
    map,
    PUBLIC_MAP_SELECTED_POINT_CORE_LAYER_ID,
    "icon-opacity",
    0
  )
  setMapPaintPropertySafely(
    map,
    PUBLIC_MAP_SELECTED_POINT_SHADOW_LAYER_ID,
    "icon-opacity",
    0
  )
  setMapPaintPropertySafely(
    map,
    PUBLIC_MAP_SELECTED_POINT_LABEL_LAYER_ID,
    "text-opacity",
    0
  )
  return true
}

function scheduleSelectedMarkerPaintRestore(map: mapboxgl.Map) {
  if (typeof globalThis.requestAnimationFrame !== "function") {
    restoreSelectedMarkerPaint(map)
    return
  }

  globalThis.requestAnimationFrame(() => {
    restoreSelectedMarkerPaint(map)
  })
}

export function syncSelectedOrganizationLayers({
  map,
  selectedOrganizationId,
  activeSameLocationGroupKey = null,
}: {
  map: mapboxgl.Map
  selectedOrganizationId: string | null
  activeSameLocationGroupKey?: string | null
}) {
  const pointLayer = getMapLayerSafely(
    map,
    PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID
  )
  if (isMapStyleAccessError(pointLayer)) return
  if (pointLayer) {
    setMapFilterSafely(
      map,
      PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID,
      resolveUnselectedPointFilter({
        selectedOrganizationId,
        activeSameLocationGroupKey,
      })
    )
  }

  const pointShadowLayer = getMapLayerSafely(
    map,
    PUBLIC_MAP_UNCLUSTERED_SHADOW_LAYER_ID
  )
  if (isMapStyleAccessError(pointShadowLayer)) return
  if (pointShadowLayer) {
    setMapFilterSafely(
      map,
      PUBLIC_MAP_UNCLUSTERED_SHADOW_LAYER_ID,
      resolveUnselectedPointFilter({
        selectedOrganizationId,
        activeSameLocationGroupKey,
      })
    )
  }

  const pointLabelLayer = getMapLayerSafely(
    map,
    PUBLIC_MAP_POINT_LABEL_LAYER_ID
  )
  if (isMapStyleAccessError(pointLabelLayer)) return
  if (pointLabelLayer) {
    setMapFilterSafely(
      map,
      PUBLIC_MAP_POINT_LABEL_LAYER_ID,
      resolveUnselectedPointFilter({
        selectedOrganizationId,
        activeSameLocationGroupKey,
      })
    )
  }

  const selectedFilter = resolveSelectedPointFilter({
    selectedOrganizationId,
    activeSameLocationGroupKey,
  })
  const selectedAnimationKey = resolveSelectedMarkerAnimationKey({
    activeSameLocationGroupKey,
    selectedOrganizationId,
  })
  const shouldAnimateSelectedMarker =
    Boolean(selectedAnimationKey) &&
    selectedMarkerAnimationKeysByMap.get(map) !== selectedAnimationKey
  if (selectedAnimationKey) {
    selectedMarkerAnimationKeysByMap.set(map, selectedAnimationKey)
  } else {
    selectedMarkerAnimationKeysByMap.delete(map)
  }
  const shouldRestoreSelectedPaint =
    shouldAnimateSelectedMarker && prepareSelectedMarkerPaintTransition(map)
  const selectedBadgeFilter =
    resolveSelectedSameLocationBadgeFilter(selectedFilter)
  const selectedLayerFilters = [
    [PUBLIC_MAP_SELECTED_POINT_HALO_LAYER_ID, selectedFilter],
    [PUBLIC_MAP_SELECTED_POINT_SHADOW_LAYER_ID, selectedFilter],
    [PUBLIC_MAP_SELECTED_POINT_CORE_LAYER_ID, selectedFilter],
    [PUBLIC_MAP_SELECTED_POINT_BADGE_LAYER_ID, selectedBadgeFilter],
    [PUBLIC_MAP_SELECTED_POINT_LABEL_LAYER_ID, selectedFilter],
  ] as const

  for (const [layerId, filter] of selectedLayerFilters) {
    const layer = getMapLayerSafely(map, layerId)
    if (isMapStyleAccessError(layer)) return
    if (layer) {
      setMapFilterSafely(map, layerId, filter)
    }
  }

  if (shouldRestoreSelectedPaint) {
    scheduleSelectedMarkerPaintRestore(map)
  }
}

function ensurePublicMapSource({
  map,
  sourceData,
}: {
  map: mapboxgl.Map
  sourceData: PublicMapFeatureCollection
}) {
  try {
    if (map.getSource(PUBLIC_MAP_ORGANIZATION_SOURCE_ID)) return true
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[public-map] getSource failed before source creation", {
        error,
        sourceId: PUBLIC_MAP_ORGANIZATION_SOURCE_ID,
      })
    }
    return false
  }

  return addMapSourceSafely(map, PUBLIC_MAP_ORGANIZATION_SOURCE_ID, {
    type: "geojson",
    data: sourceData,
  })
}

function canAttachToMap(map: mapboxgl.Map) {
  try {
    return Boolean(map.getStyle())
  } catch {
    return false
  }
}

export function ensurePublicMapClusterLayers(
  map: mapboxgl.Map,
  latestData?: PublicMapFeatureCollection | null,
  markerTheme: PublicMapTheme = "light"
) {
  if (!canAttachToMap(map)) return false

  const sourceData = latestData ?? buildEmptyPublicMapFeatureCollection()
  if (!ensurePublicMapSource({ map, sourceData })) return false
  ensureClusterLayers(map, markerTheme)
  ensurePointLayers(map, markerTheme)
  ensureSelectedLayers(map, markerTheme)
  refreshLayerContracts(map, markerTheme)
  return assertPublicMapLayerContract(map)
}

export function syncClusterSourceAndLayers({
  map,
  markerTheme = "light",
  sourceData,
}: {
  map: mapboxgl.Map
  markerTheme?: PublicMapTheme
  sourceData?: PublicMapFeatureCollection
}) {
  return ensurePublicMapClusterLayers(map, sourceData, markerTheme)
}

export function setPublicMapClusterSourceData({
  map,
  sourceData,
}: {
  map: mapboxgl.Map
  sourceData: PublicMapFeatureCollection
}) {
  if (!canAttachToMap(map)) return false
  const source = getMapSourceSafely<mapboxgl.GeoJSONSource>(
    map,
    PUBLIC_MAP_ORGANIZATION_SOURCE_ID
  )
  if (isMapStyleAccessError(source)) {
    console.error("[public-map] cluster source access failed at setData", {
      sourceId: PUBLIC_MAP_ORGANIZATION_SOURCE_ID,
    })
    return false
  }
  if (!source) {
    console.error("[public-map] cluster source missing at setData", {
      sourceId: PUBLIC_MAP_ORGANIZATION_SOURCE_ID,
    })
    return false
  }
  source.setData(sourceData)
  return true
}
