import type mapboxgl from "mapbox-gl"

export type PublicMapClusterBbox = [number, number, number, number]

const BBOX_PADDING_RATIO = 0.18

function clampLatitude(value: number) {
  return Math.max(-85, Math.min(85, value))
}

export function resolvePublicMapClusterZoom(map: mapboxgl.Map) {
  const zoom = Math.floor(map.getZoom())
  if (!Number.isFinite(zoom)) return 0
  return Math.max(0, Math.min(22, zoom))
}

export function resolvePublicMapClusterBbox(map: mapboxgl.Map): PublicMapClusterBbox {
  const bounds = map.getBounds()
  if (!bounds) return [-180, -85, 180, 85]

  const west = bounds.getWest()
  const east = bounds.getEast()
  const south = bounds.getSouth()
  const north = bounds.getNorth()
  const longitudeSpan = Math.max(0.01, Math.abs(east - west))
  const latitudeSpan = Math.max(0.01, Math.abs(north - south))
  const longitudePadding = longitudeSpan * BBOX_PADDING_RATIO
  const latitudePadding = latitudeSpan * BBOX_PADDING_RATIO
  const paddedWest = west - longitudePadding
  const paddedEast = east + longitudePadding
  const paddedSouth = clampLatitude(south - latitudePadding)
  const paddedNorth = clampLatitude(north + latitudePadding)

  if (paddedWest < -180 || paddedEast > 180 || paddedWest >= paddedEast) {
    return [-180, paddedSouth, 180, paddedNorth]
  }

  return [
    paddedWest,
    paddedSouth,
    paddedEast,
    paddedNorth,
  ]
}

export function buildPublicMapClusterRequestSignature({
  bbox,
  zoom,
}: {
  bbox: PublicMapClusterBbox
  zoom: number
}) {
  return `${zoom}:${bbox.map((value) => value.toFixed(4)).join(",")}`
}

export type PublicMapClusterViewportQueryState = {
  lastViewportKey: string
  querySeq: number
}

export function createPublicMapClusterViewportQueryState(): PublicMapClusterViewportQueryState {
  return {
    lastViewportKey: "",
    querySeq: 0,
  }
}

export function buildPublicMapClusterViewportKey({
  bbox,
  zoom,
  dataVersion,
}: {
  bbox: PublicMapClusterBbox
  zoom: number
  dataVersion: string
}) {
  return `${dataVersion}:${buildPublicMapClusterRequestSignature({ bbox, zoom })}`
}

export function preparePublicMapClusterViewportQuery({
  state,
  bbox,
  zoom,
  dataVersion,
}: {
  state: PublicMapClusterViewportQueryState
  bbox: PublicMapClusterBbox
  zoom: number
  dataVersion: string
}) {
  const viewportKey = buildPublicMapClusterViewportKey({
    bbox,
    zoom,
    dataVersion,
  })
  if (viewportKey === state.lastViewportKey) {
    return {
      shouldQuery: false,
      viewportKey,
      querySeq: state.querySeq,
    }
  }

  state.lastViewportKey = viewportKey
  state.querySeq += 1
  return {
    shouldQuery: true,
    viewportKey,
    querySeq: state.querySeq,
  }
}
