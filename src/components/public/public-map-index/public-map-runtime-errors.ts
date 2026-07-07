export const MAPBOX_LOAD_ERROR_MESSAGE =
  "Mapbox couldn't load the map. Check your token and domain restrictions."
export const MAPBOX_RUNTIME_ERROR_MESSAGE =
  "Mapbox hit a map loading issue. Refresh the page or try again."

type PublicMapRuntimeErrorLike = {
  message?: unknown
  status?: unknown
  statusCode?: unknown
  url?: unknown
  request?: {
    url?: unknown
  }
}

function readMapboxRuntimeError(error: unknown): PublicMapRuntimeErrorLike {
  return error && typeof error === "object"
    ? (error as PublicMapRuntimeErrorLike)
    : {}
}

function readMapboxRuntimeErrorStatus(error: unknown) {
  const candidate = readMapboxRuntimeError(error)
  const status = candidate.status ?? candidate.statusCode
  return typeof status === "number" && Number.isFinite(status) ? status : null
}

function readMapboxRuntimeErrorMessage(error: unknown) {
  const message = readMapboxRuntimeError(error).message
  return typeof message === "string" ? message : ""
}

function readMapboxRuntimeErrorUrl(error: unknown) {
  const candidate = readMapboxRuntimeError(error)
  const url = candidate.url ?? candidate.request?.url
  return typeof url === "string" ? url : ""
}

function readMapboxRuntimeErrorDetails(error: unknown) {
  return `${readMapboxRuntimeErrorUrl(error)} ${readMapboxRuntimeErrorMessage(
    error
  )}`
}

export function isRecoverablePublicMapTileError(error: unknown) {
  const status = readMapboxRuntimeErrorStatus(error)
  if (status !== 401 && status !== 403) return false

  const details = readMapboxRuntimeErrorDetails(error)
  return (
    details.includes("/v4/") ||
    details.includes(".pbf") ||
    details.includes(".jpg") ||
    details.includes(".webp") ||
    details.includes("/raster/") ||
    details.includes("/tiles/") ||
    details.includes("vector.pbf") ||
    details.includes("mapbox.mapbox-")
  )
}

function isRecoverablePublicMapMarkerImageError(error: unknown) {
  const details = readMapboxRuntimeErrorDetails(error)
  const referencesPublicMapImage =
    details.includes("public-map-marker-") ||
    details.includes("cluster-badge") ||
    details.includes("public-map-point-shadow")
  if (!referencesPublicMapImage) return false

  const lowerDetails = details.toLowerCase()
  return (
    lowerDetails.includes("image") &&
    (lowerDetails.includes("could not be loaded") ||
      lowerDetails.includes("not found") ||
      lowerDetails.includes("not been added") ||
      lowerDetails.includes("does not exist") ||
      lowerDetails.includes("missing"))
  )
}

export function resolvePublicMapRuntimeErrorMessage(error: unknown) {
  if (isRecoverablePublicMapTileError(error)) return null
  if (isRecoverablePublicMapMarkerImageError(error)) return null

  const status = readMapboxRuntimeErrorStatus(error)
  const details = readMapboxRuntimeErrorDetails(error).toLowerCase()

  if (
    status === 401 ||
    status === 403 ||
    details.includes("/styles/v1/") ||
    details.includes("access token") ||
    details.includes("unauthorized") ||
    details.includes("forbidden")
  ) {
    return MAPBOX_LOAD_ERROR_MESSAGE
  }

  return MAPBOX_RUNTIME_ERROR_MESSAGE
}
