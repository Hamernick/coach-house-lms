import type mapboxgl from "mapbox-gl"
import type { PublicMapTheme } from "@/lib/public-map/public-map-theme"

import {
  buildPublicMapIconImageExpression,
  buildPublicMapSelectedIconImageExpression,
  PUBLIC_MAP_MARKER_SELECTION_TRANSITION,
  PUBLIC_MAP_POINT_SHADOW_KEY,
  resolvePublicMapPointIconSize,
  resolvePublicMapPointShadowOpacity,
  resolvePublicMapPointShadowSize,
  resolvePublicMapSelectedPointIconSize,
  resolvePublicMapSelectedPointShadowOpacity,
  resolvePublicMapSelectedPointShadowSize,
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
  getMapLayerSafely,
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
import {
  ensurePublicMapClusterLabelLayer,
  ensurePublicMapPointLabelLayer,
  ensurePublicMapSelectedPointLabelLayer,
  refreshPublicMapLabelLayerContracts,
} from "./map-label-layer-contracts"
import { assertPublicMapLayerContractWithRepair } from "./map-layer-contract-assertion"

const PUBLIC_MAP_CLUSTER_ICON_SIZE = 1

export function ensureClusterLayers(
  map: mapboxgl.Map,
  markerTheme: PublicMapTheme = "light"
) {
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

  ensurePublicMapClusterLabelLayer(map, markerTheme)
}

export function ensurePointLayers(
  map: mapboxgl.Map,
  markerTheme: PublicMapTheme = "light"
) {
  if (!getMapLayerSafely(map, PUBLIC_MAP_UNCLUSTERED_SHADOW_LAYER_ID)) {
    addMapLayerSafely(map, {
      id: PUBLIC_MAP_UNCLUSTERED_SHADOW_LAYER_ID,
      type: "symbol",
      source: PUBLIC_MAP_ORGANIZATION_SOURCE_ID,
      filter: resolveVisiblePointFilter(),
      layout: {
        "icon-image": PUBLIC_MAP_POINT_SHADOW_KEY,
        "icon-size": resolvePublicMapPointShadowSize(),
        "icon-anchor": "center",
        "icon-offset": [0, 1],
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
      },
      paint: {
        "icon-opacity": resolvePublicMapPointShadowOpacity(),
        "icon-opacity-transition": PUBLIC_MAP_MARKER_SELECTION_TRANSITION,
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
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
        "icon-padding": 4,
      },
      paint: {
        "icon-opacity": 1,
        "icon-opacity-transition": PUBLIC_MAP_MARKER_SELECTION_TRANSITION,
      },
    })
  }

  ensurePublicMapPointLabelLayer(map, markerTheme)

  if (!getMapLayerSafely(map, PUBLIC_MAP_SAME_LOCATION_COUNT_LAYER_ID)) {
    addMapLayerSafely(map, {
      id: PUBLIC_MAP_SAME_LOCATION_COUNT_LAYER_ID,
      type: "symbol",
      source: PUBLIC_MAP_ORGANIZATION_SOURCE_ID,
      filter: resolveSameLocationBadgeFilter(),
      layout: {
        "text-field": "",
        "text-size": 1,
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        "text-offset": [0, 0],
        "text-allow-overlap": true,
        "text-ignore-placement": true,
      },
      paint: {
        "text-color": "rgba(15, 23, 42, 0)",
        "text-halo-color": "rgba(255, 255, 255, 0)",
        "text-halo-width": 0,
        "text-opacity": 0,
      },
    })
  }
}

export function ensureSelectedLayers(
  map: mapboxgl.Map,
  markerTheme: PublicMapTheme = "light"
) {
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
        "icon-size": resolvePublicMapSelectedPointShadowSize(),
        "icon-anchor": "center",
        "icon-offset": [0, 1.5],
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
      },
      paint: {
        "icon-opacity": resolvePublicMapSelectedPointShadowOpacity(),
        "icon-opacity-transition": PUBLIC_MAP_MARKER_SELECTION_TRANSITION,
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
      paint: {
        "icon-opacity": 1,
        "icon-opacity-transition": PUBLIC_MAP_MARKER_SELECTION_TRANSITION,
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
        "text-field": "",
        "text-size": 1,
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        "text-offset": [0, 0],
        "text-allow-overlap": true,
        "text-ignore-placement": true,
      },
      paint: {
        "text-color": "rgba(15, 23, 42, 0)",
        "text-halo-color": "rgba(255, 255, 255, 0)",
        "text-halo-width": 0,
        "text-opacity": 0,
      },
    })
  }

  ensurePublicMapSelectedPointLabelLayer(map, markerTheme)
}

