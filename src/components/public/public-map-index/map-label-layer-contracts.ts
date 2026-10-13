import type mapboxgl from "mapbox-gl"
import type { PublicMapTheme } from "@/lib/public-map/public-map-theme"

import {
  buildPublicMapClusterLabelExpression,
  buildPublicMapPointLabelExpression,
  PUBLIC_MAP_MARKER_SELECTION_TRANSITION,
  resolvePublicMapClusterLabelOffset,
  resolvePublicMapClusterLabelTextSize,
  resolvePublicMapPointLabelOffset,
  resolvePublicMapPointLabelTextSize,
  resolvePublicMapSelectedPointLabelOffset,
} from "@/lib/public-map/public-map-layer-api"

import {
  PUBLIC_MAP_CLUSTER_LABEL_LAYER_ID,
  PUBLIC_MAP_ORGANIZATION_SOURCE_ID,
  PUBLIC_MAP_POINT_LABEL_LAYER_ID,
  PUBLIC_MAP_SELECTED_POINT_LABEL_LAYER_ID,
} from "./map-view-helpers"
import {
  addMapLayerSafely,
  getMapLayerSafely,
  setMapFilterSafely,
  setMapLayoutPropertySafely,
  setMapPaintPropertySafely,
} from "./map-style-guards"
import {
  resolveSelectedPointFilter,
  resolveVisiblePointFilter,
} from "./map-layer-filters"

const PUBLIC_MAP_LABEL_FONT = ["Open Sans Semibold", "Arial Unicode MS Bold"]

function resolvePublicMapLabelPaint(theme: PublicMapTheme) {
  if (theme === "dark") {
    return {
      clusterColor: "rgba(250, 250, 250, 0.9)",
      clusterHaloColor: "rgba(9, 9, 11, 0.92)",
      clusterHaloBlur: 0.25,
      clusterHaloWidth: 1.45,
      pointColor: "rgba(250, 250, 250, 0.92)",
      pointHaloColor: "rgba(9, 9, 11, 0.92)",
      pointHaloBlur: 0.25,
      pointHaloWidth: 1.5,
    }
  }

  return {
    clusterColor: "rgba(15, 23, 42, 0.82)",
    clusterHaloColor: "rgba(255, 255, 255, 0.9)",
    clusterHaloBlur: 0.16,
    clusterHaloWidth: 0.85,
    pointColor: "rgba(15, 23, 42, 0.86)",
    pointHaloColor: "rgba(255, 255, 255, 0.9)",
    pointHaloBlur: 0.16,
    pointHaloWidth: 0.9,
  }
}

export function ensurePublicMapClusterLabelLayer(
  map: mapboxgl.Map,
  theme: PublicMapTheme = "light"
) {
  if (getMapLayerSafely(map, PUBLIC_MAP_CLUSTER_LABEL_LAYER_ID)) return
  const labelPaint = resolvePublicMapLabelPaint(theme)
  addMapLayerSafely(map, {
    id: PUBLIC_MAP_CLUSTER_LABEL_LAYER_ID,
    type: "symbol",
    source: PUBLIC_MAP_ORGANIZATION_SOURCE_ID,
    filter: ["has", "point_count"],
    layout: {
      "text-field": buildPublicMapClusterLabelExpression(),
      "text-font": PUBLIC_MAP_LABEL_FONT,
      "text-size": resolvePublicMapClusterLabelTextSize(),
      "text-anchor": "top",
      "text-offset": resolvePublicMapClusterLabelOffset(),
      "text-max-width": 9,
      "text-padding": 4,
      "text-allow-overlap": true,
      "text-ignore-placement": true,
    },
    paint: {
      "text-color": labelPaint.clusterColor,
      "text-halo-color": labelPaint.clusterHaloColor,
      "text-halo-width": labelPaint.clusterHaloWidth,
      "text-halo-blur": labelPaint.clusterHaloBlur,
    },
  })
}

