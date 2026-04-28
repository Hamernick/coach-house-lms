import type mapboxgl from "mapbox-gl"

import {
  buildPublicMapIconImageExpression,
  buildPublicMapSelectedIconImageExpression,
  buildEmptyPublicMapFeatureCollection,
  PUBLIC_MAP_POINT_SHADOW_KEY,
  resolvePublicMapPointIconSize,
  resolvePublicMapPointShadowOpacity,
  resolvePublicMapSelectedPointIconSize,
  type PublicMapFeatureCollection,
} from "@/lib/public-map/public-map-layer-api"

import {
  PUBLIC_MAP_CLUSTER_SOURCE_CLUSTER_LAYER_ID,
  PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID,
  PUBLIC_MAP_ORGANIZATION_SOURCE_ID,
  PUBLIC_MAP_SAME_LOCATION_COUNT_LAYER_ID,
  PUBLIC_MAP_SELECTED_POINT_BADGE_LAYER_ID,
  PUBLIC_MAP_SELECTED_POINT_CORE_LAYER_ID,
  PUBLIC_MAP_SELECTED_POINT_HALO_LAYER_ID,
  PUBLIC_MAP_SELECTED_POINT_SHADOW_LAYER_ID,
  PUBLIC_MAP_UNCLUSTERED_SHADOW_LAYER_ID,
} from "./map-view-helpers"
import {
  addMapLayerSafely,
  addMapSourceSafely,
  getMapLayerSafely,
  getMapSourceSafely,
  isMapStyleAccessError,
  setMapFilterSafely,
  setMapLayoutPropertySafely,
  setMapPaintPropertySafely,
} from "./map-style-guards"
import {
  resolveSameLocationBadgeFilter,
  resolveSelectedPointFilter,
  resolveSelectedSameLocationBadgeFilter,
  resolveVisiblePointFilter,
} from "./map-layer-filters"

const PUBLIC_MAP_CLUSTER_ICON_SIZE = 1
const REQUIRED_PUBLIC_MAP_LAYER_IDS = [
  PUBLIC_MAP_CLUSTER_SOURCE_CLUSTER_LAYER_ID,
  PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID,
] as const

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

function ensureClusterLayers(map: mapboxgl.Map) {
  if (!getMapLayerSafely(map, PUBLIC_MAP_CLUSTER_SOURCE_CLUSTER_LAYER_ID)) {
    addMapLayerSafely(map, {
      id: PUBLIC_MAP_CLUSTER_SOURCE_CLUSTER_LAYER_ID,
      type: "symbol",
      source: PUBLIC_MAP_ORGANIZATION_SOURCE_ID,
      filter: ["has", "point_count"],
      layout: {
        "icon-image": ["get", "clusterImageId"],
        "icon-size": PUBLIC_MAP_CLUSTER_ICON_SIZE,
        "icon-anchor": "center",
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
      },
    })
  }
}