export function refreshLayerContracts(
  map: mapboxgl.Map,
  markerTheme: PublicMapTheme = "light"
) {
  setMapFilterSafely(map, PUBLIC_MAP_CLUSTER_SOURCE_CLUSTER_LAYER_ID, [
    "has",
    "point_count",
  ])
  setMapFilterSafely(
    map,
    PUBLIC_MAP_UNCLUSTERED_SHADOW_LAYER_ID,
    resolveVisiblePointFilter()
  )
  setMapFilterSafely(
    map,
    PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID,
    resolveVisiblePointFilter()
  )
  setMapFilterSafely(
    map,
    PUBLIC_MAP_SAME_LOCATION_COUNT_LAYER_ID,
    resolveSameLocationBadgeFilter()
  )
  setMapLayoutPropertySafely(
    map,
    PUBLIC_MAP_CLUSTER_SOURCE_CLUSTER_LAYER_ID,
    "icon-image",
    ["get", "clusterImageId"]
  )
  setMapLayoutPropertySafely(
    map,
    PUBLIC_MAP_CLUSTER_SOURCE_CLUSTER_LAYER_ID,
    "icon-size",
    PUBLIC_MAP_CLUSTER_ICON_SIZE
  )
  setMapLayoutPropertySafely(
    map,
    PUBLIC_MAP_SAME_LOCATION_COUNT_LAYER_ID,
    "text-field",
    ""
  )
  setMapLayoutPropertySafely(
    map,
    PUBLIC_MAP_SAME_LOCATION_COUNT_LAYER_ID,
    "text-size",
    1
  )
  setMapPaintPropertySafely(
    map,
    PUBLIC_MAP_SAME_LOCATION_COUNT_LAYER_ID,
    "text-halo-width",
    0
  )
  setMapPaintPropertySafely(
    map,
    PUBLIC_MAP_SAME_LOCATION_COUNT_LAYER_ID,
    "text-opacity",
    0
  )
  setMapLayoutPropertySafely(
    map,
    PUBLIC_MAP_SELECTED_POINT_BADGE_LAYER_ID,
    "text-field",
    ""
  )
  setMapLayoutPropertySafely(
    map,
    PUBLIC_MAP_SELECTED_POINT_BADGE_LAYER_ID,
    "text-size",
    1
  )
  setMapPaintPropertySafely(
    map,
    PUBLIC_MAP_SELECTED_POINT_BADGE_LAYER_ID,
    "text-halo-width",
    0
  )
  setMapPaintPropertySafely(
    map,
    PUBLIC_MAP_SELECTED_POINT_BADGE_LAYER_ID,
    "text-opacity",
    0
  )
  setMapLayoutPropertySafely(
    map,
    PUBLIC_MAP_UNCLUSTERED_SHADOW_LAYER_ID,
    "icon-image",
    PUBLIC_MAP_POINT_SHADOW_KEY
  )
  setMapLayoutPropertySafely(
    map,
    PUBLIC_MAP_UNCLUSTERED_SHADOW_LAYER_ID,
    "icon-size",
    resolvePublicMapPointShadowSize()
  )
  setMapLayoutPropertySafely(
    map,
    PUBLIC_MAP_SELECTED_POINT_SHADOW_LAYER_ID,
    "icon-size",
    resolvePublicMapSelectedPointShadowSize()
  )
  setMapPaintPropertySafely(
    map,
    PUBLIC_MAP_UNCLUSTERED_SHADOW_LAYER_ID,
    "icon-opacity",
    resolvePublicMapPointShadowOpacity()
  )
  setMapPaintPropertySafely(
    map,
    PUBLIC_MAP_UNCLUSTERED_SHADOW_LAYER_ID,
    "icon-opacity-transition",
    PUBLIC_MAP_MARKER_SELECTION_TRANSITION
  )
  setMapPaintPropertySafely(
    map,
    PUBLIC_MAP_SELECTED_POINT_SHADOW_LAYER_ID,
    "icon-opacity",
    resolvePublicMapSelectedPointShadowOpacity()
  )
  setMapPaintPropertySafely(
    map,
    PUBLIC_MAP_SELECTED_POINT_SHADOW_LAYER_ID,
    "icon-opacity-transition",
    PUBLIC_MAP_MARKER_SELECTION_TRANSITION
  )
  setMapLayoutPropertySafely(
    map,
    PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID,
    "icon-image",
    buildPublicMapIconImageExpression()
  )
  setMapLayoutPropertySafely(
    map,
    PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID,
    "icon-size",
    resolvePublicMapPointIconSize()
  )
  setMapLayoutPropertySafely(
    map,
    PUBLIC_MAP_SELECTED_POINT_CORE_LAYER_ID,
    "icon-image",
    buildPublicMapSelectedIconImageExpression()
  )
  setMapLayoutPropertySafely(
    map,
    PUBLIC_MAP_SELECTED_POINT_CORE_LAYER_ID,
    "icon-size",
    resolvePublicMapSelectedPointIconSize()
  )
  setMapPaintPropertySafely(
    map,
    PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID,
    "icon-opacity",
    1
  )
  setMapPaintPropertySafely(
    map,
    PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID,
    "icon-opacity-transition",
    PUBLIC_MAP_MARKER_SELECTION_TRANSITION
  )
  setMapPaintPropertySafely(
    map,
    PUBLIC_MAP_SELECTED_POINT_CORE_LAYER_ID,
    "icon-opacity",
    1
  )
  setMapPaintPropertySafely(
    map,
    PUBLIC_MAP_SELECTED_POINT_CORE_LAYER_ID,
    "icon-opacity-transition",
    PUBLIC_MAP_MARKER_SELECTION_TRANSITION
  )
  setMapLayoutPropertySafely(
    map,
    PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID,
    "icon-allow-overlap",
    true
  )
  setMapLayoutPropertySafely(
    map,
    PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID,
    "icon-ignore-placement",
    true
  )
  refreshPublicMapLabelLayerContracts(map, markerTheme)
}

export function assertPublicMapLayerContract(map: mapboxgl.Map) {
  return assertPublicMapLayerContractWithRepair({
    map,
    repair: () => {
      ensureClusterLayers(map)
      ensurePointLayers(map)
      ensureSelectedLayers(map)
    },
  })
}
