export const MAPBOX_LOAD_ERROR_MESSAGE =
  "Mapbox couldn't load the map. Check your token and domain restrictions."

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
  return error && typeof error === "object" ? error as PublicMapRuntimeErrorLike : {}
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

export function isRecoverablePublicMapTileError(error: unknown) {
  const status = readMapboxRuntimeErrorStatus(error)
  if (status !== 401 && status !== 403) return false

  const details = `${readMapboxRuntimeErrorUrl(error)} ${readMapboxRuntimeErrorMessage(error)}`
  return (
    details.includes("/v4/") ||
    details.includes(".pbf") ||
    details.includes("vector.pbf") ||
    details.includes("mapbox.mapbox-")
  )
}
