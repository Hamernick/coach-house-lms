import type mapboxgl from "mapbox-gl"

export function resolveFeatureCoordinates(feature: mapboxgl.MapboxGeoJSONFeature) {
  if (!feature.geometry || feature.geometry.type !== "Point") return null
  const coordinates = feature.geometry.coordinates
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null
  const longitude = Number(coordinates[0])
  const latitude = Number(coordinates[1])
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null
  return [longitude, latitude] as [number, number]
}

export function normalizeLongitudeToReference({
  longitude,
  referenceLongitude,
}: {
  longitude: number
  referenceLongitude: number
}) {
  let normalized = longitude
  while (normalized - referenceLongitude > 180) normalized -= 360
  while (normalized - referenceLongitude < -180) normalized += 360
  return normalized
}

export function normalizeCoordinatesForMap({
  map,
  coordinates,
}: {
  map: mapboxgl.Map
  coordinates: [number, number]
}) {
  const center = map.getCenter()
  return [
    normalizeLongitudeToReference({
      longitude: coordinates[0],
      referenceLongitude: center.lng,
    }),
    coordinates[1],
  ] as [number, number]
}

export function resolveFeatureCoordinatesForMap({
  map,
  feature,
}: {
  map: mapboxgl.Map
  feature: mapboxgl.MapboxGeoJSONFeature
}) {
  const coordinates = resolveFeatureCoordinates(feature)
  if (!coordinates) return null
  return normalizeCoordinatesForMap({ map, coordinates })
}
