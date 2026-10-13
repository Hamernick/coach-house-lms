import type mapboxgl from "mapbox-gl"

import {
  buildEmptyPublicMapFeatureCollection,
  PUBLIC_MAP_MARKER_IMAGE_FALLBACK_KEY,
  PUBLIC_MAP_MARKER_IMAGE_SELECTED_FALLBACK_KEY,
  type PublicMapFeatureCollection,
} from "@/lib/public-map/public-map-geojson"
import type { PublicMapTheme } from "@/lib/public-map/public-map-theme"
import type { PublicMapMarkerRelevanceTier } from "@/lib/public-map/public-map-marker-relevance"

import {
  resolveRelevantUnselectedPointFilter,
  resolveSavedPointFilter,
  resolveSelectedPointFilter,
} from "./map-layer-filters"
import {
  addMapLayerSafely,
  addMapSourceSafely,
  getMapLayerSafely,
  getMapSourceSafely,
  isMapStyleAccessError,
  removeMapLayerSafely,
  setMapFilterSafely,
  setMapLayoutPropertySafely,
  setMapPaintPropertySafely,
} from "./map-style-guards"
import {
  PUBLIC_MAP_MARKER_LABEL_LAYER_ID,
  PUBLIC_MAP_MARKER_LAYER_ID,
  PUBLIC_MAP_ORGANIZATION_SOURCE_ID,
  PUBLIC_MAP_SAVED_MARKER_LAYER_ID,
  PUBLIC_MAP_SELECTED_MARKER_LABEL_LAYER_ID,
  PUBLIC_MAP_SELECTED_MARKER_LAYER_ID,
} from "./map-view-helpers"

const PUBLIC_MAP_LABEL_FONT = ["Open Sans Semibold", "Arial Unicode MS Bold"]
const PUBLIC_MAP_MARKER_ICON_EXPRESSION = [
  "coalesce",
  ["image", ["get", "markerImageKey"]],
  ["image", PUBLIC_MAP_MARKER_IMAGE_FALLBACK_KEY],
] as mapboxgl.ExpressionSpecification
const PUBLIC_MAP_SELECTED_MARKER_ICON_EXPRESSION = [
  "coalesce",
  ["image", ["concat", ["get", "markerImageKey"], "-selected"]],
  ["image", PUBLIC_MAP_MARKER_IMAGE_SELECTED_FALLBACK_KEY],
] as mapboxgl.ExpressionSpecification
const PUBLIC_MAP_MARKER_LABEL_EXPRESSION = [
  "coalesce",
  ["get", "designation"],
  ["get", "name"],
  "",
] as mapboxgl.ExpressionSpecification
const PUBLIC_MAP_MARKER_SORT_KEY_EXPRESSION = [
  "get",
  "markerSortKey",
] as mapboxgl.ExpressionSpecification
const PUBLIC_MAP_MARKER_LABEL_SIZE = [
  "interpolate",
  ["linear"],
  ["zoom"],
  3,
  10,
  8,
  11,
  12,
  11.5,
  16,
  12,
] as mapboxgl.ExpressionSpecification
const PUBLIC_MAP_MARKER_ICON_SIZE = [
  "interpolate",
  ["linear"],
  ["zoom"],
  3,
  1.25,
  8,
  1.34,
  11,
  1.42,
  14,
  1.5,
  16,
  1.56,
] as mapboxgl.ExpressionSpecification
export const PUBLIC_MAP_SELECTED_MARKER_ICON_SIZE = [
  "interpolate",
  ["linear"],
  ["zoom"],
  3,
  1.55,
  8,
  1.65,
  11,
  1.75,
  14,
  1.85,
  16,
  1.95,
] as mapboxgl.ExpressionSpecification
const PUBLIC_MAP_MARKER_ICON_OFFSET: [number, number] = [0, 8.5]
const PUBLIC_MAP_SELECTED_MARKER_ICON_OFFSET: [number, number] = [0, 9.5]

function resolveLabelPaint(theme: PublicMapTheme) {
  return theme === "dark"
    ? {
        color: "rgba(250, 250, 250, 0.92)",
        haloBlur: 0.25,
        haloColor: "rgba(9, 9, 11, 0.92)",
        haloWidth: 1.5,
      }
    : {
        color: "rgba(15, 23, 42, 0.86)",
        haloBlur: 0.16,
        haloColor: "rgba(255, 255, 255, 0.9)",
        haloWidth: 0.7,
      }
}

function canAttachToMap(map: mapboxgl.Map) {
  try {
    return Boolean(map.getStyle())
  } catch {
    return false
  }
}

function ensureMarkerSource(map: mapboxgl.Map) {
  const source = getMapSourceSafely(map, PUBLIC_MAP_ORGANIZATION_SOURCE_ID)
  if (isMapStyleAccessError(source)) return false
  if (source) return true

  return addMapSourceSafely(map, PUBLIC_MAP_ORGANIZATION_SOURCE_ID, {
    type: "geojson",
    data: buildEmptyPublicMapFeatureCollection(),
  })
}