function ensurePointLayers(map: mapboxgl.Map) {
  if (!getMapLayerSafely(map, PUBLIC_MAP_UNCLUSTERED_SHADOW_LAYER_ID)) {
    addMapLayerSafely(map, {
      id: PUBLIC_MAP_UNCLUSTERED_SHADOW_LAYER_ID,
      type: "symbol",
      source: PUBLIC_MAP_ORGANIZATION_SOURCE_ID,
      filter: resolveVisiblePointFilter(),
      layout: {
        "icon-image": PUBLIC_MAP_POINT_SHADOW_KEY,
        "icon-size": resolvePublicMapPointIconSize(),
        "icon-anchor": "center",
        "icon-offset": [0, 1],
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
      },
      paint: {
        "icon-opacity": resolvePublicMapPointShadowOpacity(),
      },
    })
  }

  if (!getMapLayerSafely(map, PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID)) {
    addMapLayerSafely(map, {
      id: PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID,
      type: "symbol",
      source: PUBLIC_MAP_ORGANIZATION_SOURCE_ID,
      filter: resolveVisiblePointFilter(),
      layout: {
        "icon-image": buildPublicMapIconImageExpression(),
        "icon-size": resolvePublicMapPointIconSize(),
        "icon-anchor": "center",
        "icon-allow-overlap": false,
        "icon-ignore-placement": false,
        "icon-padding": 4,
      },
    })
  }

  if (!getMapLayerSafely(map, PUBLIC_MAP_SAME_LOCATION_COUNT_LAYER_ID)) {
    addMapLayerSafely(map, {
      id: PUBLIC_MAP_SAME_LOCATION_COUNT_LAYER_ID,
      type: "symbol",
      source: PUBLIC_MAP_ORGANIZATION_SOURCE_ID,
      filter: resolveSameLocationBadgeFilter(),
      layout: {
        "text-field": ["to-string", ["get", "sameLocationCount"]],
        "text-size": 9,
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        "text-offset": [0.78, 0.78],
        "text-allow-overlap": true,
        "text-ignore-placement": true,
      },
      paint: {
        "text-color": "#FFFFFF",
        "text-halo-color": "rgba(15, 23, 42, 0.88)",
        "text-halo-width": 4,
      },
    })
  }
}

function ensureSelectedLayers(map: mapboxgl.Map) {
  const selectedFilter = resolveSelectedPointFilter({
    selectedOrganizationId: null,
    activeSameLocationGroupKey: null,
  })

  if (!getMapLayerSafely(map, PUBLIC_MAP_SELECTED_POINT_HALO_LAYER_ID)) {
    addMapLayerSafely(map, {
      id: PUBLIC_MAP_SELECTED_POINT_HALO_LAYER_ID,
      type: "circle",
      source: PUBLIC_MAP_ORGANIZATION_SOURCE_ID,
      filter: selectedFilter,
      paint: {
        "circle-color": "rgba(0, 0, 0, 0)",
        "circle-radius": 1,
        "circle-opacity": 0,
        "circle-stroke-color": "rgba(0, 0, 0, 0)",
        "circle-stroke-opacity": 0,
        "circle-stroke-width": 0,
      },
    })
  }

  if (!getMapLayerSafely(map, PUBLIC_MAP_SELECTED_POINT_SHADOW_LAYER_ID)) {
    addMapLayerSafely(map, {
      id: PUBLIC_MAP_SELECTED_POINT_SHADOW_LAYER_ID,
      type: "symbol",
      source: PUBLIC_MAP_ORGANIZATION_SOURCE_ID,
      filter: selectedFilter,
      layout: {
        "icon-image": PUBLIC_MAP_POINT_SHADOW_KEY,
        "icon-size": resolvePublicMapSelectedPointIconSize(),
        "icon-anchor": "center",
        "icon-offset": [0, 1.5],
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
      },
      paint: {
        "icon-opacity": 0.78,
      },
    })
  }

  if (!getMapLayerSafely(map, PUBLIC_MAP_SELECTED_POINT_CORE_LAYER_ID)) {
    addMapLayerSafely(map, {
      id: PUBLIC_MAP_SELECTED_POINT_CORE_LAYER_ID,
      type: "symbol",
      source: PUBLIC_MAP_ORGANIZATION_SOURCE_ID,
      filter: selectedFilter,
      layout: {
        "icon-image": buildPublicMapSelectedIconImageExpression(),
        "icon-size": resolvePublicMapSelectedPointIconSize(),
        "icon-anchor": "center",
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
      },
    })
  }

  if (!getMapLayerSafely(map, PUBLIC_MAP_SELECTED_POINT_BADGE_LAYER_ID)) {
    addMapLayerSafely(map, {
      id: PUBLIC_MAP_SELECTED_POINT_BADGE_LAYER_ID,
      type: "symbol",
      source: PUBLIC_MAP_ORGANIZATION_SOURCE_ID,
      filter: resolveSelectedSameLocationBadgeFilter(selectedFilter),
      layout: {
        "text-field": ["to-string", ["get", "sameLocationCount"]],
        "text-size": 9,
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        "text-offset": [0.86, 0.86],
        "text-allow-overlap": true,
        "text-ignore-placement": true,
      },
      paint: {
        "text-color": "#FFFFFF",
        "text-halo-color": "rgba(28, 28, 30, 0.88)",
        "text-halo-width": 4,
      },
    })
  }
}

