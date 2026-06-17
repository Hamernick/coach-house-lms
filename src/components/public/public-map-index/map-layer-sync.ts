import type mapboxgl from "mapbox-gl"

import {
  buildEmptyPublicMapFeatureCollection,
  type PublicMapFeatureCollection,
} from "@/lib/public-map/public-map-layer-api"

import {
  PUBLIC_MAP_CLUSTER_SOURCE_CLUSTER_LAYER_ID,
  PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID,
  PUBLIC_MAP_ORGANIZATION_SOURCE_ID,
  PUBLIC_MAP_SELECTED_POINT_BADGE_LAYER_ID,
  PUBLIC_MAP_SELECTED_POINT_CORE_LAYER_ID,
  PUBLIC_MAP_SELECTED_POINT_HALO_LAYER_ID,
  PUBLIC_MAP_SELECTED_POINT_SHADOW_LAYER_ID,
} from "./map-view-helpers"
import {
  addMapSourceSafely,
  getMapLayerSafely,
  getMapSourceSafely,
  isMapStyleAccessError,
  setMapFilterSafely,
} from "./map-style-guards"
import {
  resolveSelectedPointFilter,
  resolveSelectedSameLocationBadgeFilter,
  resolveVisiblePointFilter,
} from "./map-layer-filters"
import {
  assertPublicMapLayerContract,
  ensureClusterLayers,
  ensurePointLayers,
  ensureSelectedLayers,
  refreshLayerContracts,
} from "./map-layer-contracts"

export function syncSelectedOrganizationLayers({
  map,
  selectedOrganizationId,
  activeSameLocationGroupKey = null,
}: {
  map: mapboxgl.Map
  selectedOrganizationId: string | null
  activeSameLocationGroupKey?: string | null
}) {
  const pointLayer = getMapLayerSafely(map, PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID)
  if (isMapStyleAccessError(pointLayer)) return
  if (pointLayer) {
    setMapFilterSafely(
      map,
      PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID,
      resolveVisiblePointFilter(),
    )
  }

  const selectedFilter = resolveSelectedPointFilter({
    selectedOrganizationId,
    activeSameLocationGroupKey,
  })
  const selectedBadgeFilter = resolveSelectedSameLocationBadgeFilter(selectedFilter)
  const selectedLayerFilters = [
    [PUBLIC_MAP_SELECTED_POINT_HALO_LAYER_ID, selectedFilter],
    [PUBLIC_MAP_SELECTED_POINT_SHADOW_LAYER_ID, selectedFilter],
    [PUBLIC_MAP_SELECTED_POINT_CORE_LAYER_ID, selectedFilter],
    [PUBLIC_MAP_SELECTED_POINT_BADGE_LAYER_ID, selectedBadgeFilter],
  ] as const

  for (const [layerId, filter] of selectedLayerFilters) {
    const layer = getMapLayerSafely(map, layerId)
    if (isMapStyleAccessError(layer)) return
    if (layer) {
      setMapFilterSafely(map, layerId, filter)
    }
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
) {
  if (!canAttachToMap(map)) return false

  const sourceData = latestData ?? buildEmptyPublicMapFeatureCollection()
  if (!ensurePublicMapSource({ map, sourceData })) return false
  ensureClusterLayers(map)
  ensurePointLayers(map)
  ensureSelectedLayers(map)
  refreshLayerContracts(map)
  return assertPublicMapLayerContract(map)
}

export function syncClusterSourceAndLayers({
  map,
  sourceData,
}: {
  map: mapboxgl.Map
  sourceData?: PublicMapFeatureCollection
}) {
  return ensurePublicMapClusterLayers(map, sourceData)
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
    PUBLIC_MAP_ORGANIZATION_SOURCE_ID,
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