function ensureMarkerLayer({
  kind,
  map,
  maxRelevanceTier,
  theme,
}: {
  kind: "normal" | "saved" | "selected"
  map: mapboxgl.Map
  maxRelevanceTier: PublicMapMarkerRelevanceTier
  theme: PublicMapTheme
}) {
  const selected = kind === "selected"
  const saved = kind === "saved"
  const layerId = selected
    ? PUBLIC_MAP_SELECTED_MARKER_LAYER_ID
    : saved
      ? PUBLIC_MAP_SAVED_MARKER_LAYER_ID
      : PUBLIC_MAP_MARKER_LAYER_ID
  if (getMapLayerSafely(map, layerId)) return
  const labelPaint = resolveLabelPaint(theme)

  addMapLayerSafely(map, {
    id: layerId,
    type: "symbol",
    source: PUBLIC_MAP_ORGANIZATION_SOURCE_ID,
    filter: selected
      ? resolveSelectedPointFilter({
          selectedOrganizationId: null,
          activeSameLocationGroupKey: null,
        })
      : saved
        ? resolveSavedPointFilter({
            selectedOrganizationId: null,
            activeSameLocationGroupKey: null,
          })
        : resolveRelevantUnselectedPointFilter({
            selectedOrganizationId: null,
            activeSameLocationGroupKey: null,
            maxRelevanceTier,
          }),
    layout: {
      "icon-image": selected
        ? PUBLIC_MAP_SELECTED_MARKER_ICON_EXPRESSION
        : PUBLIC_MAP_MARKER_ICON_EXPRESSION,
      "icon-size": selected
        ? PUBLIC_MAP_SELECTED_MARKER_ICON_SIZE
        : PUBLIC_MAP_MARKER_ICON_SIZE,
      "icon-anchor": "bottom",
      "icon-offset": selected
        ? PUBLIC_MAP_SELECTED_MARKER_ICON_OFFSET
        : PUBLIC_MAP_MARKER_ICON_OFFSET,
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
      "icon-padding": 2,
      "icon-pitch-alignment": "viewport",
      "icon-rotation-alignment": "viewport",
      "text-field": PUBLIC_MAP_MARKER_LABEL_EXPRESSION,
      "text-font": PUBLIC_MAP_LABEL_FONT,
      "text-size": PUBLIC_MAP_MARKER_LABEL_SIZE,
      "text-anchor": "top",
      "text-offset": selected ? [0, 0.52] : [0, 0.45],
      "text-max-width": 10,
      "text-padding": 2,
      "text-allow-overlap": selected,
      "text-ignore-placement": selected,
      "text-optional": true,
      "symbol-sort-key": PUBLIC_MAP_MARKER_SORT_KEY_EXPRESSION,
    },
    paint: {
      "icon-opacity": 1,
      "text-color": labelPaint.color,
      "text-halo-color": labelPaint.haloColor,
      "text-halo-width": labelPaint.haloWidth,
      "text-halo-blur": labelPaint.haloBlur,
    },
  })
}

