import type mapboxgl from "mapbox-gl"

import {
  PUBLIC_MAP_CLUSTER_LABEL_LAYER_ID,
  PUBLIC_MAP_CLUSTER_SOURCE_CLUSTER_LAYER_ID,
  PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID,
  PUBLIC_MAP_POINT_LABEL_LAYER_ID,
  PUBLIC_MAP_SELECTED_POINT_LABEL_LAYER_ID,
} from "./map-view-helpers"
import { getMapLayerSafely, isMapStyleAccessError } from "./map-style-guards"

const REQUIRED_PUBLIC_MAP_LAYER_IDS = [
  PUBLIC_MAP_CLUSTER_SOURCE_CLUSTER_LAYER_ID,
  PUBLIC_MAP_CLUSTER_LABEL_LAYER_ID,
  PUBLIC_MAP_CLUSTER_SOURCE_POINT_LAYER_ID,
  PUBLIC_MAP_POINT_LABEL_LAYER_ID,
  PUBLIC_MAP_SELECTED_POINT_LABEL_LAYER_ID,
] as const

export function assertPublicMapLayerContractWithRepair({
  map,
  repair,
}: {
  map: mapboxgl.Map
  repair: () => void
}) {
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

  repair()

  return REQUIRED_PUBLIC_MAP_LAYER_IDS.every((layerId) => {
    const layer = getMapLayerSafely(map, layerId)
    return !isMapStyleAccessError(layer) && Boolean(layer)
  })
}