function refreshLayerContracts(map: mapboxgl.Map) {
  setMapFilterSafely(map, PUBLIC_MAP_CLUSTER_SOURCE_CLUSTER_LAYER_ID, ["has", "point_count"])
  setMapFilterSafely(map, PUBLIC_MAP_UNCLUSTERED_SHADOW_LAYER_ID, resolveVisiblePointFilter())
  setMapFilterSafely(map, PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID, resolveVisiblePointFilter())
  setMapFilterSafely(map, PUBLIC_MAP_SAME_LOCATION_COUNT_LAYER_ID, resolveSameLocationBadgeFilter())
  setMapLayoutPropertySafely(
    map,
    PUBLIC_MAP_CLUSTER_SOURCE_CLUSTER_LAYER_ID,
    "icon-image",
    ["get", "clusterImageId"],
  )
  setMapLayoutPropertySafely(
    map,
    PUBLIC_MAP_CLUSTER_SOURCE_CLUSTER_LAYER_ID,
    "icon-size",
    PUBLIC_MAP_CLUSTER_ICON_SIZE,
  )
  setMapLayoutPropertySafely(
    map,
    PUBLIC_MAP_UNCLUSTERED_SHADOW_LAYER_ID,
    "icon-image",
    PUBLIC_MAP_POINT_SHADOW_KEY,
  )
  setMapLayoutPropertySafely(
    map,
    PUBLIC_MAP_UNCLUSTERED_SHADOW_LAYER_ID,
    "icon-size",
    resolvePublicMapPointIconSize(),
  )
  setMapLayoutPropertySafely(
    map,
    PUBLIC_MAP_SELECTED_POINT_SHADOW_LAYER_ID,
    "icon-size",
    resolvePublicMapSelectedPointIconSize(),
  )
  setMapPaintPropertySafely(
    map,
    PUBLIC_MAP_UNCLUSTERED_SHADOW_LAYER_ID,
    "icon-opacity",
    resolvePublicMapPointShadowOpacity(),
  )
  setMapPaintPropertySafely(
    map,
    PUBLIC_MAP_SELECTED_POINT_SHADOW_LAYER_ID,
    "icon-opacity",
    0.78,
  )
  setMapLayoutPropertySafely(
    map,
    PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID,
    "icon-image",
    buildPublicMapIconImageExpression(),
  )
  setMapLayoutPropertySafely(
    map,
    PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID,
    "icon-allow-overlap",
    false,
  )
  setMapLayoutPropertySafely(
    map,
    PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID,
    "icon-ignore-placement",
    false,
  )
}

function assertPublicMapLayerContract(map: mapboxgl.Map) {
  const missingLayerIds = REQUIRED_PUBLIC_MAP_LAYER_IDS.filter((layerId) => {
    const layer = getMapLayerSafely(map, layerId)
    return isMapStyleAccessError(layer) || !layer
  })

  if (missingLayerIds.length === 0) return true

  if (process.env.NODE_ENV !== "production") {
    console.error("[public-map] required marker layers missing after ensure", {
      missingLayerIds,
    })
  }

  ensureClusterLayers(map)
  ensurePointLayers(map)

  return REQUIRED_PUBLIC_MAP_LAYER_IDS.every((layerId) => {
    const layer = getMapLayerSafely(map, layerId)
    return !isMapStyleAccessError(layer) && Boolean(layer)
  })
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