function refreshMarkerLayerContracts({
  map,
  maxRelevanceTier,
  theme,
}: {
  map: mapboxgl.Map
  maxRelevanceTier: PublicMapMarkerRelevanceTier
  theme: PublicMapTheme
}) {
  const paint = resolveLabelPaint(theme)
  setMapFilterSafely(
    map,
    PUBLIC_MAP_MARKER_LAYER_ID,
    resolveRelevantUnselectedPointFilter({
      activeSameLocationGroupKey: null,
      maxRelevanceTier,
      selectedOrganizationId: null,
    })
  )
  setMapFilterSafely(
    map,
    PUBLIC_MAP_SAVED_MARKER_LAYER_ID,
    resolveSavedPointFilter({
      activeSameLocationGroupKey: null,
      selectedOrganizationId: null,
    })
  )
  setMapLayoutPropertySafely(
    map,
    PUBLIC_MAP_MARKER_LAYER_ID,
    "icon-anchor",
    "bottom"
  )
  setMapLayoutPropertySafely(
    map,
    PUBLIC_MAP_SELECTED_MARKER_LAYER_ID,
    "icon-anchor",
    "bottom"
  )

  for (const [layerId, kind] of [
    [PUBLIC_MAP_MARKER_LAYER_ID, "normal"],
    [PUBLIC_MAP_SAVED_MARKER_LAYER_ID, "saved"],
    [PUBLIC_MAP_SELECTED_MARKER_LAYER_ID, "selected"],
  ] as const) {
    const selected = kind === "selected"
    setMapLayoutPropertySafely(
      map,
      layerId,
      "icon-image",
      selected
        ? PUBLIC_MAP_SELECTED_MARKER_ICON_EXPRESSION
        : PUBLIC_MAP_MARKER_ICON_EXPRESSION
    )
    setMapLayoutPropertySafely(
      map,
      layerId,
      "icon-size",
      selected
        ? PUBLIC_MAP_SELECTED_MARKER_ICON_SIZE
        : PUBLIC_MAP_MARKER_ICON_SIZE
    )
    setMapLayoutPropertySafely(map, layerId, "icon-allow-overlap", true)
    setMapLayoutPropertySafely(map, layerId, "icon-ignore-placement", true)
    setMapLayoutPropertySafely(
      map,
      layerId,
      "icon-offset",
      selected
        ? PUBLIC_MAP_SELECTED_MARKER_ICON_OFFSET
        : PUBLIC_MAP_MARKER_ICON_OFFSET
    )
    setMapLayoutPropertySafely(map, layerId, "icon-padding", 2)
    setMapLayoutPropertySafely(map, layerId, "icon-pitch-alignment", "viewport")
    setMapLayoutPropertySafely(
      map,
      layerId,
      "icon-rotation-alignment",
      "viewport"
    )
    setMapLayoutPropertySafely(
      map,
      layerId,
      "text-field",
      PUBLIC_MAP_MARKER_LABEL_EXPRESSION
    )
    setMapLayoutPropertySafely(map, layerId, "text-anchor", "top")
    setMapLayoutPropertySafely(
      map,
      layerId,
      "text-offset",
      selected ? [0, 0.52] : [0, 0.45]
    )
    setMapLayoutPropertySafely(map, layerId, "text-padding", 2)
    setMapLayoutPropertySafely(map, layerId, "text-allow-overlap", selected)
    setMapLayoutPropertySafely(map, layerId, "text-ignore-placement", selected)
    setMapLayoutPropertySafely(map, layerId, "text-optional", true)
    setMapLayoutPropertySafely(
      map,
      layerId,
      "symbol-sort-key",
      PUBLIC_MAP_MARKER_SORT_KEY_EXPRESSION
    )
    setMapPaintPropertySafely(map, layerId, "text-color", paint.color)
    setMapPaintPropertySafely(map, layerId, "text-halo-color", paint.haloColor)
    setMapPaintPropertySafely(map, layerId, "text-halo-width", paint.haloWidth)
    setMapPaintPropertySafely(map, layerId, "text-halo-blur", paint.haloBlur)
  }
}

export function ensurePublicMapMarkerLayers({
  map,
  maxRelevanceTier = 0,
  theme = "light",
}: {
  map: mapboxgl.Map
  maxRelevanceTier?: PublicMapMarkerRelevanceTier
  theme?: PublicMapTheme
}) {
  if (!canAttachToMap(map) || !ensureMarkerSource(map)) return false

  removeMapLayerSafely(map, PUBLIC_MAP_MARKER_LABEL_LAYER_ID)
  removeMapLayerSafely(map, PUBLIC_MAP_SELECTED_MARKER_LABEL_LAYER_ID)
  ensureMarkerLayer({ kind: "normal", map, maxRelevanceTier, theme })
  ensureMarkerLayer({ kind: "saved", map, maxRelevanceTier, theme })
  ensureMarkerLayer({ kind: "selected", map, maxRelevanceTier, theme })
  refreshMarkerLayerContracts({ map, maxRelevanceTier, theme })

  return [
    PUBLIC_MAP_MARKER_LAYER_ID,
    PUBLIC_MAP_SAVED_MARKER_LAYER_ID,
    PUBLIC_MAP_SELECTED_MARKER_LAYER_ID,
  ].every((layerId) => Boolean(getMapLayerSafely(map, layerId)))
}

export function setPublicMapMarkerSourceData({
  map,
  sourceData,
}: {
  map: mapboxgl.Map
  sourceData: PublicMapFeatureCollection
}) {
  const source = getMapSourceSafely<mapboxgl.GeoJSONSource>(
    map,
    PUBLIC_MAP_ORGANIZATION_SOURCE_ID
  )
  if (isMapStyleAccessError(source) || !source) return false
  source.setData(sourceData)
  return true
}

export function syncPublicMapMarkerSelection({
  activeSameLocationGroupKey,
  map,
  maxRelevanceTier,
  selectedOrganizationId,
}: {
  activeSameLocationGroupKey: string | null
  map: mapboxgl.Map
  maxRelevanceTier: PublicMapMarkerRelevanceTier
  selectedOrganizationId: string | null
}) {
  const selectedFilter = resolveSelectedPointFilter({
    activeSameLocationGroupKey,
    selectedOrganizationId,
  })
  const relevantUnselectedFilter = resolveRelevantUnselectedPointFilter({
    activeSameLocationGroupKey,
    maxRelevanceTier,
    selectedOrganizationId,
  })
  const savedFilter = resolveSavedPointFilter({
    activeSameLocationGroupKey,
    selectedOrganizationId,
  })

  setMapFilterSafely(map, PUBLIC_MAP_MARKER_LAYER_ID, relevantUnselectedFilter)
  setMapFilterSafely(map, PUBLIC_MAP_SAVED_MARKER_LAYER_ID, savedFilter)
  setMapFilterSafely(map, PUBLIC_MAP_SELECTED_MARKER_LAYER_ID, selectedFilter)
}