export function ensurePublicMapPointLabelLayer(
  map: mapboxgl.Map,
  theme: PublicMapTheme = "light"
) {
  if (getMapLayerSafely(map, PUBLIC_MAP_POINT_LABEL_LAYER_ID)) return
  const labelPaint = resolvePublicMapLabelPaint(theme)
  addMapLayerSafely(map, {
    id: PUBLIC_MAP_POINT_LABEL_LAYER_ID,
    type: "symbol",
    source: PUBLIC_MAP_ORGANIZATION_SOURCE_ID,
    filter: resolveVisiblePointFilter(),
    layout: {
      "text-field": buildPublicMapPointLabelExpression(),
      "text-font": PUBLIC_MAP_LABEL_FONT,
      "text-size": resolvePublicMapPointLabelTextSize(),
      "text-anchor": "top",
      "text-offset": resolvePublicMapPointLabelOffset(),
      "text-max-width": 10,
      "text-padding": 4,
      "text-allow-overlap": false,
      "text-ignore-placement": false,
    },
    paint: {
      "text-color": labelPaint.pointColor,
      "text-halo-color": labelPaint.pointHaloColor,
      "text-halo-width": labelPaint.pointHaloWidth,
      "text-halo-blur": labelPaint.pointHaloBlur,
    },
  })
}

export function ensurePublicMapSelectedPointLabelLayer(
  map: mapboxgl.Map,
  theme: PublicMapTheme = "light"
) {
  if (getMapLayerSafely(map, PUBLIC_MAP_SELECTED_POINT_LABEL_LAYER_ID)) return
  const labelPaint = resolvePublicMapLabelPaint(theme)
  addMapLayerSafely(map, {
    id: PUBLIC_MAP_SELECTED_POINT_LABEL_LAYER_ID,
    type: "symbol",
    source: PUBLIC_MAP_ORGANIZATION_SOURCE_ID,
    filter: resolveSelectedPointFilter({
      selectedOrganizationId: null,
      activeSameLocationGroupKey: null,
    }),
    layout: {
      "text-field": buildPublicMapPointLabelExpression(),
      "text-font": PUBLIC_MAP_LABEL_FONT,
      "text-size": resolvePublicMapPointLabelTextSize(),
      "text-anchor": "top",
      "text-offset": resolvePublicMapSelectedPointLabelOffset(),
      "text-max-width": 10,
      "text-padding": 4,
      "text-allow-overlap": true,
      "text-ignore-placement": true,
    },
    paint: {
      "text-color": labelPaint.pointColor,
      "text-halo-color": labelPaint.pointHaloColor,
      "text-halo-width": labelPaint.pointHaloWidth,
      "text-halo-blur": labelPaint.pointHaloBlur,
      "text-opacity": 1,
      "text-opacity-transition": PUBLIC_MAP_MARKER_SELECTION_TRANSITION,
    },
  })
}

