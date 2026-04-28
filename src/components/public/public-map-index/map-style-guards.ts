import type mapboxgl from "mapbox-gl"

export const MAP_STYLE_ACCESS_ERROR = Symbol("map-style-access-error")

function warnPublicMapStyleFailure(message: string, details: Record<string, unknown>) {
  if (process.env.NODE_ENV === "production") return
  console.warn(message, details)
}

export function getMapSourceSafely<T = ReturnType<mapboxgl.Map["getSource"]>>(
  map: mapboxgl.Map,
  sourceId: string,
) {
  try {
    return map.getSource(sourceId) as T | undefined
  } catch {
    return MAP_STYLE_ACCESS_ERROR
  }
}

export function getMapLayerSafely(
  map: mapboxgl.Map,
  layerId: string,
) {
  try {
    return map.getLayer(layerId)
  } catch {
    return MAP_STYLE_ACCESS_ERROR
  }
}

export function isMapStyleAccessError(value: unknown): value is typeof MAP_STYLE_ACCESS_ERROR {
  return value === MAP_STYLE_ACCESS_ERROR
}

export function addMapSourceSafely(
  map: mapboxgl.Map,
  sourceId: string,
  source: mapboxgl.AnySourceData,
) {
  try {
    map.addSource(sourceId, source)
    return true
  } catch (error) {
    warnPublicMapStyleFailure("[public-map] addSource failed", {
      error,
      sourceId,
    })
    return false
  }
}

export function addMapLayerSafely(
  map: mapboxgl.Map,
  layer: mapboxgl.AnyLayer,
) {
  try {
    map.addLayer(layer)
    return true
  } catch (error) {
    warnPublicMapStyleFailure("[public-map] addLayer failed", {
      error,
      layerId: layer.id,
    })
    return false
  }
}

export function setMapFilterSafely(
  map: mapboxgl.Map,
  layerId: string,
  filter?: mapboxgl.FilterSpecification | null,
) {
  try {
    map.setFilter(layerId, filter)
    return true
  } catch {
    return false
  }
}

export function setMapPaintPropertySafely(
  map: mapboxgl.Map,
  layerId: string,
  name: string,
  value: unknown,
) {
  try {
    ;(map as mapboxgl.Map & {
      setPaintProperty: (layerId: string, name: string, value: unknown) => void
    }).setPaintProperty(layerId, name, value)
    return true
  } catch {
    return false
  }
}

export function setMapLayoutPropertySafely(
  map: mapboxgl.Map,
  layerId: string,
  name: string,
  value: unknown,
) {
  try {
    ;(map as mapboxgl.Map & {
      setLayoutProperty: (layerId: string, name: string, value: unknown) => void
    }).setLayoutProperty(layerId, name, value)
    return true
  } catch {
    return false
  }
}