export function refreshPublicMapLabelLayerContracts(
  map: mapboxgl.Map,
  theme: PublicMapTheme = "light"
) {
  const labelPaint = resolvePublicMapLabelPaint(theme)
  setMapFilterSafely(map, PUBLIC_MAP_CLUSTER_LABEL_LAYER_ID, [
    "has",
    "point_count",
  ])
  setMapFilterSafely(
    map,
    PUBLIC_MAP_POINT_LABEL_LAYER_ID,
    resolveVisiblePointFilter()
  )
  setMapLayoutPropertySafely(
    map,
    PUBLIC_MAP_CLUSTER_LABEL_LAYER_ID,
    "text-field",
    buildPublicMapClusterLabelExpression()
  )
  setMapLayoutPropertySafely(
    map,
    PUBLIC_MAP_CLUSTER_LABEL_LAYER_ID,
    "text-size",
    resolvePublicMapClusterLabelTextSize()
  )
  setMapLayoutPropertySafely(
    map,
    PUBLIC_MAP_CLUSTER_LABEL_LAYER_ID,
    "text-offset",
    resolvePublicMapClusterLabelOffset()
  )
  setMapLayoutPropertySafely(
    map,
    PUBLIC_MAP_CLUSTER_LABEL_LAYER_ID,
    "text-allow-overlap",
    true
  )
  setMapLayoutPropertySafely(
    map,
    PUBLIC_MAP_CLUSTER_LABEL_LAYER_ID,
    "text-ignore-placement",
    true
  )
  setMapPaintPropertySafely(
    map,
    PUBLIC_MAP_CLUSTER_LABEL_LAYER_ID,
    "text-color",
    labelPaint.clusterColor
  )
  setMapPaintPropertySafely(
    map,
    PUBLIC_MAP_CLUSTER_LABEL_LAYER_ID,
    "text-halo-color",
    labelPaint.clusterHaloColor
  )
  setMapPaintPropertySafely(
    map,
    PUBLIC_MAP_CLUSTER_LABEL_LAYER_ID,
    "text-halo-width",
    labelPaint.clusterHaloWidth
  )
  setMapPaintPropertySafely(
    map,
    PUBLIC_MAP_CLUSTER_LABEL_LAYER_ID,
    "text-halo-blur",
    labelPaint.clusterHaloBlur
  )
  setMapLayoutPropertySafely(
    map,
    PUBLIC_MAP_POINT_LABEL_LAYER_ID,
    "text-field",
    buildPublicMapPointLabelExpression()
  )
  setMapLayoutPropertySafely(
    map,
    PUBLIC_MAP_POINT_LABEL_LAYER_ID,
    "text-size",
    resolvePublicMapPointLabelTextSize()
  )
  setMapLayoutPropertySafely(
    map,
    PUBLIC_MAP_POINT_LABEL_LAYER_ID,
    "text-offset",
    resolvePublicMapPointLabelOffset()
  )
  setMapLayoutPropertySafely(
    map,
    PUBLIC_MAP_SELECTED_POINT_LABEL_LAYER_ID,
    "text-field",
    buildPublicMapPointLabelExpression()
  )
  setMapLayoutPropertySafely(
    map,
    PUBLIC_MAP_SELECTED_POINT_LABEL_LAYER_ID,
    "text-size",
    resolvePublicMapPointLabelTextSize()
  )
  setMapLayoutPropertySafely(
    map,
    PUBLIC_MAP_SELECTED_POINT_LABEL_LAYER_ID,
    "text-offset",
    resolvePublicMapSelectedPointLabelOffset()
  )
  setMapLayoutPropertySafely(
    map,
    PUBLIC_MAP_SELECTED_POINT_LABEL_LAYER_ID,
    "text-allow-overlap",
    true
  )
  setMapLayoutPropertySafely(
    map,
    PUBLIC_MAP_SELECTED_POINT_LABEL_LAYER_ID,
    "text-ignore-placement",
    true
  )
  setMapPaintPropertySafely(
    map,
    PUBLIC_MAP_POINT_LABEL_LAYER_ID,
    "text-color",
    labelPaint.pointColor
  )
  setMapPaintPropertySafely(
    map,
    PUBLIC_MAP_POINT_LABEL_LAYER_ID,
    "text-halo-color",
    labelPaint.pointHaloColor
  )
  setMapPaintPropertySafely(
    map,
    PUBLIC_MAP_POINT_LABEL_LAYER_ID,
    "text-halo-width",
    labelPaint.pointHaloWidth
  )
  setMapPaintPropertySafely(
    map,
    PUBLIC_MAP_POINT_LABEL_LAYER_ID,
    "text-halo-blur",
    labelPaint.pointHaloBlur
  )
  setMapPaintPropertySafely(
    map,
    PUBLIC_MAP_SELECTED_POINT_LABEL_LAYER_ID,
    "text-color",
    labelPaint.pointColor
  )
  setMapPaintPropertySafely(
    map,
    PUBLIC_MAP_SELECTED_POINT_LABEL_LAYER_ID,
    "text-halo-color",
    labelPaint.pointHaloColor
  )
  setMapPaintPropertySafely(
    map,
    PUBLIC_MAP_SELECTED_POINT_LABEL_LAYER_ID,
    "text-halo-width",
    labelPaint.pointHaloWidth
  )
  setMapPaintPropertySafely(
    map,
    PUBLIC_MAP_SELECTED_POINT_LABEL_LAYER_ID,
    "text-halo-blur",
    labelPaint.pointHaloBlur
  )
  setMapPaintPropertySafely(
    map,
    PUBLIC_MAP_SELECTED_POINT_LABEL_LAYER_ID,
    "text-opacity",
    1
  )
  setMapPaintPropertySafely(
    map,
    PUBLIC_MAP_SELECTED_POINT_LABEL_LAYER_ID,
    "text-opacity-transition",
    PUBLIC_MAP_MARKER_SELECTION_TRANSITION
  )
}
